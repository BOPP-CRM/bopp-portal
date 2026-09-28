import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <CallbackContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CallbackContent({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const { status, message } = await searchParams;
  const isSuccess = status === "success";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-10 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          {isSuccess ? (
            <CheckCircle className="size-12 text-green-600" />
          ) : (
            <XCircle className="size-12 text-red-100" />
          )}

          <h1 className="text-lg font-semibold text-defualt-text">
            {isSuccess ? "เชื่อมต่อ Lazada สำเร็จ" : "เชื่อมต่อ Lazada ไม่สำเร็จ"}
          </h1>

          {message && (
            <p className="text-sm text-gray-100">{decodeURIComponent(message)}</p>
          )}

          <Link
            href="/dashboard/connections?tab=lazada"
            className="mt-2 inline-flex items-center rounded-4xl bg-brown-100 px-5 py-2.5 text-sm font-medium text-white hover:bg-brown-100/80"
          >
            กลับไปหน้า Connections
          </Link>
        </div>
      </div>
    </div>
  );
}
