"use server"

import { revalidatePath } from "next/cache"
import { supabase } from "./supabase"

export async function createPurchase(formData: FormData) {
  try {
    const data = {
      product_name: formData.get("product_name") as string,
      quantity: Number.parseFloat(formData.get("quantity") as string),
      unit: formData.get("unit") as string,
      total_cost: Number.parseInt(formData.get("total_cost") as string),
      purchase_date: formData.get("purchase_date") as string,
      notes: (formData.get("notes") as string) || null,
    }

    const { error } = await supabase.from("purchases").insert([
      {
        ...data,
        remaining_quantity: data.quantity,
      },
    ])

    if (error) throw error

    // Revalidate all relevant pages
    revalidatePath("/")
    revalidatePath("/purchases")
    revalidatePath("/inventory")
    revalidatePath("/reports")
    revalidatePath("/daily-report")

    return { success: true }
  } catch (error) {
    console.error("Error creating purchase:", error)
    return { success: false, error: "Có lỗi xảy ra khi tạo đơn nhập hàng" }
  }
}

export async function createSale(formData: FormData) {
  try {
    const purchaseId = formData.get("purchase_id") as string
    const quantity = Number.parseFloat(formData.get("quantity") as string)
    const totalPrice = Number.parseInt(formData.get("total_price") as string)
    const unitPrice = Math.round(totalPrice / quantity)

    // Get purchase info
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select("*")
      .eq("id", purchaseId)
      .single()

    if (purchaseError || !purchase) {
      throw new Error("Không tìm thấy sản phẩm")
    }

    if (quantity > purchase.remaining_quantity) {
      throw new Error("Số lượng bán vượt quá số lượng tồn kho")
    }

    // Insert sale
    const { error: saleError } = await supabase.from("sales").insert([
      {
        purchase_id: purchaseId,
        quantity: quantity,
        unit_price: unitPrice,
        total_revenue: totalPrice,
        payment_status: formData.get("payment_status") as string,
        sale_date: formData.get("sale_date") as string,
        notes: (formData.get("notes") as string) || null,
      },
    ])

    if (saleError) throw saleError

    // Update remaining quantity
    const newRemainingQuantity = purchase.remaining_quantity - quantity
    const { error: updateError } = await supabase
      .from("purchases")
      .update({ remaining_quantity: newRemainingQuantity })
      .eq("id", purchaseId)

    if (updateError) throw updateError

    // Revalidate all relevant pages
    revalidatePath("/")
    revalidatePath("/sales")
    revalidatePath("/inventory")
    revalidatePath("/reports")
    revalidatePath("/daily-report")

    return { success: true }
  } catch (error: any) {
    console.error("Error creating sale:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi tạo đơn bán hàng" }
  }
}

export async function updateSalePaymentStatus(saleId: string, newStatus: string) {
  try {
    const { error } = await supabase.from("sales").update({ payment_status: newStatus }).eq("id", saleId)

    if (error) throw error

    // Revalidate all relevant pages
    revalidatePath("/")
    revalidatePath("/sales")
    revalidatePath("/reports")
    revalidatePath("/daily-report")

    return { success: true }
  } catch (error) {
    console.error("Error updating payment status:", error)
    return { success: false, error: "Có lỗi xảy ra khi cập nhật trạng thái thanh toán" }
  }
}

export async function updateSale(saleId: string, formData: FormData) {
  try {
    const { error } = await supabase
      .from("sales")
      .update({
        shipping_fee: Number.parseInt(formData.get("shipping_fee") as string) || 0,
        payment_status: formData.get("payment_status") as string,
        notes: (formData.get("notes") as string) || null,
        notes_internal: (formData.get("notes_internal") as string) || null,
      })
      .eq("id", saleId)

    if (error) throw error

    // Revalidate all relevant pages
    revalidatePath("/")
    revalidatePath("/sales")
    revalidatePath("/reports")
    revalidatePath("/daily-report")

    return { success: true }
  } catch (error) {
    console.error("Error updating sale:", error)
    return { success: false, error: "Có lỗi xảy ra khi cập nhật đơn hàng" }
  }
}
