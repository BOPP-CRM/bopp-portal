import ReceiptDetailModal from "@/components/receipts/ReceiptDetailModal";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ReceiptDetailModal receiptId={Number(id)} />;
}
