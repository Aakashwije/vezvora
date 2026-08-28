import type { Metadata } from "next";
import { listProjects } from "@/lib/admin/server-store";
import { ContentClient } from "./ContentClient";

export const metadata: Metadata = { title: "Work content" };

export default async function ContentPage() {
  const projects = await listProjects();
  return <ContentClient projects={projects} />;
}
