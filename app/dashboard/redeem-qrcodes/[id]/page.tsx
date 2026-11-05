import RedeemQrcodeFormModal from "@/components/redeem-qrcodes/RedeemQrcodeFormModal";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <RedeemQrcodeFormModal qrcodeId={Number(id)} />;
}
