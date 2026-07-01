import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Noto_Sans_Thai } from "next/font/google";
import AppProvider from "@/providers/app-provider";

export const metadata: Metadata = {
  title: "BOPP Portal",
};

const notoSansThai = Noto_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${notoSansThai.className} h-full antialiased`}>
      <body>
        <Suspense fallback={null}>
          <AppProvider>{children}</AppProvider>
        </Suspense>
      </body>
    </html>
  );
}
