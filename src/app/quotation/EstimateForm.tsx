"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { IconBadge } from "@/components/ui/IconBadge";
import { cx } from "@/lib/cx";
import { EASE } from "@/lib/animations";
import {
  budgetOptions,
  designOptions,
  featureOptions,
  integrationOptions,
  maintenanceOptions,
  platformOptions,
  serviceOptions,
  timelineOptions,
  volumeOptions,
  type BudgetBand,
  type DesignScope,
  type FeatureKey,
  type IntegrationKey,
  type MaintenancePlan,
  type Platform,
  type ServiceCategory,
  type Timeline,
  type UserVolume,
} from "@/content/quotation-options";
import {
  MAX_LENGTHS,
  MIN_DESCRIPTION_LENGTH,
  isEmail,
  isPhone,
  type FieldErrors,
} from "@/lib/quotation/validation";
import { submitQuotation, type QuotationFormState } from "./actions";
import styles from "./quotation.module.css";

/** Mirrors `QuotationRequirements`, held as form state across steps. */
type Values = {
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  projectName: string;
  service: ServiceCategory | "";
  description: string;
  platforms: Platform[];
  features: FeatureKey[];
  integrations: IntegrationKey[];
  design: DesignScope;
  userVolume: UserVolume;
  timeline: Timeline;
  maintenance: MaintenancePlan;
  budget: BudgetBand;
  notes: string;
  consent: boolean;
};

const INITIAL: Values = {
  contactName: "",
  companyName: "",
  email: "",
  phone: "",
  projectName: "",
  service: "",
  description: "",
  platforms: [],
  features: [],
  integrations: [],
  design: "standard",
  userVolume: "small",
  timeline: "standard",
  maintenance: "basic",
  budget: "undisclosed",
  notes: "",
  consent: false,
};

type FieldName = keyof FieldErrors;

const STEPS: { id: string; label: string; title: string; intro: string; fields: FieldName[] }[] = [
  {
    id: "contact",
    label: "About you",
    title: "How can we reach you?",
    intro: "We use these details to send your quotation and follow up on anything unclear.",
    fields: ["contactName", "email", "phone"],
  },
  {
    id: "project",
    label: "Project",
    title: "What are we building?",
    intro: "The more detail you give, the tighter the estimate we can produce.",
    fields: ["projectName", "service", "description"],
  },
  {
    id: "scope",
    label: "Scope",
    title: "What does it need to do?",
    intro: "Pick everything that applies — each selection is priced as its own line item.",
    fields: ["platforms", "features"],
  },
  {
    id: "delivery",
    label: "Delivery",
    title: "Design, scale, and pace",
    intro: "These shape the design scope, the infrastructure, and the delivery schedule.",
    fields: ["design", "userVolume", "timeline", "maintenance"],
  },
  {
    id: "finish",
    label: "Finish",
    title: "Anything else we should know?",
    intro: "Optional context that helps us pitch the estimate at the right level.",
    fields: ["consent"],
  },
];

const initialState: QuotationFormState = {};

function formatMoneyRange(low: number, high: number, currency: string): string {
  const format = (value: number) => {
    try {
      return new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
    }
  };
  return low === high ? format(low) : `${format(low)} – ${format(high)}`;
}

/**
 * Client-side mirror of the server rules, for immediate per-step feedback only.
 * The server revalidates everything in `submitQuotation`.
 */
