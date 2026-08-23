import type { Product } from "@/lib/types/product";
import ProductCard from "./ProductCard";

interface ProductListProps {
  products: Product[];
  layout?: "grid" | "list";
}

export default function ProductList({
  products,
  layout = "grid",
}: ProductListProps) {
  if (products.length === 0) {
    return <p>ยังไม่มีสินค้า</p>;
  }

  return (
    <div
      className={
        layout === "list"
          ? "grid gap-4"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          listing={product}
          layout={layout}
        />
      ))}
    </div>
  );
}
