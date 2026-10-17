import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { SearchScreen } from "@/components/search/SearchScreen";

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-muted">Loading search…</div>}>
        <SearchScreen />
      </Suspense>
    </AppShell>
  );
}
