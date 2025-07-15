"use server"

import { revalidatePath } from "next/cache"
import { supabase } from "./supabase"

// Thêm function để force refresh tất cả
export async function forceRefreshAll() {
  revalidatePath("/", "layout")
  revalidatePath("/")
  revalidatePath("/purchases")
  revalidatePath("/sales")
  revalidatePath("/inventory")
  revalidatePath("/reports")
  revalidatePath("/daily-report")
}

export async function createPurchase(formData: FormData) {
  try {
    const data = {
      product_name: formData.get("product_name") as string,
      quantity: Number.parseFloat(formData.get("quantity") as string),
      unit: formData.get("unit") as string,
      total_cost: Number.parseInt(formData.get("total_cost") as string),
      purchase_date: formData.get("purchase_date") as string,
      supplier_name: (formData.get("supplier_name") as string) || null,
      notes: (formData.get("notes") as string) || null,
    }

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

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error creating purchase:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi tạo đơn nhập hàng" }
  }
}

export async function updatePurchase(
  purchaseId: string,
  updateData: {
    product_name: string
    quantity: string
    unit: string
    total_cost: string
    supplier_name: string
    notes: string
  },
) {
  try {
    const quantity = Number.parseFloat(updateData.quantity)
    const totalCost = Number.parseInt(updateData.total_cost)

    if (!updateData.product_name || !updateData.unit || isNaN(quantity) || isNaN(totalCost)) {
      throw new Error("Vui lòng điền đầy đủ thông tin hợp lệ")
    }

    // Get current purchase to calculate remaining quantity
    const { data: currentPurchase, error: fetchError } = await supabase
      .from("purchases")
      .select("quantity, remaining_quantity")
      .eq("id", purchaseId)
      .single()

    if (fetchError || !currentPurchase) {
      throw new Error("Không tìm thấy đơn nhập hàng")
    }

    const soldQuantity = currentPurchase.quantity - currentPurchase.remaining_quantity
    const newRemainingQuantity = quantity - soldQuantity

    if (newRemainingQuantity < 0) {
      throw new Error("Số lượng mới không thể nhỏ hơn số lượng đã bán")
    }

    const { error } = await supabase
      .from("purchases")
      .update({
        product_name: updateData.product_name,
        quantity: quantity,
        unit: updateData.unit,
        total_cost: totalCost,
        supplier_name: updateData.supplier_name || null,
        notes: updateData.notes || null,
        remaining_quantity: newRemainingQuantity,
      })
      .eq("id", purchaseId)

    if (error) throw error

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error updating purchase:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi cập nhật đơn nhập hàng" }
  }
}

export async function deletePurchase(purchaseId: string) {
  try {
    // Check if there are any sales for this purchase
    const { data: sales, error: salesError } = await supabase.from("sales").select("id").eq("purchase_id", purchaseId)

    if (salesError) throw salesError

    if (sales && sales.length > 0) {
      throw new Error("Không thể xóa đơn nhập hàng đã có giao dịch bán")
    }

    const { error } = await supabase.from("purchases").delete().eq("id", purchaseId)

    if (error) throw error

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting purchase:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi xóa đơn nhập hàng" }
  }
}

