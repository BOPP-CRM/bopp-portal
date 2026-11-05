import CouponRedemptionsModal from "@/components/coupons/CouponRedemptionsModal";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CouponRedemptionsModal couponId={Number(id)} />;
}
