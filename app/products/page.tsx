import ProductCatalog from "@/components/products/ProductCatalog";
import { getCategories, getProducts } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = params?.q || "";

  const [itemCategories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <section className="min-h-screen bg-[#f8fafc] py-8 sm:py-10">
      <div className="mx-auto mb-20 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            ค้นหาอุปกรณ์ทั้งหมด
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#1b3554] sm:text-3xl">
            สินค้าสำหรับเช่า (Products)
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            ค้นหาอุปกรณ์ตามหมวดหมู่ ราคา คะแนน และวันที่ที่คุณต้องการเช่าใช้งาน
          </p>
        </div>

        <ProductCatalog
          itemCategories={itemCategories}
          products={products}
          initialSearchQuery={initialQuery}
        />
      </div>
    </section>
  );
}
