import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://tpeqefgjvhmpmngmjvhg.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZXFlZmdqdmhtcG1uZ21qdmhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkxMjQ2MTgsImV4cCI6MjAzNDcwMDYxOH0.1QH8oyzrkRkidusb6dQ8ojs1h89mNLx5DrvI0ELp_Xg"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Purchase = {
  id: string
  product_name: string
  quantity: number
  unit: string
  total_cost: number
  remaining_quantity: number
  purchase_date: string
  supplier_name?: string
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
  customer_name?: string
  delivery_method: "pickup" | "delivery"
  amount_paid: number
  amount_remaining: number
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

export type DailyExpense = {
  id: string
  expense_date: string
  expense_type: "fuel" | "rent" | "utilities" | "marketing" | "other"
  description: string
  amount: number
  created_at: string
  updated_at: string
}
