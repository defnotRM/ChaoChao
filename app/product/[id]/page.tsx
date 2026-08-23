export default async function ProductDetailPage({
  params,
}: PageProps<"/product/[id]">) {
  const { id } = await params;

  return <h1>Product: {id}</h1>;
}
