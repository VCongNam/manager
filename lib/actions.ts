"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { supabase } from "./supabase"

// Thêm function để force refresh tất cả
export async function forceRefreshAll() {
  // Revalidate tất cả paths
  revalidatePath("/", "layout") // Revalidate toàn bộ layout
  revalidatePath("/")
  revalidatePath("/purchases")
  revalidatePath("/sales")
  revalidatePath("/inventory")
  revalidatePath("/reports")
  revalidatePath("/daily-report")

  // Revalidate tags nếu có
  revalidateTag("purchases")
  revalidateTag("sales")
  revalidateTag("expenses")
}

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

    // Validation
    if (!data.product_name || !data.unit || isNaN(data.quantity) || isNaN(data.total_cost)) {
      throw new Error("Vui lòng điền đầy đủ thông tin hợp lệ")
    }

    const { error } = await supabase.from("purchases").insert([
      {
        ...data,
        remaining_quantity: data.quantity,
      },
    ])

    if (error) throw error

    // Force refresh tất cả
    await forceRefreshAll()

    return { success: true }
  } catch (error: any) {
    console.error("Error creating purchase:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi tạo đơn nhập hàng" }
  }
}

export async function createSale(formData: FormData) {
  try {
    const purchaseId = formData.get("purchase_id") as string
    const quantity = Number.parseFloat(formData.get("quantity") as string)
    const totalPrice = Number.parseInt(formData.get("total_price") as string)
    const paymentStatus = formData.get("payment_status") as string
    const saleDate = formData.get("sale_date") as string
    const notes = formData.get("notes") as string

    // Validation
    if (!purchaseId || isNaN(quantity) || isNaN(totalPrice) || !paymentStatus || !saleDate) {
      throw new Error("Vui lòng điền đầy đủ thông tin hợp lệ")
    }

    if (!["paid", "unpaid", "partial"].includes(paymentStatus)) {
      throw new Error("Trạng thái thanh toán không hợp lệ")
    }

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
        payment_status: paymentStatus,
        sale_date: saleDate,
        notes: notes || null,
        shipping_fee: 0,
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

    // Force refresh tất cả
    await forceRefreshAll()

    return { success: true }
  } catch (error: any) {
    console.error("Error creating sale:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi tạo đơn bán hàng" }
  }
}

export async function updateSalePaymentStatus(saleId: string, newStatus: string) {
  try {
    if (!["paid", "unpaid", "partial"].includes(newStatus)) {
      throw new Error("Trạng thái thanh toán không hợp lệ")
    }

    const { error } = await supabase.from("sales").update({ payment_status: newStatus }).eq("id", saleId)

    if (error) throw error

    // Force refresh tất cả
    await forceRefreshAll()

    return { success: true }
  } catch (error: any) {
    console.error("Error updating payment status:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi cập nhật trạng thái thanh toán" }
  }
}

export async function updateSale(
  saleId: string,
  updateData: {
    shipping_fee: string
    payment_status: string
    notes: string
    notes_internal: string
  },
) {
  try {
    const shippingFee = Number.parseInt(updateData.shipping_fee) || 0
    const paymentStatus = updateData.payment_status

    if (!["paid", "unpaid", "partial"].includes(paymentStatus)) {
      throw new Error("Trạng thái thanh toán không hợp lệ")
    }

    const { error } = await supabase
      .from("sales")
      .update({
        shipping_fee: shippingFee,
        payment_status: paymentStatus,
        notes: updateData.notes || null,
        notes_internal: updateData.notes_internal || null,
      })
      .eq("id", saleId)

    if (error) throw error

    // Force refresh tất cả
    await forceRefreshAll()

    return { success: true }
  } catch (error: any) {
    console.error("Error updating sale:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi cập nhật đơn hàng" }
  }
}

export async function addExpense(
  saleId: string,
  expenseData: {
    expense_type: string
    description: string
    amount: string
  },
) {
  try {
    const amount = Number.parseInt(expenseData.amount)
    if (isNaN(amount)) {
      throw new Error("Số tiền không hợp lệ")
    }

    if (!["shipping_cost", "packaging", "other"].includes(expenseData.expense_type)) {
      throw new Error("Loại chi phí không hợp lệ")
    }

    if (!expenseData.description.trim()) {
      throw new Error("Vui lòng nhập mô tả chi phí")
    }

    const { error } = await supabase.from("expenses").insert([
      {
        sale_id: saleId,
        expense_type: expenseData.expense_type,
        description: expenseData.description.trim(),
        amount: amount,
      },
    ])

    if (error) throw error

    // Force refresh tất cả
    await forceRefreshAll()

    return { success: true }
  } catch (error: any) {
    console.error("Error adding expense:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi thêm chi phí" }
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId)

    if (error) throw error

    // Force refresh tất cả
    await forceRefreshAll()

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting expense:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi xóa chi phí" }
  }
}
