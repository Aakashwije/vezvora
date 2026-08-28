import type { Metadata } from "next";
import { getSettings } from "@/lib/admin/server-store";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsClient settings={settings} />;
}