function validateStep(step: number, values: Values): FieldErrors {
  const errors: FieldErrors = {};
  const fields = STEPS[step].fields;

  if (fields.includes("contactName") && values.contactName.trim().length < 2) {
    errors.contactName = "Please enter your name.";
  }
  if (fields.includes("email") && !isEmail(values.email.trim().toLowerCase())) {
    errors.email = "Please enter a valid email address.";
  }
  if (fields.includes("phone") && !isPhone(values.phone.trim())) {
    errors.phone = "Please enter a valid phone or WhatsApp number.";
  }
  if (fields.includes("projectName") && values.projectName.trim().length < 2) {
    errors.projectName = "Please name your project or product.";
  }
  if (fields.includes("service") && !values.service) {
    errors.service = "Please choose a service category.";
  }
  if (fields.includes("description") && values.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    errors.description = `Please describe your project in at least ${MIN_DESCRIPTION_LENGTH} characters.`;
  }
  if (fields.includes("platforms") && values.platforms.length === 0) {
    errors.platforms = "Select at least one platform.";
  }
  if (fields.includes("features") && values.features.length === 0) {
    errors.features = "Select at least one key feature.";
  }
  if (fields.includes("consent") && !values.consent) {
    errors.consent = "Please confirm you agree to be contacted about this estimate.";
  }
  return errors;
}

function buildFormData(values: Values): FormData {
  const data = new FormData();
  data.set("contactName", values.contactName);
  data.set("companyName", values.companyName);
  data.set("email", values.email);
  data.set("phone", values.phone);
  data.set("projectName", values.projectName);
  data.set("service", values.service);
  data.set("description", values.description);
  for (const platform of values.platforms) data.append("platforms", platform);
  for (const feature of values.features) data.append("features", feature);
  for (const integration of values.integrations) data.append("integrations", integration);
  data.set("design", values.design);
  data.set("userVolume", values.userVolume);
  data.set("timeline", values.timeline);
  data.set("maintenance", values.maintenance);
  data.set("budget", values.budget);
  data.set("notes", values.notes);
  if (values.consent) data.set("consent", "on");
  return data;
}

