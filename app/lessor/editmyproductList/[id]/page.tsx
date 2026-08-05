export default async function EditProductPage({
  params,
}: PageProps<"/lessor/editmyproductList/[id]">) {
  const { id } = await params;

  return <h1>Edit Product: {id}</h1>;
}
