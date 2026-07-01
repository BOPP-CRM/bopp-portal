"use client";

import Select from "@/components/util/Select";
import { Skeleton } from "@/components/util/Skeleton";
import { getDashboard } from "@/services/dashboard/dashboard";
import type {
  CouponByNameItem,
  DashboardGranularity,
  DashboardResponse,
  MembersByTierItem,
} from "@/services/dashboard/types";
import {
  formatChartPeriodLabel,
  formatDateTime,
  getThaiDateInputValue,
  toApiDateEndFromDateInput,
  toApiDateStartFromDateInput,
} from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = {
  primary: "#A65F2A",
  secondary: "#FEC76F",
  accent: "#9B288F",
  success: "#00AE34",
  danger: "#D92243",
  muted: "#95CEF9",
};

const TIER_COLORS = [
  "#A65F2A",
  "#FEC76F",
  "#FFD700",
  "#95CEF9",
  "#9B288F",
  "#6A7282",
];

const GRANULARITY_OPTIONS = [
  { value: "day" as const, label: "รายวัน" },
  { value: "week" as const, label: "รายสัปดาห์" },
  { value: "month" as const, label: "รายเดือน" },
];

const COUPON_STATUS_COLORS = {
  redeemed: CHART_COLORS.secondary,
  used: CHART_COLORS.success,
  expired: CHART_COLORS.danger,
};

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

const chartMargin = { top: 8, right: 12, left: 0, bottom: 0 };

function getDefaultDateFrom() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return getThaiDateInputValue(date);
}

function getDefaultDateTo() {
  return getThaiDateInputValue();
}

function getTierColor(item: MembersByTierItem, index: number) {
  if (typeof item.color === "string" && item.color) return item.color;
  return TIER_COLORS[index % TIER_COLORS.length];
}

function buildHourlyData(
  items: DashboardResponse["user_registrations_by_hour"],
) {
  const hourMap = new Map(items.map((item) => [item.hour, item.count]));
  return Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    count: hourMap.get(hour) ?? 0,
  }));
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm">
      {label ? (
        <p className="mb-1 font-medium text-defualt-text">{label}</p>
      ) : null}
      {payload.map((entry) => (
        <p key={entry.name} className="text-gray-100">
          <span style={{ color: entry.color }}>{entry.name}</span>
          {": "}
          <span className="font-medium text-defualt-text">
            {formatNumber(Number(entry.value ?? 0))}
          </span>
        </p>
      ))}
    </div>
  );
}

function ChartContainer({ children }: { children: React.ReactElement }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasSize, setHasSize] = useState(false);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect();
      setHasSize(width > 0 && height > 0);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full min-h-[288px] min-w-0">
      {hasSize ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5 ${className}`}
    >
      <h2 className="text-base font-semibold text-defualt-text">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-gray-100">{description}</p>
      ) : null}
      <div className="mt-4 h-72 w-full min-h-72 min-w-0">{children}</div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-100">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-defualt-text">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-100">{hint}</p> : null}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-gray-100">
      {message}
    </div>
  );
}

function DashboardChartsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <section
            key={index}
            className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${
              index === 2 || index === 3 ? "lg:col-span-2" : ""
            }`}
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-56" />
            <Skeleton className="mt-4 h-72 w-full rounded-xl" />
          </section>
        ))}
      </div>
    </div>
  );
}

function normalizeDashboardResponse(
  response: DashboardResponse,
): DashboardResponse {
  return {
    date_from: response.date_from ?? "",
    date_to: response.date_to ?? "",
    granularity: response.granularity ?? "day",
    members_by_tier: response.members_by_tier ?? [],
    user_registrations: response.user_registrations ?? [],
    user_registrations_by_hour: response.user_registrations_by_hour ?? [],
    receipt_amounts: response.receipt_amounts ?? [],
    coupons_by_name: response.coupons_by_name ?? [],
    points: {
      currency: {
        id: response.points?.currency?.id ?? 0,
        name: response.points?.currency?.name ?? "Point",
        code: response.points?.currency?.code,
      },
      series: response.points?.series ?? [],
    },
  };
}

function DashboardLoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
      <p className="text-sm text-gray-100">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 cursor-pointer rounded-4xl bg-brown-100 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
      >
        ลองโหลดอีกครั้ง
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom);
  const [dateTo, setDateTo] = useState(getDefaultDateTo);
  const [granularity, setGranularity] = useState<DashboardGranularity>("day");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadDashboard = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(null);
    setLoading(true);

    try {
      const response = normalizeDashboardResponse(
        await getDashboard({
          date_from: toApiDateStartFromDateInput(dateFrom),
          date_to: toApiDateEndFromDateInput(dateTo),
          granularity,
        }),
      );
      if (requestId !== requestIdRef.current) return;
      setData(response);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      setError(handleError(loadError).message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [dateFrom, dateTo, granularity]);

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const membersByTier = useMemo(
    () =>
      (data?.members_by_tier ?? [])
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .map((item, index) => ({
          name: item.tier_name,
          count: item.count,
          color: getTierColor(item, index),
        })),
    [data?.members_by_tier],
  );

  const hourlyData = useMemo(
    () => buildHourlyData(data?.user_registrations_by_hour ?? []),
    [data?.user_registrations_by_hour],
  );

  const registrationData = useMemo(
    () =>
      (data?.user_registrations ?? []).map((item) => ({
        period: formatChartPeriodLabel(item.period),
        count: item.count,
      })),
    [data?.user_registrations],
  );

  const receiptData = useMemo(
    () =>
      (data?.receipt_amounts ?? []).map((item) => ({
        period: formatChartPeriodLabel(item.period),
        amount: item.amount,
        count: item.count ?? 0,
      })),
    [data?.receipt_amounts],
  );

  const receiptHasCount = useMemo(
    () =>
      (data?.receipt_amounts ?? []).some(
        (item) => typeof item.count === "number",
      ),
    [data?.receipt_amounts],
  );

  const couponData = useMemo(
    () =>
      [...(data?.coupons_by_name ?? [])]
        .sort((a, b) => b.total_count - a.total_count)
        .map((item: CouponByNameItem) => ({
          name: item.coupon_name,
          redeemed: item.redeemed_count,
          used: item.used_count,
          expired: item.expired_count,
        })),
    [data?.coupons_by_name],
  );

  const pointsData = useMemo(
    () =>
      (data?.points.series ?? []).map((item) => ({
        period: formatChartPeriodLabel(item.period),
        earned: item.earned,
        used: item.used,
      })),
    [data?.points.series],
  );

  const kpis = useMemo(() => {
    const totalMembers = membersByTier.reduce(
      (sum, item) => sum + item.count,
      0,
    );
    const newMembers = registrationData.reduce(
      (sum, item) => sum + item.count,
      0,
    );
    const receiptAmount = receiptData.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const pointsEarned = pointsData.reduce((sum, item) => sum + item.earned, 0);
    const pointsUsed = pointsData.reduce((sum, item) => sum + item.used, 0);

    return {
      totalMembers,
      newMembers,
      receiptAmount,
      pointsEarned,
      pointsUsed,
    };
  }, [membersByTier, pointsData, receiptData, registrationData]);

  const peakHour = useMemo(() => {
    const peak = hourlyData.reduce(
      (best, item) => (item.count > best.count ? item : best),
      { hour: "-", count: 0 },
    );
    return peak.count > 0 ? peak.hour : null;
  }, [hourlyData]);

  const isInitialLoading = loading && !data;
  const isRefreshing = loading && Boolean(data);
  const pointsCurrencyName = data?.points.currency.name ?? "Point";

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-defualt-text">แดชบอร์ด</h1>
        <p className="mt-1 text-sm text-gray-100">
          ภาพรวมสมาชิก ใบเสร็จ คูปอง และ Point
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-defualt-text">
              วันเริ่มต้น
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-defualt-text">
              วันสิ้นสุด
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-defualt-text">
              ช่วงเวลา
            </span>
            <Select
              value={granularity}
              options={GRANULARITY_OPTIONS}
              onChange={setGranularity}
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="w-full cursor-pointer rounded-4xl bg-brown-100 px-4 py-3 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60"
              aria-busy={loading}
            >
              {loading ? "กำลังโหลด..." : "อัปเดตข้อมูล"}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl bg-red-100/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {isInitialLoading ? (
        <DashboardChartsSkeleton />
      ) : data ? (
        <div
          className={`space-y-6 transition-opacity duration-200${isRefreshing ? " opacity-60" : ""}`}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="สมาชิกทั้งหมด"
              value={formatNumber(kpis.totalMembers)}
              hint="จำนวนสมาชิกทั้งหมด"
            />
            <KpiCard
              label="สมาชิกใหม่"
              value={formatNumber(kpis.newMembers)}
              hint="จำนวนสมาชิกใหม่ในช่วงที่เลือก"
            />
            <KpiCard
              label="ยอดใบเสร็จอนุมัติ"
              value={`${formatNumber(kpis.receiptAmount)} บาท`}
              hint="ยอดใบเสร็จอนุมัติในช่วงที่เลือก"
            />
            <KpiCard
              label={`การใช้ ${pointsCurrencyName}`}
              value={`+${formatNumber(kpis.pointsEarned)} / -${formatNumber(kpis.pointsUsed)}`}
              hint="ได้รับ / ใช้ไป"
            />
          </div>

          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <ChartCard
              title="สมาชิกแยกตามระดับ"
              description="สัดส่วนสมาชิกในแต่ละ tier"
            >
              {membersByTier.length > 0 ? (
                <ChartContainer>
                  <PieChart margin={{ top: 20, right: 24, bottom: 4, left: 24 }}>
                    <Pie
                      data={membersByTier}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="52%"
                      outerRadius="58%"
                      label={({ name, percent }) =>
                        `${name} (${Math.round((percent ?? 0) * 100)}%)`
                      }
                    >
                      {membersByTier.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ChartContainer>
              ) : (
                <EmptyChart message="ยังไม่มีข้อมูลสมาชิก" />
              )}
            </ChartCard>

            <ChartCard
              title="สมาชิกใหม่รายชั่วโมง"
              description={
                peakHour
                  ? `ช่วง peak คือ ${peakHour} น.`
                  : "การกระจายตัวตามชั่วโมงในช่วงที่เลือก"
              }
            >
              {hourlyData.some((item) => item.count > 0) ? (
                <ChartContainer>
                  <AreaChart data={hourlyData} margin={chartMargin}>
                    <defs>
                      <linearGradient
                        id="hourlyFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={CHART_COLORS.primary}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_COLORS.primary}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11 }}
                      interval={2}
                    />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="จำนวนสมัคร"
                      stroke={CHART_COLORS.primary}
                      fill="url(#hourlyFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <EmptyChart message="ไม่มีการสมัครในช่วงเวลานี้" />
              )}
            </ChartCard>

            <ChartCard
              title="สมาชิกใหม่"
              description="จำนวนสมาชิกใหม่ตามช่วงเวลาที่เลือก"
              className="lg:col-span-2"
            >
              {registrationData.some((item) => item.count > 0) ? (
                <ChartContainer>
                  <LineChart data={registrationData} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="สมาชิกใหม่"
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <EmptyChart message="ไม่มีสมาชิกสมัครใหม่ในช่วงเวลานี้" />
              )}
            </ChartCard>

            <ChartCard
              title="แนวโน้มยอดเงินใบเสร็จที่อนุมัติ"
              description="ยอดเงินรวมที่อนุมัติแล้วตามช่วงเวลาที่เลือก"
              className={receiptHasCount ? undefined : "lg:col-span-2"}
            >
              {receiptData.some((item) => item.amount > 0) ? (
                <ChartContainer>
                  <AreaChart data={receiptData} margin={chartMargin}>
                    <defs>
                      <linearGradient
                        id="receiptAmountFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={CHART_COLORS.primary}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_COLORS.primary}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatNumber(Number(value))}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      name="ยอดเงิน (บาท)"
                      stroke={CHART_COLORS.primary}
                      fill="url(#receiptAmountFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <EmptyChart message="ไม่มียอดใบเสร็จในช่วงเวลานี้" />
              )}
            </ChartCard>

            {receiptHasCount ? (
              <ChartCard
                title="แนวโน้มจำนวนใบเสร็จที่อนุมัติ"
                description="จำนวนใบเสร็จที่อนุมัติแล้วตามช่วงเวลาที่เลือก"
              >
                {receiptData.some((item) => item.count > 0) ? (
                  <ChartContainer>
                    <LineChart data={receiptData} margin={chartMargin}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="จำนวนใบเสร็จ"
                        stroke={CHART_COLORS.accent}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <EmptyChart message="ไม่มีใบเสร็จในช่วงเวลานี้" />
                )}
              </ChartCard>
            ) : null}

            <ChartCard
              title="สถานะคูปองแยกตามชื่อ"
              description="สัดส่วนแลกแล้ว / ใช้แล้ว / หมดอายุ"
            >
              {couponData.length > 0 ? (
                <ChartContainer>
                  <BarChart
                    data={couponData}
                    layout="vertical"
                    margin={{ top: 8, right: 12, left: 24, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E7EB"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="redeemed"
                      name="แลกแล้ว"
                      stackId="coupon"
                      fill={COUPON_STATUS_COLORS.redeemed}
                      radius={[4, 0, 0, 4]}
                    />
                    <Bar
                      dataKey="used"
                      name="ใช้แล้ว"
                      stackId="coupon"
                      fill={COUPON_STATUS_COLORS.used}
                    />
                    <Bar
                      dataKey="expired"
                      name="หมดอายุ"
                      stackId="coupon"
                      fill={COUPON_STATUS_COLORS.expired}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyChart message="ไม่มีคูปองที่แลกในช่วงเวลานี้" />
              )}
            </ChartCard>

            <ChartCard
              title={`การใช้ ${pointsCurrencyName}`}
              description="เปรียบเทียบแต้มที่ได้รับกับที่ใช้ไปในช่วงเดียวกัน"
            >
              {pointsData.some((item) => item.earned > 0 || item.used > 0) ? (
                <ChartContainer>
                  <BarChart data={pointsData} margin={chartMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatNumber(Number(value))}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="earned"
                      name="ได้รับ"
                      fill={CHART_COLORS.success}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="used"
                      name="ใช้ไป"
                      fill={CHART_COLORS.danger}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyChart message="ไม่มีข้อมูล Point ในช่วงเวลานี้" />
              )}
            </ChartCard>
          </div>
        </div>
      ) : (
        <DashboardLoadError
          message={error ?? "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้"}
          onRetry={() => void loadDashboard()}
        />
      )}
    </div>
  );
}
