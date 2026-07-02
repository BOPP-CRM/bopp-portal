import { Suspense } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import RoleGuard from "@/components/auth/RoleGuard";
import Menu from "@/components/layout/menu/Menu";
import Top from "@/components/layout/menu/Top";
import ReceiptPosModeShell from "@/components/receipts/ReceiptPosModeShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <RoleGuard>
        <ReceiptPosModeShell>
          <div className="md:flex min-h-screen md:h-screen md:overflow-hidden">
            <div data-app-chrome className="shrink-0 md:h-full">
              <Menu />
            </div>
            <div className="flex min-h-0 flex-1 flex-col min-w-0 md:overflow-y-auto">
              <div data-app-chrome className="shrink-0 md:sticky md:top-0 md:z-20">
                <Top />
              </div>
              <main className="flex-1 pt-14 md:pt-0">
                <Suspense fallback={null}>{children}</Suspense>
              </main>
            </div>
          </div>
        </ReceiptPosModeShell>
      </RoleGuard>
    </AuthGuard>
  );
}
