import ConnectionsPage from "@/components/connections/ConnectionsPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConnectionsPage />
    </Suspense>
  );
}
