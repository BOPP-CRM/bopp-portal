import WarrantyDetailModal from "@/components/warranties/WarrantyDetailModal";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <WarrantyDetailModal warrantyId={Number(id)} />;
}