export function EstimateForm() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, formAction, pending] = useActionState(submitQuotation, initialState);
  const [seenState, setSeenState] = useState<QuotationFormState>(initialState);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusHeading = useRef(false);

  const isLast = step === STEPS.length - 1;
  const receipt = state.receipt;

  // Adjust state during render when the action result changes, rather than in an
  // effect: server-side field errors replace the client's optimistic ones, and
  // typing in a field clears its error again.
  if (state !== seenState) {
    setSeenState(state);
    if (state.errors) setErrors(state.errors);
  }

  // Move focus to the new step's heading so screen readers announce the change.
  useEffect(() => {
    if (!shouldFocusHeading.current) return;
    shouldFocusHeading.current = false;
    headingRef.current?.focus();
  }, [step]);

  const set = useCallback(<K extends keyof Values>(field: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field as FieldName];
      return next;
    });
  }, []);

  const toggle = useCallback(
    <K extends "platforms" | "features" | "integrations">(field: K, value: Values[K][number]) => {
      setValues((current) => {
        const list = current[field] as Values[K][number][];
        const next = list.includes(value)
          ? list.filter((entry) => entry !== value)
          : [...list, value];
        return { ...current, [field]: next };
      });
      setErrors((current) => {
        if (!(field in current)) return current;
        const next = { ...current };
        delete next[field as FieldName];
        return next;
      });
    },
    [],
  );

  function focusFirstError(fieldErrors: FieldErrors) {
    const first = Object.keys(fieldErrors)[0];
    if (!first) return;
    const element = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
    element?.focus();
  }

  function goNext() {
    const stepErrors = validateStep(step, values);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      focusFirstError(stepErrors);
      return;
    }
    setErrors({});
    shouldFocusHeading.current = true;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setErrors({});
    shouldFocusHeading.current = true;
    setStep((current) => Math.max(current - 1, 0));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLast) {
      goNext();
      return;
    }
    // Re-check every step, not just this one, before hitting the server.
    for (let index = 0; index < STEPS.length; index += 1) {
      const stepErrors = validateStep(index, values);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        shouldFocusHeading.current = true;
        setStep(index);
        return;
      }
    }
    // Must run inside a transition, or `pending` never flips and the button
    // keeps its idle label while the estimate is being generated.
    startTransition(() => {
      formAction(buildFormData(values));
    });
  }

  function startOver() {
    setValues(INITIAL);
    setErrors({});
    setStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const progress = useMemo(
    () => (receipt ? 100 : ((step + (isLast ? 1 : 0)) / STEPS.length) * 100 || 8),
    [step, isLast, receipt],
  );

  if (receipt) {
    return (
      <div className={styles.card}>
        <span className={styles.cardBlob} aria-hidden />
        <motion.div
          className={styles.success}
          role="status"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
        >
          <IconBadge name="check_circle" size={52} iconSize={28} />
          <div>
            <h2 className={styles.successTitle}>Your estimate is ready.</h2>
            <p className={styles.successText}>
              We have generated quotation <strong>{receipt.number}</strong> and our team is
              reviewing it now. The full PDF lands in{" "}
              <strong>{receipt.email}</strong> shortly — usually within{" "}
              {receipt.reviewMinutes} minutes.
            </p>
          </div>

          <dl className={styles.receipt}>
            <div className={styles.receiptCell}>
              <dt className={styles.receiptLabel}>Quotation</dt>
              <dd
                className={cx(styles.receiptValue, styles.receiptValueSm)}
                data-testid="quotation-number"
              >
                {receipt.number}
              </dd>
            </div>
            <div className={styles.receiptCell}>
              <dt className={styles.receiptLabel}>Estimated range</dt>
              <dd className={styles.receiptValue} data-testid="quotation-range">
                {formatMoneyRange(receipt.rangeLow, receipt.rangeHigh, receipt.currency)}
              </dd>
            </div>
            <div className={styles.receiptCell}>
              <dt className={styles.receiptLabel}>Estimated delivery</dt>
              <dd className={cx(styles.receiptValue, styles.receiptValueSm)}>
                {receipt.deliveryLabel}
              </dd>
            </div>
            <div className={styles.receiptCell}>
              <dt className={styles.receiptLabel}>Valid for</dt>
              <dd className={cx(styles.receiptValue, styles.receiptValueSm)}>
                {receipt.validityDays} days
              </dd>
            </div>
          </dl>

          <p className={styles.disclaimer}>
            This is an approximate quotation based on the information provided. Final pricing and
            delivery dates may change after detailed requirement analysis and written confirmation.
          </p>

          <div className={styles.successActions}>
            <Button href="/work" variant="accent" icon="arrow_forward">
              See our work
            </Button>
            <Button variant="outline" onClick={startOver}>
              Start another estimate
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const current = STEPS[step];

  return (
    <div className={styles.card}>
      <span className={styles.cardBlob} aria-hidden />

      <div className={styles.progress}>
        <div className={styles.progressTop}>
          <span className={styles.progressStep}>{current.label}</span>
          <span className={styles.progressCount}>
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${STEPS.length}: ${current.label}`}
        >
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <ol className={styles.steps}>
          {STEPS.map((entry, index) => (
            <li key={entry.id}>
              <button
                type="button"
                className={cx(
                  styles.stepChip,
                  index < step && styles.stepChipDone,
                  index === step && styles.stepChipCurrent,
                )}
                onClick={() => {
                  if (index >= step) return;
                  shouldFocusHeading.current = true;
                  setStep(index);
                }}
                disabled={index > step}
                aria-current={index === step ? "step" : undefined}
              >
                {entry.label}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <form
        className={styles.form}
        onSubmit={onSubmit}
        noValidate
        aria-label="Instant estimate"
      >
        <div className={styles.honeypot} aria-hidden>
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <h2 className={styles.stepTitle} tabIndex={-1} ref={headingRef}>
          {current.title}
        </h2>
        <p className={styles.stepIntro}>{current.intro}</p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            className={styles.fields}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE } }}
            exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
          >
            {step === 0 && (
              <>
                <div className={styles.row2}>
                  <Field
                    id="contactName"
                    label="Your name"
                    error={errors.contactName}
                    value={values.contactName}
                    onChange={(value) => set("contactName", value)}
                    placeholder="Sahan Perera"
                    autoComplete="name"
                    maxLength={MAX_LENGTHS.contactName}
                  />
                  <Field
                    id="companyName"
                    label="Company"
                    optional
                    value={values.companyName}
                    onChange={(value) => set("companyName", value)}
                    placeholder="Lanka Digital"
                    autoComplete="organization"
                    maxLength={MAX_LENGTHS.companyName}
                  />
                </div>
                <div className={styles.row2}>
                  <Field
                    id="email"
                    label="Email address"
                    type="email"
                    error={errors.email}
                    value={values.email}
                    onChange={(value) => set("email", value)}
                    placeholder="sahan@company.lk"
                    autoComplete="email"
                    maxLength={MAX_LENGTHS.email}
                  />
                  <Field
                    id="phone"
                    label="Phone or WhatsApp"
                    type="tel"
                    error={errors.phone}
                    value={values.phone}
                    onChange={(value) => set("phone", value)}
                    placeholder="+94 77 123 4567"
                    autoComplete="tel"
                    maxLength={MAX_LENGTHS.phone}
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <Field
                  id="projectName"
                  label="Project or product name"
                  error={errors.projectName}
                  value={values.projectName}
                  onChange={(value) => set("projectName", value)}
                  placeholder="Ceylon Retail POS"
                  maxLength={MAX_LENGTHS.projectName}
                />

                <OptionGroup
                  name="service"
                  legend="Service category"
                  type="radio"
                  error={errors.service}
                  options={serviceOptions}
                  selected={values.service ? [values.service] : []}
                  onSelect={(value) => set("service", value as ServiceCategory)}
                />

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="description">
                    Project description
                  </label>
                  <textarea
                    id="description"
                    data-field="description"
                    className={cx(
                      styles.control,
                      styles.textarea,
                      errors.description && styles.controlInvalid,
                    )}
                    value={values.description}
                    onChange={(event) => set("description", event.target.value)}
                    placeholder="What problem does this solve? Who uses it? What does success look like? Anything you already have in place?"
                    maxLength={MAX_LENGTHS.description}
                    rows={6}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={
                      errors.description ? "description-error" : "description-counter"
                    }
                  />
                  <span className={styles.counter} id="description-counter">
                    {values.description.trim().length} / {MIN_DESCRIPTION_LENGTH} characters minimum
                  </span>
                  {errors.description && (
                    <p className={styles.error} id="description-error" role="alert">
                      {errors.description}
                    </p>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <OptionGroup
                  name="platforms"
                  legend="Required platforms"
                  type="checkbox"
                  error={errors.platforms}
                  options={platformOptions}
                  selected={values.platforms}
                  onSelect={(value) => toggle("platforms", value as Platform)}
                />
                <OptionGroup
                  name="features"
                  legend="Key features"
                  type="checkbox"
                  error={errors.features}
                  options={featureOptions}
                  selected={values.features}
                  onSelect={(value) => toggle("features", value as FeatureKey)}
                />
                <OptionGroup
                  name="integrations"
                  legend="Third-party integrations (optional)"
                  type="checkbox"
                  options={integrationOptions}
                  selected={values.integrations}
                  onSelect={(value) => toggle("integrations", value as IntegrationKey)}
                />
              </>
            )}

            {step === 3 && (
              <>
                <OptionGroup
                  name="design"
                  legend="Design requirements"
                  type="radio"
                  error={errors.design}
                  options={designOptions}
                  selected={[values.design]}
                  onSelect={(value) => set("design", value as DesignScope)}
                />
                <div className={styles.row2}>
                  <SelectField
                    id="userVolume"
                    label="Expected user volume"
                    value={values.userVolume}
                    onChange={(value) => set("userVolume", value as UserVolume)}
                    options={volumeOptions}
                  />
                  <SelectField
                    id="timeline"
                    label="Preferred timeline"
                    value={values.timeline}
                    onChange={(value) => set("timeline", value as Timeline)}
                    options={timelineOptions}
                  />
                </div>
                <OptionGroup
                  name="maintenance"
                  legend="Support & maintenance"
                  type="radio"
                  error={errors.maintenance}
                  options={maintenanceOptions}
                  selected={[values.maintenance]}
                  onSelect={(value) => set("maintenance", value as MaintenancePlan)}
                />
              </>
            )}

            {step === 4 && (
              <>
                <SelectField
                  id="budget"
                  label="Expected budget"
                  optional
                  value={values.budget}
                  onChange={(value) => set("budget", value as BudgetBand)}
                  options={budgetOptions}
                />
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="notes">
                    Additional notes
                    <span className={styles.optional}>optional</span>
                  </label>
                  <textarea
                    id="notes"
                    data-field="notes"
                    className={cx(styles.control, styles.textarea)}
                    value={values.notes}
                    onChange={(event) => set("notes", event.target.value)}
                    placeholder="Deadlines, existing systems, compliance requirements, anything else."
                    maxLength={MAX_LENGTHS.notes}
                    rows={4}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.consent}>
                    <input
                      type="checkbox"
                      data-field="consent"
                      className={styles.optionInput}
                      checked={values.consent}
                      onChange={(event) => set("consent", event.target.checked)}
                      aria-invalid={Boolean(errors.consent)}
                      aria-describedby={errors.consent ? "consent-error" : undefined}
                    />
                    <span className={styles.consentText}>
                      I agree that Vezvora may contact me about this estimate and store the details
                      I have submitted, as described in the{" "}
                      <a href="/privacy" className={styles.consentLink}>
                        privacy policy
                      </a>
                      .
                    </span>
                  </label>
                  {errors.consent && (
                    <p className={styles.error} id="consent-error" role="alert">
                      {errors.consent}
                    </p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className={styles.actions}>
          {step > 0 && (
            <Button type="button" variant="outline" onClick={goBack} disabled={pending}>
              Back
            </Button>
          )}
          <span className={styles.actionsSpacer} />
          <Button
            type="submit"
            variant="accent"
            size="lg"
            icon={pending ? undefined : "arrow_forward"}
            disabled={pending}
          >
            {pending ? "Generating estimate…" : isLast ? "Get my estimate" : "Continue"}
          </Button>
          {state.error && (
            <p className={styles.formError} role="alert">
              {state.error}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

/* --------------------------------------------------------------- controls */

type FieldProps = {
  id: FieldName | "companyName" | "notes";
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  optional?: boolean;
};

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  optional,
}: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {optional && <span className={styles.optional}>optional</span>}
      </label>
      <input
        id={id}
        data-field={id}
        type={type}
        className={cx(styles.control, error && styles.controlInvalid)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p className={styles.error} id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type OptionGroupProps = {
  name: string;
  legend: string;
  type: "radio" | "checkbox";
  options: { value: string; label: string; hint?: string }[];
  selected: string[];
  onSelect: (value: string) => void;
  error?: string;
};

function OptionGroup({ name, legend, type, options, selected, onSelect, error }: OptionGroupProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupLabel}>{legend}</legend>
      <div
        className={styles.optionGrid}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        {options.map((option, index) => (
          <label key={option.value} className={styles.option}>
            <input
              type={type}
              name={name}
              value={option.value}
              className={styles.optionInput}
              checked={selected.includes(option.value)}
              onChange={() => onSelect(option.value)}
              // Anchor error focus on the first control of the group.
              data-field={index === 0 ? name : undefined}
              aria-invalid={error ? true : undefined}
            />
            <span className={styles.optionText}>
              <span className={styles.optionLabel}>{option.label}</span>
              {option.hint && <span className={styles.optionHint}>{option.hint}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className={styles.error} id={`${name}-error`} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; hint?: string }[];
  optional?: boolean;
};

function SelectField({ id, label, value, onChange, options, optional }: SelectFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {optional && <span className={styles.optional}>optional</span>}
      </label>
      <select
        id={id}
        data-field={id}
        className={styles.control}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.hint ? `${option.label} — ${option.hint}` : option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
