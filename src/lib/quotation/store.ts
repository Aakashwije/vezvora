/**
 * Quotation repository.
 *
 * Quotations are stored as one key per record (rather than inside the single
 * admin JSON blob in `lib/admin/server-store.ts`) because they are mutated
 * concurrently by administrators and by the scheduled dispatch worker. A
 * per-record lock plus per-record keys means a worker send and an admin edit
 * can never clobber each other, which a read-modify-write over a shared blob
 * cannot guarantee.
 *
 * Three interchangeable adapters: Upstash Redis on Vercel, a JSON file for
 * local development, and an in-memory adapter for tests.
 */

import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Redis } from "@upstash/redis";
import {
  DEFAULT_PRICING_CONFIG,
  normalizePricingConfig,
  type PricingConfig,
} from "./pricing-config.ts";
import { AUTO_SENDABLE_STATUSES, type QuotationRecord } from "./types.ts";

const NAMESPACE = process.env.QUOTATION_DATA_KEY ?? "vezvora:quotation:v1";
const LOCK_TTL_MS = 15_000;
const LOCK_WAIT_MS = 8_000;

const key = {
  record: (id: string) => `${NAMESPACE}:record:${id}`,
  index: `${NAMESPACE}:index`,
  pending: `${NAMESPACE}:pending`,
  counter: (year: number) => `${NAMESPACE}:counter:${year}`,
  config: `${NAMESPACE}:pricing-config`,
  lock: (id: string) => `${NAMESPACE}:lock:${id}`,
  rate: (bucket: string) => `${NAMESPACE}:rate:${bucket}`,
};

/** Primitive operations each backend must provide. */
type Adapter = {
  readRecord(id: string): Promise<QuotationRecord | null>;
  writeRecord(record: QuotationRecord): Promise<void>;
  listIds(): Promise<string[]>;
  pendingIdsDueBefore(cutoffMs: number): Promise<string[]>;
  nextSequence(year: number): Promise<number>;
  readConfig(): Promise<unknown>;
  writeConfig(config: PricingConfig): Promise<void>;
  acquireLock(id: string, token: string): Promise<boolean>;
  releaseLock(id: string, token: string): Promise<void>;
  hitRateLimit(bucket: string, windowSeconds: number): Promise<number>;
};

/* ------------------------------------------------------------------ Redis */

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token, enableTelemetry: false });
}

function redisAdapter(redis: Redis): Adapter {
  return {
    async readRecord(id) {
      return (await redis.get<QuotationRecord>(key.record(id))) ?? null;
    },
    async writeRecord(record) {
      const createdScore = new Date(record.createdAt).getTime();
      const deadlineScore = new Date(record.reviewDeadline).getTime();
      await redis.set(key.record(record.id), record);
      await redis.zadd(key.index, { score: createdScore, member: record.id });
      // The pending set is the worker's queue: membership mirrors "still awaiting
      // an automatic send", so a hold or a cancel silently drops out of it.
      if (AUTO_SENDABLE_STATUSES.includes(record.status)) {
        await redis.zadd(key.pending, { score: deadlineScore, member: record.id });
      } else {
        await redis.zrem(key.pending, record.id);
      }
    },
    async listIds() {
      return await redis.zrange<string[]>(key.index, 0, -1, { rev: true });
    },
    async pendingIdsDueBefore(cutoffMs) {
      return await redis.zrange<string[]>(key.pending, 0, cutoffMs, { byScore: true });
    },
    async nextSequence(year) {
      return await redis.incr(key.counter(year));
    },
    async readConfig() {
      return await redis.get(key.config);
    },
    async writeConfig(config) {
      await redis.set(key.config, config);
    },
    async acquireLock(id, token) {
      const result = await redis.set(key.lock(id), token, { nx: true, px: LOCK_TTL_MS });
      return result === "OK";
    },
    async releaseLock(id, token) {
      // Only clear a lock we still own, so a slow holder cannot release someone
      // else's lock after its TTL rolled over.
      const current = await redis.get<string>(key.lock(id));
      if (current === token) await redis.del(key.lock(id));
    },
    async hitRateLimit(bucket, windowSeconds) {
      const hits = await redis.incr(key.rate(bucket));
      if (hits === 1) await redis.expire(key.rate(bucket), windowSeconds);
      return hits;
    },
  };
}

/* ------------------------------------------------------- Memory (and file) */

type MemoryState = {
  records: Map<string, QuotationRecord>;
  counters: Map<number, number>;
  config: unknown;
  locks: Map<string, string>;
  rates: Map<string, { hits: number; expiresAt: number }>;
};

function emptyState(): MemoryState {
  return {
    records: new Map(),
    counters: new Map(),
    config: null,
    locks: new Map(),
    rates: new Map(),
  };
}

