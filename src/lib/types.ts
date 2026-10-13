export type Category = {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  position?: number
  created_at?: string
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at'>
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at'>>

export type Product = {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number
  stock: number
  /** Primera imagen (compatibilidad con datos antiguos) */
  image_url: string | null
  /** Galería ordenada (rutas /uploads/… o URLs https) */
  images: string[]
  created_at: string
}

export type ProductInsert = Omit<Product, 'id' | 'created_at'>
export type ProductUpdate = Partial<Omit<Product, 'id' | 'created_at'>>