export async function createSale(formData: FormData) {
  try {
    // Logic cũ cho đơn một sản phẩm (chỉ dùng cho dữ liệu cũ)
    const purchaseId = formData.get("purchase_id") as string
    const quantity = Number.parseFloat(formData.get("quantity") as string)
    const totalPrice = Number.parseInt(formData.get("total_price") as string)
    const shippingFee = Number.parseInt(formData.get("shipping_fee") as string) || 0
    const customerName = formData.get("customer_name") as string
    const deliveryMethod = formData.get("delivery_method") as "pickup" | "delivery"
    const amountPaid = Number.parseInt(formData.get("amount_paid") as string) || 0
    const saleDate = formData.get("sale_date") as string
    const notes = formData.get("notes") as string

    if (!purchaseId || isNaN(quantity) || isNaN(totalPrice) || !saleDate) {
      throw new Error("Vui lòng điền đầy đủ thông tin hợp lệ")
    }

    const totalAmount = totalPrice + shippingFee
    const amountRemaining = totalAmount - amountPaid

    let paymentStatus: "paid" | "unpaid" | "partial"
    if (amountPaid >= totalAmount) {
      paymentStatus = "paid"
    } else if (amountPaid > 0) {
      paymentStatus = "partial"
    } else {
      paymentStatus = "unpaid"
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
        shipping_fee: shippingFee,
        customer_name: customerName || null,
        delivery_method: deliveryMethod || "pickup",
        amount_paid: amountPaid,
        amount_remaining: amountRemaining,
        payment_status: paymentStatus,
        sale_date: saleDate,
        notes: notes || null,
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

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error creating sale:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi tạo đơn bán hàng" }
  }
}

export async function createOrderWithItems(formData: FormData) {
  try {
    const totalItems = Number.parseInt(formData.get("total_items") as string)
    const shippingFee = Number.parseInt(formData.get("shipping_fee") as string) || 0
    const customerName = formData.get("customer_name") as string
    const deliveryMethod = formData.get("delivery_method") as "pickup" | "delivery"
    const amountPaid = Number.parseInt(formData.get("amount_paid") as string) || 0
    const notes = formData.get("notes") as string

    // Thu thập thông tin sản phẩm
    const orderItems = []
    let totalOrderPrice = 0

    for (let i = 0; i < totalItems; i++) {
      const purchaseId = formData.get(`purchase_id_${i}`) as string
      const quantity = Number.parseFloat(formData.get(`quantity_${i}`) as string)
      const price = Number.parseInt(formData.get(`price_${i}`) as string)

      if (!purchaseId || isNaN(quantity) || isNaN(price)) {
        throw new Error(`Vui lòng điền đầy đủ thông tin cho sản phẩm thứ ${i + 1}`)
      }

      orderItems.push({ purchaseId, quantity, price })
      totalOrderPrice += price
    }

    const totalAmount = totalOrderPrice + shippingFee
    const amountRemaining = totalAmount - amountPaid

    let paymentStatus: "paid" | "unpaid" | "partial"
    if (amountPaid >= totalAmount) {
      paymentStatus = "paid"
    } else if (amountPaid > 0) {
      paymentStatus = "partial"
    } else {
      paymentStatus = "unpaid"
    }

    // Kiểm tra tồn kho cho tất cả sản phẩm
    for (const item of orderItems) {
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .select("remaining_quantity")
        .eq("id", item.purchaseId)
        .single()

      if (purchaseError || !purchase) {
        throw new Error("Không tìm thấy một trong các sản phẩm")
      }

      if (item.quantity > purchase.remaining_quantity) {
        throw new Error(`Số lượng sản phẩm vượt quá tồn kho`)
      }
    }

    // Tạo đơn hàng
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          sale_date: new Date().toISOString().split("T")[0],
          customer_name: customerName || null,
          delivery_method: deliveryMethod || "pickup",
          shipping_fee: shippingFee,
          payment_status: paymentStatus,
          amount_paid: amountPaid,
          amount_remaining: amountRemaining,
          notes: notes || null,
        },
      ])
      .select()
      .single()

    if (orderError) throw orderError

    // Tạo các order items
    const orderItemsData = orderItems.map(item => ({
      order_id: order.id,
      purchase_id: item.purchaseId,
      quantity: item.quantity,
      unit_price: Math.round(item.price / item.quantity),
      total_price: item.price,
      notes: null,
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData)

    if (itemsError) throw itemsError

    // Trừ tồn kho cho tất cả sản phẩm
    for (const item of orderItems) {
      // Lấy thông tin sản phẩm hiện tại
      const { data: purchase, error: fetchError } = await supabase
        .from("purchases")
        .select("remaining_quantity")
        .eq("id", item.purchaseId)
        .single()

      if (fetchError || !purchase) {
        throw new Error("Không tìm thấy sản phẩm để cập nhật tồn kho")
      }

      // Tính số lượng mới và cập nhật
      const newRemainingQuantity = purchase.remaining_quantity - item.quantity
      const { error: updateError } = await supabase
        .from("purchases")
        .update({ remaining_quantity: newRemainingQuantity })
        .eq("id", item.purchaseId)

      if (updateError) throw updateError
    }

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error creating order with items:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi tạo đơn hàng" }
  }
}