function memoryAdapter(
  state: MemoryState,
  persist: () => Promise<void> = async () => {},
): Adapter {
  return {
    async readRecord(id) {
      const record = state.records.get(id);
      // Hand back a copy so callers cannot mutate stored state by reference.
      return record ? (structuredClone(record) as QuotationRecord) : null;
    },
    async writeRecord(record) {
      state.records.set(record.id, structuredClone(record) as QuotationRecord);
      await persist();
    },
    async listIds() {
      return [...state.records.values()]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .map((record) => record.id);
    },
    async pendingIdsDueBefore(cutoffMs) {
      return [...state.records.values()]
        .filter(
          (record) =>
            AUTO_SENDABLE_STATUSES.includes(record.status) &&
            new Date(record.reviewDeadline).getTime() <= cutoffMs,
        )
        .sort((a, b) => +new Date(a.reviewDeadline) - +new Date(b.reviewDeadline))
        .map((record) => record.id);
    },
    async nextSequence(year) {
      const next = (state.counters.get(year) ?? 0) + 1;
      state.counters.set(year, next);
      await persist();
      return next;
    },
    async readConfig() {
      return state.config;
    },
    async writeConfig(config) {
      state.config = config;
      await persist();
    },
    async acquireLock(id, token) {
      if (state.locks.has(id)) return false;
      state.locks.set(id, token);
      return true;
    },
    async releaseLock(id, token) {
      if (state.locks.get(id) === token) state.locks.delete(id);
    },
    async hitRateLimit(bucket, windowSeconds) {
      const now = Date.now();
      const entry = state.rates.get(bucket);
      if (!entry || entry.expiresAt <= now) {
        state.rates.set(bucket, { hits: 1, expiresAt: now + windowSeconds * 1000 });
        return 1;
      }
      entry.hits += 1;
      return entry.hits;
    },
  };
}

type FileShape = {
  records: QuotationRecord[];
  counters: Record<string, number>;
  config: unknown;
};

/**
 * Development backend. Next bundles server actions and route handlers
 * separately, so more than one instance of this module can be alive in a single
 * `next start` process, each with its own cache. The file's modification time is
 * therefore checked before every operation: a record written by a server action
 * is visible to the PDF route on its next read. Production uses Redis, where
 * every read already goes to the shared store.
 */
