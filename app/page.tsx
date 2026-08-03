//เป็นแค่ mock เฉยๆ ใครจะทําไฟล์นี้ก็ลบ code ได้เลย

'use client'

import { useEffect, useState } from 'react'

type Product = {
  id: number
  name: string
  price: number
  description: string | null
  created_at: string
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
  }, [])

  return (
    <main>
      <h1>Products</h1>

      {products.map((product) => (
        <div key={product.id}>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <p>{product.price} บาท</p>
          <p>{product.created_at}</p>
        </div>
      ))}
    </main>
  )
}