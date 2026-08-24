import type { Metadata } from "next";

import SavedProductCollection from "@/components/products/SavedProductCollection";
import { getMockProducts } from "@/lib/mock/product";

export const metadata: Metadata = {
  title: "รายการที่บันทึก | ChaoChao",
  description: "สินค้าสำหรับเช่าที่คุณบันทึกไว้ใน ChaoChao",
};

const initialSavedProductIds = new Set(["1", "2"]);

export default function SavedProductsPage() {
  const savedProducts = getMockProducts().filter((product) =>
    initialSavedProductIds.has(product.id),
  );

  return (
    <section className="min-h-screen bg-[#f8fafc] py-8 sm:py-10">
      <div className="mx-auto mb-20 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SavedProductCollection products={savedProducts} />
      </div>
    </section>
  );
}
