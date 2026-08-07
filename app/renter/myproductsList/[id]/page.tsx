export default async function MyProductDetailPage({
  params,
}: PageProps<"/renter/myproductsList/[id]">) {
  const { id } = await params;

  return <h1>My Product: {id}</h1>;
}
