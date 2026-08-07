export default async function HiredProductDetailPage({
  params,
}: PageProps<"/lender/myhiredproductsList/[id]">) {
  const { id } = await params;

  return <h1>Hired Product: {id}</h1>;
}
