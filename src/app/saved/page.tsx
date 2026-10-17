import { AppShell } from "@/components/shell/AppShell";
import { SavedScreen } from "@/components/saved/SavedScreen";

export default function Page() {
  return (
    <AppShell>
      <SavedScreen />
    </AppShell>
  );
}
