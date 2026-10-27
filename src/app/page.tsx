import { Chat } from "@/components/chat";
import { readManualSections } from "@/lib/manual";

export default async function Home() {
  const sections = await readManualSections();
  return <Chat sections={sections} />;
}
