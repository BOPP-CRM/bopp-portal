import SaleDetailModal from "@/components/sales/SaleDetailModal";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <SaleDetailModal saleId={Number(id)} />;
}
