import CouponFormModal from "@/components/coupons/CouponFormModal";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CouponFormModal couponId={Number(id)} />;
}