export async function updateSale(
  saleId: string,
  updateData: {
    customer_name: string
    delivery_method: string
    amount_paid: string
    shipping_fee: string
    notes: string
    notes_internal: string
  },
) {
  try {
    const amountPaid = Number.parseInt(updateData.amount_paid) || 0
    const shippingFee = Number.parseInt(updateData.shipping_fee) || 0

    // Get current sale to calculate totals
    const { data: currentSale, error: fetchError } = await supabase
      .from("sales")
      .select("total_revenue")
      .eq("id", saleId)
      .single()

    if (fetchError || !currentSale) {
      throw new Error("Không tìm thấy đơn hàng")
    }

    const totalAmount = currentSale.total_revenue + shippingFee
    const amountRemaining = totalAmount - amountPaid

    let paymentStatus: "paid" | "unpaid" | "partial"
    if (amountPaid >= totalAmount) {
      paymentStatus = "paid"
    } else if (amountPaid > 0) {
      paymentStatus = "partial"
    } else {
      paymentStatus = "unpaid"
    }

    const { error } = await supabase
      .from("sales")
      .update({
        customer_name: updateData.customer_name || null,
        delivery_method: updateData.delivery_method as "pickup" | "delivery",
        amount_paid: amountPaid,
        amount_remaining: amountRemaining,
        shipping_fee: shippingFee,
        payment_status: paymentStatus,
        notes: updateData.notes || null,
        notes_internal: updateData.notes_internal || null,
      })
      .eq("id", saleId)

    if (error) throw error

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error updating sale:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi cập nhật đơn hàng" }
  }
}

export async function updateSaleComplete(
  saleId: string,
  updateData: {
    purchase_id: string
    quantity: string
    total_revenue: string
    customer_name: string
    delivery_method: string
    amount_paid: string
    shipping_fee: string
    sale_date: string
    notes: string
    notes_internal: string
  },
) {
  try {
    const quantity = Number.parseFloat(updateData.quantity)
    const totalRevenue = Number.parseInt(updateData.total_revenue)
    const amountPaid = Number.parseInt(updateData.amount_paid) || 0
    const shippingFee = Number.parseInt(updateData.shipping_fee) || 0

    if (!updateData.purchase_id || isNaN(quantity) || isNaN(totalRevenue) || !updateData.sale_date) {
      throw new Error("Vui lòng điền đầy đủ thông tin hợp lệ")
    }

    // Get current sale info
    const { data: currentSale, error: currentSaleError } = await supabase
      .from("sales")
      .select("purchase_id, quantity")
      .eq("id", saleId)
      .single()

    if (currentSaleError || !currentSale) {
      throw new Error("Không tìm thấy đơn hàng")
    }

    // Get new purchase info
    const { data: newPurchase, error: newPurchaseError } = await supabase
      .from("purchases")
      .select("*")
      .eq("id", updateData.purchase_id)
      .single()

    if (newPurchaseError || !newPurchase) {
      throw new Error("Không tìm thấy sản phẩm")
    }

    // Calculate available quantity for new purchase
    let availableQuantity = newPurchase.remaining_quantity
    if (currentSale.purchase_id === updateData.purchase_id) {
      // Same product, add back current quantity
      availableQuantity += currentSale.quantity
    }

    if (quantity > availableQuantity) {
      throw new Error(`Số lượng bán vượt quá số lượng có thể bán (${availableQuantity})`)
    }

    // Calculate payment status
    const totalAmount = totalRevenue + shippingFee
    const amountRemaining = totalAmount - amountPaid

    let paymentStatus: "paid" | "unpaid" | "partial"
    if (amountPaid >= totalAmount) {
      paymentStatus = "paid"
    } else if (amountPaid > 0) {
      paymentStatus = "partial"
    } else {
      paymentStatus = "unpaid"
    }

    const unitPrice = Math.round(totalRevenue / quantity)

    // Update sale
    const { error: saleError } = await supabase
      .from("sales")
      .update({
        purchase_id: updateData.purchase_id,
        quantity: quantity,
        unit_price: unitPrice,
        total_revenue: totalRevenue,
        customer_name: updateData.customer_name || null,
        delivery_method: updateData.delivery_method as "pickup" | "delivery",
        amount_paid: amountPaid,
        amount_remaining: amountRemaining,
        shipping_fee: shippingFee,
        payment_status: paymentStatus,
        sale_date: updateData.sale_date,
        notes: updateData.notes || null,
        notes_internal: updateData.notes_internal || null,
      })
      .eq("id", saleId)

    if (saleError) throw saleError

    // Update purchase quantities
    if (currentSale.purchase_id !== updateData.purchase_id) {
      // Different product - restore old purchase quantity
      const { data: oldPurchase, error: oldPurchaseError } = await supabase
        .from("purchases")
        .select("remaining_quantity")
        .eq("id", currentSale.purchase_id)
        .single()

      if (oldPurchaseError || !oldPurchase) {
        throw new Error("Không tìm thấy thông tin sản phẩm cũ")
      }

      const { error: restoreError } = await supabase
        .from("purchases")
        .update({ remaining_quantity: oldPurchase.remaining_quantity + currentSale.quantity })
        .eq("id", currentSale.purchase_id)

      if (restoreError) throw restoreError

      // Update new purchase quantity
      const { error: updateNewError } = await supabase
        .from("purchases")
        .update({ remaining_quantity: newPurchase.remaining_quantity - quantity })
        .eq("id", updateData.purchase_id)

      if (updateNewError) throw updateNewError
    } else {
      // Same product - adjust quantity difference
      const quantityDifference = quantity - currentSale.quantity
      const newRemainingQuantity = newPurchase.remaining_quantity - quantityDifference

      const { error: updateError } = await supabase
        .from("purchases")
        .update({ remaining_quantity: newRemainingQuantity })
        .eq("id", updateData.purchase_id)

      if (updateError) throw updateError
    }

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error updating sale:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi cập nhật đơn hàng" }
  }
}

