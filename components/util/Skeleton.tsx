type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-10 ${className}`}
      aria-hidden="true"
    />
  );
}

type TableSkeletonProps = {
  rows?: number;
  columns: number;
  showHeader?: boolean;
  avatarColumn?: boolean;
  cellClassName?: string;
};

export function TableSkeleton({
  rows = 5,
  columns,
  showHeader = true,
  avatarColumn = false,
  cellClassName = "px-4 py-4",
}: TableSkeletonProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        {showHeader ? (
          <thead className="border-b border-gray-200 bg-gray-10">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className={`${cellClassName} font-medium`}>
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-gray-200 last:border-b-0"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className={cellClassName}>
                  {avatarColumn && colIndex === 0 ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 shrink-0 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  ) : (
                    <Skeleton
                      className={`h-4 ${
                        colIndex === columns - 1 ? "w-8" : "w-24"
                      }`}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200 px-4 py-4"
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function FormFieldsSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function ContentSkeleton({ className = "p-6" }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Skeleton className="size-24 shrink-0 rounded-2xl" />
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function MemberDetailSkeleton() {
  return (
    <div className="p-4 md:p-8">
      <Skeleton className="mb-6 h-4 w-36" />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <Skeleton className="size-16 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="mb-2 h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-4 h-28 rounded-2xl" />
          <Skeleton className="mt-4 h-14 rounded-xl" />
        </section>
      </div>
      <div className="mt-6 space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton className="mb-4 h-6 w-40" />
          <TableSkeleton rows={4} columns={6} cellClassName="px-3 py-3" />
        </section>
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton className="mb-4 h-6 w-32" />
          <CardListSkeleton count={3} />
        </section>
      </div>
    </div>
  );
}

export function ModalDetailSkeleton() {
  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 p-4">
        <Skeleton className="mb-4 h-4 w-24" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
      <div className="rounded-2xl border border-gray-200 p-4">
        <Skeleton className="mb-4 h-4 w-28" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-gray-10">
      <div className="hidden w-66 shrink-0 bg-white p-6 md:block">
        <Skeleton className="size-13 rounded-xl" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 md:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <TableSkeleton rows={6} columns={5} avatarColumn />
        </div>
      </div>
    </div>
  );
}

export function InvitePageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Skeleton className="mx-auto size-16 rounded-2xl" />
          <Skeleton className="mx-auto mt-4 h-6 w-56" />
          <Skeleton className="mx-auto mt-2 h-4 w-72" />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <FormFieldsSkeleton fields={3} />
        </div>
      </div>
    </div>
  );
}
