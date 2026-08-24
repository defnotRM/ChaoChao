"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types/product";

interface FeaturedProductsRealtimeProps {
  initialProducts: Product[];
}

export default function FeaturedProductsRealtime({
  initialProducts,
}: FeaturedProductsRealtimeProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const fetchLatestProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products?status=available&pageSize=8", {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const items = json.items || json.data?.items || [];
        if (Array.isArray(items) && items.length > 0) {
          setProducts(items);
        }
      }
    } catch (err) {
      console.error("Error refreshing featured products:", err);
    }
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel("home-featured-products-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "item" }, () => {
        fetchLatestProducts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "itemimage" }, () => {
        fetchLatestProducts();
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchLatestProducts();
    }, 2500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchLatestProducts]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} listing={product} />
      ))}
    </div>
  );
}