export async function deleteSale(saleId: string) {
  try {
    // Get sale info to restore purchase quantity
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("purchase_id, quantity")
      .eq("id", saleId)
      .single()

    if (saleError || !sale) {
      throw new Error("Không tìm thấy đơn hàng")
    }

    // Delete expenses first
    const { error: expenseError } = await supabase.from("expenses").delete().eq("sale_id", saleId)

    if (expenseError) throw expenseError

    // Delete sale
    const { error: deleteError } = await supabase.from("sales").delete().eq("id", saleId)

    if (deleteError) throw deleteError

    // Restore purchase quantity
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select("remaining_quantity")
      .eq("id", sale.purchase_id)
      .single()

    if (purchaseError || !purchase) {
      throw new Error("Không tìm thấy thông tin nhập hàng")
    }

    const { error: updateError } = await supabase
      .from("purchases")
      .update({ remaining_quantity: purchase.remaining_quantity + sale.quantity })
      .eq("id", sale.purchase_id)

    if (updateError) throw updateError

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting sale:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi xóa đơn hàng" }
  }
}

export async function updateSalePaymentStatus(saleId: string, newStatus: string) {
  try {
    let updateFields: any = { payment_status: newStatus }
    if (newStatus === "paid") {
      // Lấy tổng tiền đơn hàng
      const { data: sale, error } = await supabase
        .from("sales")
        .select("total_revenue, shipping_fee, expenses(amount)")
        .eq("id", saleId)
        .single()
      if (error || !sale) throw error || new Error("Không tìm thấy đơn hàng")
      const expensesTotal = (sale.expenses || []).reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
      const totalAmount = (sale.total_revenue || 0) + (sale.shipping_fee || 0) + expensesTotal
      updateFields.amount_paid = totalAmount
      updateFields.amount_remaining = 0
    } else if (newStatus === "unpaid") {
      updateFields.amount_paid = 0
    }
    const { error } = await supabase
      .from("sales")
      .update(updateFields)
      .eq("id", saleId)
    if (error) throw error
    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error updating payment status:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi cập nhật trạng thái thanh toán" }
  }
}

export async function updateOrderPaymentStatus(orderId: string, newStatus: string) {
  try {
    let updateFields: any = { payment_status: newStatus }
    if (newStatus === "paid") {
      // Lấy tổng tiền đơn hàng
      const { data: order, error } = await supabase
        .from("orders")
        .select("amount_paid, shipping_fee, order_items(total_price)")
        .eq("id", orderId)
        .single()
      if (error || !order) throw error || new Error("Không tìm thấy đơn hàng")
      const totalOrderPrice = (order.order_items || []).reduce((sum: number, item: any) => sum + (item.total_price || 0), 0)
      const totalAmount = totalOrderPrice + (order.shipping_fee || 0)
      updateFields.amount_paid = totalAmount
      updateFields.amount_remaining = 0
    } else if (newStatus === "unpaid") {
      updateFields.amount_paid = 0
    }
    const { error } = await supabase
      .from("orders")
      .update(updateFields)
      .eq("id", orderId)
    if (error) throw error
    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error updating order payment status:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi cập nhật trạng thái thanh toán" }
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

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting expense:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi xóa chi phí" }
  }
}

