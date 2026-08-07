export default async function HireProductDetailPage({
  params,
}: PageProps<"/renter/hireproduct/[id]">) {
  const { id } = await params;

  return <h1>Hire Product: {id}</h1>;
}
