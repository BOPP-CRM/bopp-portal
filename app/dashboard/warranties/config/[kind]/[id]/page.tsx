import WarrantyConfigFormPage from "@/components/warranties/WarrantyConfigFormPage";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ kind: string; id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { kind, id } = await params;
  if (kind !== "contributor" && kind !== "status") notFound();
  return (
    <WarrantyConfigFormPage
      kind={kind}
      itemId={id === "new" ? null : Number(id)}
    />
  );
}
