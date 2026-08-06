import { ProductCard } from "@/components/products/ProductCard";
import { getMockProducts } from "@/lib/mock/product";

export default function HireProductPage() {
  const products = getMockProducts();

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <p className="text-sm font-semibold text-sky-600">เลือกของที่ใช่</p>
          <h1 className="mt-1 text-2xl font-bold text-[#1b3554] sm:text-3xl">
            สินค้าพร้อมให้เช่า
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            อุปกรณ์ให้เช่าจากผู้ให้เช่าบน ChaoChao
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} listing={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
