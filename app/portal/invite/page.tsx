import { Suspense } from "react";
import InviteAcceptPage from "@/components/auth/InviteAcceptPage";
import { InvitePageSkeleton } from "@/components/util/Skeleton";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={<InvitePageSkeleton />}
    >
      <InviteAcceptPage />
    </Suspense>
  );
}
