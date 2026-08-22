export default async function LenderEditProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold text-[#000f22]">แก้ไขสินค้า: {id}</h1>
    </div>
  );
}