export async function addDailyExpense(
  expenseDate: string,
  expenseData: {
    expense_type: string
    description: string
    amount: string
  },
) {
  try {
    const amount = Number.parseInt(expenseData.amount)
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Số tiền phải là số dương")
    }

    if (!["fuel", "rent", "utilities", "marketing", "other"].includes(expenseData.expense_type)) {
      throw new Error("Loại chi phí không hợp lệ")
    }

    if (!expenseData.description.trim()) {
      throw new Error("Vui lòng nhập mô tả chi phí")
    }

    const { error } = await supabase.from("daily_expenses").insert([
      {
        expense_date: expenseDate,
        expense_type: expenseData.expense_type,
        description: expenseData.description.trim(),
        amount: amount,
      },
    ])

    if (error) throw error

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error adding daily expense:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi thêm chi phí hàng ngày" }
  }
}

export async function deleteDailyExpense(expenseId: string) {
  try {
    const { error } = await supabase.from("daily_expenses").delete().eq("id", expenseId)

    if (error) throw error

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting daily expense:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi xóa chi phí hàng ngày" }
  }
}

// Hàm helper để lấy tất cả đơn hàng (cả sales cũ và orders mới)
export async function getAllOrders() {
  try {
    // Lấy sales (đơn hàng cũ)
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select(`
        *,
        purchases (
          product_name,
          unit
        ),
        expenses (
          id,
          expense_type,
          description,
          amount
        )
      `)
      .order("sale_date", { ascending: false })

    if (salesError) throw salesError

    // Lấy orders (đơn hàng mới)
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          purchase_id,
          quantity,
          unit_price,
          total_price,
          notes,
          purchases (
            id,
            product_name,
            unit
          )
        )
      `)
      .order("sale_date", { ascending: false })

    if (ordersError) throw ordersError

    // Chuyển đổi format orders để tương thích với sales
    const formattedOrders = (orders || []).map(order => ({
      ...order,
      id: order.id,
      sale_date: order.sale_date,
      customer_name: order.customer_name,
      delivery_method: order.delivery_method,
      shipping_fee: order.shipping_fee,
      payment_status: order.payment_status,
      amount_paid: order.amount_paid,
      amount_remaining: order.amount_remaining,
      notes: order.notes,
      created_at: order.created_at,
      updated_at: order.updated_at,
      // Tính tổng doanh thu từ order_items
      total_revenue: (order.order_items || []).reduce((sum, item) => sum + item.total_price, 0),
      // Lấy thông tin sản phẩm đầu tiên (cho hiển thị)
      purchases: order.order_items?.[0]?.purchases || null,
      // Đánh dấu là đơn hàng mới
      is_new_order: true,
      // Số lượng sản phẩm
      total_items: order.order_items?.length || 0,
      // Chi tiết sản phẩm
      order_items: order.order_items || []
    }))

    // Chuyển đổi format sales để tương thích
    const formattedSales = (sales || []).map(sale => ({
      ...sale,
      is_new_order: false,
      total_items: 1,
      order_items: [{
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        total_price: sale.total_revenue,
        purchases: sale.purchases
      }]
    }))

    // Kết hợp và sắp xếp theo ngày
    const allOrders = [...formattedSales, ...formattedOrders].sort((a, b) => 
      new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
    )

    return { success: true, data: allOrders }
  } catch (error: any) {
    console.error("Error fetching all orders:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi tải danh sách đơn hàng" }
  }
}

// Hàm helper để lấy đơn hàng theo ngày
export async function getOrdersByDate(date: string) {
  try {
    // Lấy sales theo ngày
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select(`
        *,
        purchases (
          product_name,
          unit
        ),
        expenses (
          id,
          expense_type,
          description,
          amount
        )
      `)
      .eq("sale_date", date)
      .order("created_at", { ascending: false })

    if (salesError) throw salesError

    // Lấy orders theo ngày
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          purchase_id,
          quantity,
          unit_price,
          total_price,
          notes,
          purchases (
            id,
            product_name,
            unit
          )
        )
      `)
      .eq("sale_date", date)
      .order("created_at", { ascending: false })

    if (ordersError) throw ordersError

    // Chuyển đổi format tương tự như trên
    const formattedOrders = (orders || []).map(order => ({
      ...order,
      total_revenue: (order.order_items || []).reduce((sum, item) => sum + item.total_price, 0),
      purchases: order.order_items?.[0]?.purchases || null,
      is_new_order: true,
      total_items: order.order_items?.length || 0,
      order_items: order.order_items || []
    }))

    const formattedSales = (sales || []).map(sale => ({
      ...sale,
      is_new_order: false,
      total_items: 1,
      order_items: [{
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        total_price: sale.total_revenue,
        purchases: sale.purchases
      }]
    }))

    const allOrders = [...formattedSales, ...formattedOrders].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return { success: true, data: allOrders }
  } catch (error: any) {
    console.error("Error fetching orders by date:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi tải đơn hàng theo ngày" }
  }
}

