export type Restaurant = {
  id: string
  slug: string
  name: string
  logo_url: string | null
  cover_url: string | null
  description: string | null
  address: string | null
  phone: string | null
  brand_color: string
  plan: 'free' | 'pro' | 'premium'
  status: 'active' | 'blocked'
}

export type Category = {
  id: string
  restaurant_id: string
  name: string
  sort_order: number
  active: boolean
}

export type OptionValue = {
  id: string
  name: string
  price_delta: number
  sort_order: number
}

export type ProductOption = {
  id: string
  name: string
  required: boolean
  multiple_choice: boolean
  sort_order: number
  product_option_values: OptionValue[]
}

export type Product = {
  id: string
  restaurant_id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  available: boolean
  sort_order: number
  product_options?: ProductOption[]
}

export type RestaurantTable = {
  id: string
  restaurant_id: string
  label: string
  qr_token: string
  active: boolean
  tab_started_at: string
}

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'delivered'

export type Order = {
  id: string
  restaurant_id: string
  table_id: string | null
  session_token: string
  status: OrderStatus
  total: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  notes: string | null
}

export type CartOptionSelection = {
  value_id: string
  option_name: string
  value_name: string
  price_delta: number
}

export type CartItem = {
  key: string
  product_id: string
  name: string
  unit_price: number
  quantity: number
  options: CartOptionSelection[]
  notes?: string
}
