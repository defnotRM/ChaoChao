export default async function ReviewHiredProductPage({
  params,
}: PageProps<"/lender/myhiredproductsList/[id]/review">) {
  const { id } = await params;

  return <h1>Review Hired Product: {id}</h1>;
}