// Hàm helper để lấy thống kê tổng hợp
export async function getCombinedStats() {
  try {
    const today = new Date().toISOString().split("T")[0]

    const [
      salesResult,
      ordersResult,
      todaySalesResult,
      todayOrdersResult
    ] = await Promise.all([
      supabase.from("sales").select("*"),
      supabase.from("orders").select("*"),
      supabase.from("sales").select("*").eq("sale_date", today),
      supabase.from("orders").select("*").eq("sale_date", today)
    ])

    const sales = salesResult.data || []
    const orders = ordersResult.data || []
    const todaySales = todaySalesResult.data || []
    const todayOrders = todayOrdersResult.data || []

    // Tính tổng doanh thu từ orders
    const ordersRevenue = orders.reduce((sum, order) => {
      // Cần lấy order_items để tính tổng
      return sum + (order.amount_paid || 0) // Tạm thời dùng amount_paid, sẽ cập nhật sau
    }, 0)

    const salesRevenue = sales.reduce((sum, sale) => sum + (sale.total_revenue || 0), 0)
    const todaySalesRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_revenue || 0), 0)
    const todayOrdersRevenue = todayOrders.reduce((sum, order) => sum + (order.amount_paid || 0), 0)

    return {
      totalSales: sales.length,
      totalOrders: orders.length,
      totalRevenue: salesRevenue + ordersRevenue,
      todaySales: todaySales.length,
      todayOrders: todayOrders.length,
      todayRevenue: todaySalesRevenue + todayOrdersRevenue
    }
  } catch (error: any) {
    console.error("Error fetching combined stats:", error)
    return {
      totalSales: 0,
      totalOrders: 0,
      totalRevenue: 0,
      todaySales: 0,
      todayOrders: 0,
      todayRevenue: 0
    }
  }
}

