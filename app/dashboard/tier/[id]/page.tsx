import TierFormPage from "@/components/tiers/TierFormPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <TierFormPage tierId={Number(id)} />;
}
