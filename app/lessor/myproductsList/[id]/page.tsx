export default async function MyProductDetailPage({
  params,
}: PageProps<"/lessor/myproductsList/[id]">) {
  const { id } = await params;

  return <h1>My Product: {id}</h1>;
}
