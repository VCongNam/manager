import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://yvqgpuyftfsbqwhtrusw.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cWdwdXlmdGZzYnF3aHRydXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMTk2MzEsImV4cCI6MjA2NzY5NTYzMX0.aO71LEzAvFMY-TjzYxky6BzwH9MKczhb29RBc2Ya9Xs"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Purchase = {
  id: string
  product_name: string
  quantity: number
  unit: string
  total_cost: number
  remaining_quantity: number
  purchase_date: string
  notes?: string
  created_at: string
  updated_at: string
}

export type Sale = {
  id: string
  purchase_id: string
  quantity: number
  unit_price: number
  total_revenue: number
  shipping_fee: number
  sale_date: string
  payment_status: "paid" | "unpaid" | "partial"
  notes?: string
  notes_internal?: string
  created_at: string
  updated_at: string
  purchases?: Purchase
  expenses?: Expense[]
}

export type Expense = {
  id: string
  sale_id: string
  expense_type: "shipping_cost" | "packaging" | "other"
  description?: string
  amount: number
  created_at: string
  updated_at: string
}
