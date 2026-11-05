import EditTeamUserModal from "@/components/team/EditTeamUserModal";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <EditTeamUserModal userId={Number(id)} />;
}
