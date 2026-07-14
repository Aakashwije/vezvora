import type { Metadata } from "next";
import { ContentClient } from "./ContentClient";

export const metadata: Metadata = { title: "Work content" };

export default function ContentPage() {
  return <ContentClient />;
}
