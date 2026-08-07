import ProductCatalog from "@/components/products/ProductCatalog";
import { getMockProducts } from "@/lib/mock/product";

export default function HireProductPage() {
  const products = getMockProducts();

  return (
    <section className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 border-b border-slate-100 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-[#1b3554]">
            สินค้าสำหรับเช่า
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            ค้นหาอุปกรณ์ตามหมวดหมู่ ราคา คะแนน และวันที่ที่คุณต้องการ
          </p>
        </div>

        <ProductCatalog products={products} />
      </div>
    </section>
  );
}
