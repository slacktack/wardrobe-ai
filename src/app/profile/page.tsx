import { AppShell } from "@/components/shell/AppShell";
import { ProfileScreen } from "@/components/profile/ProfileScreen";

export default function Page() {
  return (
    <AppShell>
      <ProfileScreen />
    </AppShell>
  );
}
