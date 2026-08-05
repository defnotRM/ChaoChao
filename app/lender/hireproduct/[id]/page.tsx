export default async function HireProductDetailPage({
  params,
}: PageProps<"/lessee/hireproduct/[id]">) {
  const { id } = await params;

  return <h1>Hire Product: {id}</h1>;
}
