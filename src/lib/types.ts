export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image_url: string | null
  created_at: string
}

export type ProductInsert = Omit<Product, 'id' | 'created_at'>
export type ProductUpdate = Partial<Omit<Product, 'id' | 'created_at'>>

