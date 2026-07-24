import GameEditPage from "@/src/lib/pages/Admin/Game/GameEditPage";

const AdminGameEditPage = async ({ params }: { params: any }) => {
  const { id } = await params;

  return <GameEditPage gameId={id === "new" ? undefined : id} />;
};

export default AdminGameEditPage;