export async function updateOrderComplete(orderId: string, formData: any) {
  try {
    const {
      customer_name,
      delivery_method,
      amount_paid,
      shipping_fee,
      sale_date,
      notes,
      order_items
    } = formData

    if (!order_items || order_items.length === 0) {
      throw new Error("Đơn hàng phải có ít nhất một sản phẩm")
    }
    for (let i = 0; i < order_items.length; i++) {
      const item = order_items[i]
      if (!item.purchase_id || !item.quantity || !item.price) {
        throw new Error(`Vui lòng điền đầy đủ thông tin cho sản phẩm thứ ${i + 1}`)
      }
    }

    // Tính tổng tiền
    const totalOrderPrice = order_items.reduce((sum: number, item: any) => sum + (Number(item.price) || 0), 0)
    const totalAmount = totalOrderPrice + (Number(shipping_fee) || 0)
    const amountRemaining = totalAmount - (Number(amount_paid) || 0)

    let paymentStatus: "paid" | "unpaid" | "partial"
    if ((Number(amount_paid) || 0) >= totalAmount) {
      paymentStatus = "paid"
    } else if ((Number(amount_paid) || 0) > 0) {
      paymentStatus = "partial"
    } else {
      paymentStatus = "unpaid"
    }

    // Lấy order_items cũ
    const { data: currentOrder, error: fetchError } = await supabase
      .from("orders")
      .select(`id, order_items (id, purchase_id, quantity)`)
      .eq("id", orderId)
      .single()
    if (fetchError || !currentOrder) {
      throw new Error("Không tìm thấy đơn hàng")
    }
    const oldItems = currentOrder.order_items || []

    // Tạo map purchase_id -> old quantity
    const oldMap = new Map<string, number>()
    for (const item of oldItems) {
      oldMap.set(item.purchase_id, Number(item.quantity))
    }
    // Tạo map purchase_id -> new quantity
    const newMap = new Map<string, number>()
    for (const item of order_items) {
      newMap.set(item.purchase_id, (newMap.get(item.purchase_id) || 0) + Number(item.quantity))
    }

    // Lấy tất cả purchase_id liên quan
    const allPurchaseIds = Array.from(new Set([
      ...Array.from(oldMap.keys()),
      ...Array.from(newMap.keys()),
    ]))

    // Lấy tồn kho hiện tại của tất cả purchase_id
    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select("id, remaining_quantity")
      .in("id", allPurchaseIds)
    if (purchasesError) throw purchasesError
    const purchaseMap = new Map<string, number>()
    for (const p of purchases) {
      purchaseMap.set(p.id, Number(p.remaining_quantity))
    }

    // Tính lại tồn kho mới cho từng purchase_id
    for (const purchaseId of allPurchaseIds) {
      const oldQty = oldMap.get(purchaseId) || 0
      const newQty = newMap.get(purchaseId) || 0
      const currentStock = purchaseMap.get(purchaseId) || 0
      const afterStock = currentStock + oldQty - newQty
      if (afterStock < 0) {
        throw new Error(`Số lượng sản phẩm vượt quá tồn kho (ID: ${purchaseId})`)
      }
    }

    // Cập nhật tồn kho cho từng purchase_id
    for (const purchaseId of allPurchaseIds) {
      const oldQty = oldMap.get(purchaseId) || 0
      const newQty = newMap.get(purchaseId) || 0
      const currentStock = purchaseMap.get(purchaseId) || 0
      const afterStock = currentStock + oldQty - newQty
      const { error: updateError } = await supabase
        .from("purchases")
        .update({ remaining_quantity: afterStock })
        .eq("id", purchaseId)
      if (updateError) throw updateError
    }

    // Cập nhật thông tin đơn hàng
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        customer_name: customer_name || null,
        delivery_method: delivery_method || "pickup",
        shipping_fee: Number(shipping_fee) || 0,
        payment_status: paymentStatus,
        amount_paid: Number(amount_paid) || 0,
        amount_remaining: amountRemaining,
        notes: notes || null,
      })
      .eq("id", orderId)
    if (orderError) throw orderError

    // Xóa order_items cũ
    const { error: deleteError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId)
    if (deleteError) throw deleteError

    // Thêm order_items mới
    const newOrderItems = order_items.map((item: any) => ({
      order_id: orderId,
      purchase_id: item.purchase_id,
      quantity: Number(item.quantity),
      unit_price: Math.round(Number(item.price) / Number(item.quantity)),
      total_price: Number(item.price),
      notes: null,
    }))
    const { error: insertError } = await supabase
      .from("order_items")
      .insert(newOrderItems)
    if (insertError) throw insertError

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error updating order:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi cập nhật đơn hàng" }
  }
}

export async function deleteOrder(orderId: string) {
  try {
    // Get order items to restore quantities
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        purchase_id,
        quantity,
        purchases (
          id,
          product_name,
          remaining_quantity
        )
      `)
      .eq("order_id", orderId)

    if (itemsError) throw itemsError

    if (!orderItems || orderItems.length === 0) {
      throw new Error("Không tìm thấy đơn hàng")
    }

    // Restore quantities for each item
    for (const item of orderItems) {
      if (item.purchases) {
        const newRemainingQuantity = item.purchases.remaining_quantity + item.quantity
        
        const { error: updateError } = await supabase
          .from("purchases")
          .update({ remaining_quantity: newRemainingQuantity })
          .eq("id", item.purchase_id)

        if (updateError) {
          console.error(`Error restoring quantity for purchase ${item.purchase_id}:`, updateError)
        }
      }
    }

    // Delete order items first
    const { error: deleteItemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId)

    if (deleteItemsError) throw deleteItemsError

    // Delete the order
    const { error: deleteOrderError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId)

    if (deleteOrderError) throw deleteOrderError

    await forceRefreshAll()
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting order:", error)
    return { success: false, error: error.message || "Có lỗi xảy ra khi xóa đơn hàng" }
  }
}
