export default async function ReviewProductPage({
  params,
}: PageProps<"/renter/myproductsList/[id]/review">) {
  const { id } = await params;

  return <h1>Product Review: {id}</h1>;
}
