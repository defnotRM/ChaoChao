import { redirect } from "next/navigation";

export default async function LenderEditProductDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/lender/editmyproduct/${id}`);
}