function fileAdapter(): Adapter {
  const dir = process.env.ADMIN_DATA_DIR ?? path.join(process.cwd(), ".data");
  const file = path.join(dir, "quotations.json");
  const state = emptyState();
  let loadedMtimeMs: number | null = null;
  let inFlight: Promise<void> | null = null;

  async function readFromDisk(): Promise<void> {
    try {
      const info = await stat(file);
      if (loadedMtimeMs === info.mtimeMs) return;

      const parsed = JSON.parse(await readFile(file, "utf8")) as FileShape;
      state.records.clear();
      state.counters.clear();
      for (const record of parsed.records ?? []) state.records.set(record.id, record);
      for (const [year, value] of Object.entries(parsed.counters ?? {})) {
        state.counters.set(Number(year), value);
      }
      state.config = parsed.config ?? null;
      loadedMtimeMs = info.mtimeMs;
    } catch {
      // First run, or an unreadable file: keep whatever is already in memory.
    }
  }

  /** Serialise reloads so concurrent operations share one disk read. */
  async function load(): Promise<void> {
    inFlight ??= readFromDisk().finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  async function persist() {
    const payload: FileShape = {
      records: [...state.records.values()],
      counters: Object.fromEntries(state.counters),
      config: state.config,
    };
    await mkdir(dir, { recursive: true });
    // Write-then-rename so a crash mid-write cannot truncate the store.
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    await rename(tmp, file);
    // Record our own write so the next read does not discard in-memory state.
    loadedMtimeMs = (await stat(file)).mtimeMs;
  }

  const inner = memoryAdapter(state, persist);
  // Every operation loads the file once before touching in-memory state.
  return Object.fromEntries(
    Object.entries(inner).map(([name, fn]) => [
      name,
      async (...args: unknown[]) => {
        await load();
        return (fn as (...a: unknown[]) => unknown)(...args);
      },
    ]),
  ) as Adapter;
}

/* ------------------------------------------------------------------ Store */

export type CreateQuotationInput = Omit<
  QuotationRecord,
  "id" | "number" | "createdAt" | "updatedAt"
> & { createdAt?: string };

export class QuotationStore {
  // Declared explicitly rather than as a parameter property: Node's
  // type-stripping test runner does not support that TypeScript shorthand.
  readonly #adapter: Adapter;

  constructor(adapter: Adapter) {
    this.#adapter = adapter;
  }

  async get(id: string): Promise<QuotationRecord | null> {
    if (!isQuotationId(id)) return null;
    return this.#adapter.readRecord(id);
  }

  async list(): Promise<QuotationRecord[]> {
    const ids = await this.#adapter.listIds();
    const records = await Promise.all(ids.map((id) => this.#adapter.readRecord(id)));
    return records.filter((record): record is QuotationRecord => record !== null);
  }

  /** Reserve the next human-readable number for the given year. */
  async nextNumber(year = new Date().getUTCFullYear()): Promise<string> {
    const sequence = await this.#adapter.nextSequence(year);
    return formatQuotationNumber(year, sequence);
  }

  async create(input: CreateQuotationInput): Promise<QuotationRecord> {
    const now = input.createdAt ?? new Date().toISOString();
    const year = new Date(now).getUTCFullYear();
    const record: QuotationRecord = {
      ...input,
      id: `qt_${randomUUID()}`,
      number: await this.nextNumber(year),
      createdAt: now,
      updatedAt: now,
    };
    await this.#adapter.writeRecord(record);
    return record;
  }

  /**
   * Mutate a record while holding its lock. The mutator receives the freshest
   * stored copy — never a caller-held stale one — so status transitions decided
   * inside it are safe against a concurrent writer. Returning `null` aborts.
   */
  async update(
    id: string,
    mutate: (record: QuotationRecord) => QuotationRecord | null | Promise<QuotationRecord | null>,
  ): Promise<QuotationRecord | null> {
    if (!isQuotationId(id)) return null;
    const token = randomUUID();
    const acquired = await this.acquire(id, token);
    if (!acquired) throw new Error("Quotation is busy; please retry.");
    try {
      const current = await this.#adapter.readRecord(id);
      if (!current) return null;
      const next = await mutate(current);
      if (!next) return null;
      const saved: QuotationRecord = { ...next, updatedAt: new Date().toISOString() };
      await this.#adapter.writeRecord(saved);
      return saved;
    } finally {
      await this.#adapter.releaseLock(id, token);
    }
  }

  private async acquire(id: string, token: string): Promise<boolean> {
    const deadline = Date.now() + LOCK_WAIT_MS;
    for (;;) {
      if (await this.#adapter.acquireLock(id, token)) return true;
      if (Date.now() >= deadline) return false;
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }

  /** Quotations whose review window has elapsed and that may still auto-send. */
  async dueForDispatch(now = Date.now()): Promise<QuotationRecord[]> {
    const ids = await this.#adapter.pendingIdsDueBefore(now);
    const records = await Promise.all(ids.map((id) => this.#adapter.readRecord(id)));
    return records.filter(
      (record): record is QuotationRecord =>
        record !== null && AUTO_SENDABLE_STATUSES.includes(record.status),
    );
  }

  async getPricingConfig(): Promise<PricingConfig> {
    const stored = await this.#adapter.readConfig();
    return stored ? normalizePricingConfig(stored) : DEFAULT_PRICING_CONFIG;
  }

  async savePricingConfig(input: unknown): Promise<PricingConfig> {
    const current = await this.getPricingConfig();
    const normalized = normalizePricingConfig(input);
    // Bump the stamped version so documents record which rate card produced them.
    const next: PricingConfig = { ...normalized, version: current.version + 1 };
    await this.#adapter.writeConfig(next);
    return next;
  }

  /** Fixed-window counter. Returns true when this hit exceeds the allowance. */
  async isRateLimited(bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
    const hits = await this.#adapter.hitRateLimit(bucket, windowSeconds);
    return hits > limit;
  }
}

export function formatQuotationNumber(year: number, sequence: number): string {
  return `VZQ-${year}-${String(sequence).padStart(4, "0")}`;
}

/** Guards path-style ids before they reach a storage key. */
export function isQuotationId(value: string): boolean {
  return /^qt_[0-9a-f-]{36}$/i.test(value);
}

/** Isolated store for tests; no Redis, no filesystem. */
export function createMemoryQuotationStore(): QuotationStore {
  return new QuotationStore(memoryAdapter(emptyState()));
}

let singleton: QuotationStore | null = null;

/** The store this deployment uses: Redis when configured, otherwise a file. */
export function quotationStore(): QuotationStore {
  if (!singleton) {
    const redis = redisClient();
    if (!redis && process.env.VERCEL) {
      // Fail loudly rather than writing to an ephemeral serverless filesystem.
      throw new Error(
        "Quotation storage is not configured. Connect Upstash Redis to this Vercel project.",
      );
    }
    singleton = new QuotationStore(redis ? redisAdapter(redis) : fileAdapter());
  }
  return singleton;
}
