"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Sale, Purchase } from "@/lib/supabase"
import { updateSaleComplete, deleteSale, updateOrderComplete, deleteOrder } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

interface EditSaleModalProps {
  order: any // Có thể là đơn cũ (sales) hoặc mới (orders)
  children?: React.ReactNode
}

export function EditSaleModal({ order, children }: EditSaleModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const { toast } = useToast()

  // Phân biệt đơn hàng cũ/mới
  const isNewOrder = order.is_new_order === true

  // State cho formData
  const [formData, setFormData] = useState(
    isNewOrder
      ? {
          customer_name: order.customer_name || "",
          delivery_method: order.delivery_method || "pickup",
          amount_paid: order.amount_paid?.toString() || "0",
          shipping_fee: order.shipping_fee?.toString() || "0",
          sale_date: order.sale_date || "",
          notes: order.notes || "",
          order_items: order.order_items?.map((item: any) => ({
            purchase_id: item.purchase_id || item.purchases?.id,
            quantity: item.quantity.toString(),
            price: item.total_price.toString(),
          })) || [],
        }
      : {
          purchase_id: order.purchase_id || "",
          quantity: order.quantity?.toString() || "",
          total_revenue: order.total_revenue?.toString() || "",
          customer_name: order.customer_name || "",
          delivery_method: order.delivery_method || "pickup",
          amount_paid: order.amount_paid?.toString() || "0",
          shipping_fee: order.shipping_fee?.toString() || "0",
          sale_date: order.sale_date || "",
          notes: order.notes || "",
          notes_internal: order.notes_internal || "",
        }
  )

  // Hàm xử lý order_items cho đơn hàng mới
  const addOrderItem = () => {
    if (isNewOrder) {
      setFormData(prev => ({
        ...prev,
        order_items: [...(prev.order_items || []), { purchase_id: "", quantity: "", price: "" }]
      }))
    }
  }

  const removeOrderItem = (index: number) => {
    if (isNewOrder) {
      setFormData(prev => ({
        ...prev,
        order_items: prev.order_items?.filter((_, i) => i !== index) || []
      }))
    }
  }

  const updateOrderItem = (index: number, field: string, value: string) => {
    if (isNewOrder) {
      setFormData(prev => {
        const updated = {
          ...prev,
          order_items: prev.order_items?.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
          ) || []
        }
        console.log('updateOrderItem', { index, field, value, updatedOrderItems: updated.order_items })
        return updated
      })
    }
  }

  // Tính tổng tiền cho đơn hàng mới
  const totalOrderPrice = isNewOrder 
    ? (formData.order_items || []).reduce((sum, item) => sum + (Number(item.price) || 0), 0)
    : 0

  useEffect(() => {
    if (open) {
      fetchPurchases() // Luôn load danh sách sản phẩm cho cả hai loại đơn hàng
      
      if (!isNewOrder) {
        setFormData({
          purchase_id: order.purchase_id || "",
          quantity: order.quantity?.toString() || "",
          total_revenue: order.total_revenue?.toString() || "",
          customer_name: order.customer_name || "",
          delivery_method: order.delivery_method || "pickup",
          amount_paid: order.amount_paid?.toString() || "0",
          shipping_fee: order.shipping_fee?.toString() || "0",
          sale_date: order.sale_date || "",
          notes: order.notes || "",
          notes_internal: order.notes_internal || "",
        })
      } else {
        setFormData({
          customer_name: order.customer_name || "",
          delivery_method: order.delivery_method || "pickup",
          amount_paid: order.amount_paid?.toString() || "0",
          shipping_fee: order.shipping_fee?.toString() || "0",
          sale_date: order.sale_date || "",
          notes: order.notes || "",
          order_items: order.order_items?.map((item: any) => ({
            purchase_id: item.purchase_id || item.purchases?.id,
            quantity: item.quantity.toString(),
            price: item.total_price.toString(),
          })) || [],
        })
        console.log('order.order_items on open:', order.order_items)
      }
    }
  }, [open, order, isNewOrder])

  const fetchPurchases = async () => {
    // Lấy sản phẩm còn hàng
    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .gt("remaining_quantity", 0)
      .order("product_name")

    if (error) {
      console.error("Error fetching purchases:", error)
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải danh sách sản phẩm",
        variant: "destructive",
      })
      return
    }

    let filtered = data || []
    // Nếu đang chỉnh sửa đơn hàng mới, thêm các sản phẩm đã chọn (dù hết hàng)
    if (isNewOrder && order.order_items) {
      const selectedIds = order.order_items.map((item: any) => item.purchase_id)
      const missing = (order.order_items || [])
        .filter((item: any) => !filtered.find((p: any) => p.id === item.purchase_id))
        .map((item: any) => ({
          id: item.purchase_id,
          product_name: item.purchases?.product_name || "[Đã hết hàng]",
          remaining_quantity: 0,
          unit: item.purchases?.unit || "",
        }))
      filtered = [...filtered, ...missing]
    }
    // Nếu là đơn cũ, thêm sản phẩm đã chọn nếu không còn hàng
    if (!isNewOrder && order.purchase_id) {
      if (!filtered.find((p: any) => p.id === order.purchase_id)) {
        filtered.push({
          id: order.purchase_id,
          product_name: order.purchases?.product_name || "[Đã hết hàng]",
          remaining_quantity: 0,
          unit: order.purchases?.unit || "",
        })
      }
    }
    setPurchases(filtered)
    // Set selected purchase cho đơn cũ
    if (!isNewOrder) {
      const currentPurchase = filtered?.find((p) => p.id === order.purchase_id)
      setSelectedPurchase(currentPurchase || null)
    }
  }

  const handlePurchaseSelect = (purchaseId: string) => {
    const purchase = purchases.find((p) => p.id === purchaseId)
    setSelectedPurchase(purchase || null)
    setFormData((prev) => ({
      ...prev,
      purchase_id: purchaseId,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (isNewOrder) {
        // Validate order items
        if (!formData.order_items || formData.order_items.length === 0) {
          throw new Error("Đơn hàng phải có ít nhất một sản phẩm")
        }
        
        for (let i = 0; i < formData.order_items.length; i++) {
          const item = formData.order_items[i]
          if (!item.purchase_id) {
            throw new Error(`Vui lòng chọn sản phẩm cho mục ${i + 1}`)
          }
          if (!item.quantity || Number(item.quantity) <= 0) {
            throw new Error(`Số lượng phải lớn hơn 0 cho mục ${i + 1}`)
          }
          if (!item.price || Number(item.price) <= 0) {
            throw new Error(`Giá bán phải lớn hơn 0 cho mục ${i + 1}`)
          }
          // Check available quantity (cộng lại số lượng cũ của dòng này)
          const { max } = getMaxAndRemainQty(item.purchase_id, i)
          if (Number(item.quantity) > max) {
            const purchase = purchases.find(p => p.id === item.purchase_id)
            throw new Error(`Số lượng vượt quá tồn kho cho ${purchase?.product_name || ''}`)
          }
        }
      } else {
        // Validate old order
        if (!formData.purchase_id) {
          throw new Error("Vui lòng chọn sản phẩm")
        }
        if (!formData.quantity || Number(formData.quantity) <= 0) {
          throw new Error("Số lượng phải lớn hơn 0")
        }
        if (!formData.total_revenue || Number(formData.total_revenue) <= 0) {
          throw new Error("Giá bán phải lớn hơn 0")
        }
        if (Number(formData.quantity) > getAvailableQuantityForOldOrder(formData.purchase_id)) {
          throw new Error("Số lượng vượt quá tồn kho có sẵn")
        }
      }

      let result
      if (isNewOrder) {
        result = await updateOrderComplete(order.id, formData)
      } else {
        result = await updateSaleComplete(order.id, formData)
      }

      if (result?.success) {
        toast({
          title: "✅ Cập nhật thành công",
          description: "Thông tin đơn hàng đã được lưu",
          duration: 3000,
        })
        setOpen(false)
      } else {
        toast({
          title: "❌ Lỗi",
          description: result?.error || "Có lỗi xảy ra",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error: any) {
      console.error("Error updating order:", error)
      toast({
        title: "❌ Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật đơn hàng",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (
      !confirm("Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác và sẽ hoàn trả số lượng về kho.")
    ) {
      return
    }

    setDeleteLoading(true)

    try {
      let result
      if (isNewOrder) {
        result = await deleteOrder(order.id)
      } else {
        result = await deleteSale(order.id)
      }

      if (result.success) {
        toast({
          title: "✅ Xóa thành công",
          description: "Đơn hàng đã được xóa và số lượng đã được hoàn trả về kho",
          duration: 3000,
        })
        setOpen(false)
      } else {
        toast({
          title: "❌ Lỗi",
          description: result.error,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error: any) {
      console.error("Error deleting order:", error)
      toast({
        title: "❌ Lỗi hệ thống",
        description: error.message || "Có lỗi xảy ra khi xóa đơn hàng",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const shippingFee = Number.parseInt(formData.shipping_fee) || 0
  const amountPaid = Number.parseInt(formData.amount_paid) || 0
  const totalRevenue = Number.parseInt(formData.total_revenue) || 0
  const totalAmount = totalRevenue + shippingFee
  const amountRemaining = totalAmount - amountPaid

  // Calculate available quantity for selected purchase
  const availableQuantity = selectedPurchase
    ? selectedPurchase.remaining_quantity + (order.purchase_id === selectedPurchase.id ? Number(order.quantity) : 0)
    : 0

  // Calculate available quantities for new order items
  const getAvailableQuantityForItem = (purchaseId: string, currentQuantity: number) => {
    const purchase = purchases.find(p => p.id === purchaseId)
    if (!purchase) return 0
    
    // If this is the same purchase as in the original order, add back the original quantity
    const originalItem = order.order_items?.find((item: any) => item.purchase_id === purchaseId)
    const originalQuantity = originalItem ? Number(originalItem.quantity) : 0
    
    return purchase.remaining_quantity + originalQuantity
  }

  // Get available quantity for old order (single product)
  const getAvailableQuantityForOldOrder = (purchaseId: string) => {
    const purchase = purchases.find(p => p.id === purchaseId)
    if (!purchase) return 0
    
    // If this is the same product as the original order, add back the original quantity
    if (purchaseId === order.purchase_id) {
      return purchase.remaining_quantity + Number(order.quantity)
    }
    
    // If it's a different product, just use the current remaining quantity
    return purchase.remaining_quantity
  }

  // Hàm tính tồn kho tối đa và còn lại cho từng dòng sản phẩm (dùng cho validation và input max)
  const getMaxAndRemainQty = (purchaseId: string, idx: number) => {
    const purchase = purchases.find((p) => p.id === purchaseId)
    if (!purchase) return { max: 0, remain: 0 }
    // Tổng số lượng đã bán của sản phẩm này trong đơn cũ (trừ dòng đang xét)
    const totalOldQtyOtherRows = (order.order_items || [])
      .filter((oi: any, i: number) => oi.purchase_id === purchaseId && i !== idx)
      .reduce((sum: number, oi: any) => sum + Number(oi.quantity), 0)
    // Số lượng cũ của dòng đang xét (theo index)
    const oldQtyOfThisRow = (order.order_items || [])[idx]?.purchase_id === purchaseId ? Number((order.order_items || [])[idx].quantity) : 0
    // Số lượng đang nhập ở các dòng khác (trong formData)
    const usedInOtherRows = (formData.order_items || [])
      .filter((oi: any, i: number) => oi.purchase_id === purchaseId && i !== idx)
      .reduce((sum: number, oi: any) => sum + Number(oi.quantity), 0)
    // Tối đa = tồn kho hiện tại + số lượng cũ của dòng này + tổng số lượng cũ ở các dòng khác
    const maxQty = purchase.remaining_quantity + oldQtyOfThisRow + totalOldQtyOtherRows
    // Còn lại = tối đa - tổng số lượng đang nhập ở các dòng khác
    const remainQty = maxQty - usedInOtherRows
    return { max: maxQty, remain: remainQty }
  }

  // Validation states
  const hasValidationErrors = () => {
    if (isNewOrder) {
      return !formData.order_items || formData.order_items.some((item: any) => 
        !item.purchase_id || !item.quantity || !item.price || 
        Number(item.quantity) <= 0 || Number(item.price) <= 0
      )
    } else {
      return !formData.purchase_id || !formData.quantity || !formData.total_revenue ||
        Number(formData.quantity) <= 0 || Number(formData.total_revenue) <= 0 ||
        Number(formData.quantity) > getAvailableQuantityForOldOrder(formData.purchase_id)
    }
  }

  // Reset state khi đóng modal
  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value && isNewOrder) {
      setFormData({
        customer_name: order.customer_name || "",
        delivery_method: order.delivery_method || "pickup",
        amount_paid: order.amount_paid?.toString() || "0",
        shipping_fee: order.shipping_fee?.toString() || "0",
        sale_date: order.sale_date || "",
        notes: order.notes || "",
        order_items: order.order_items?.map((item: any) => ({
          purchase_id: item.purchase_id || item.purchases?.id,
          quantity: item.quantity.toString(),
          price: item.total_price.toString(),
        })) || [],
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Chỉnh sửa đơn hàng</DialogTitle>
          <DialogDescription>
            Cập nhật toàn bộ thông tin đơn hàng - Ngày: {new Date(order.sale_date).toLocaleDateString("vi-VN")}
            {isNewOrder && " (Đơn hàng nhiều sản phẩm)"}
          </DialogDescription>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Mã đơn hàng:</span>
                <span className="ml-2 text-gray-900">#{order.id.slice(-8)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Trạng thái thanh toán:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  order.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.payment_status === 'paid' ? 'Đã thanh toán' :
                   order.payment_status === 'partial' ? 'Thanh toán một phần' : 'Chưa thanh toán'}
                </span>
              </div>
              {isNewOrder && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Số sản phẩm:</span>
                  <span className="ml-2 text-gray-900">{order.order_items?.length || 0} loại</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isNewOrder ? (
              // UI cho đơn hàng mới (nhiều sản phẩm)
              <>
                {/* Danh sách sản phẩm */}
                <div className="space-y-3">
                  {(formData.order_items || []).map((item, idx) => {
                    const purchase = purchases.find(p => p.id === item.purchase_id)
                    console.log('Render row', { idx, purchase_id: item.purchase_id, item })
                    return (
                      <div key={`${item.purchase_id || 'empty'}-${idx}`} className="bg-white border rounded-lg shadow-sm p-4 flex flex-col gap-2 relative">
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5">
                            <Label className="text-sm font-medium">Sản phẩm</Label>
                            <Select
                              value={item.purchase_id}
                              onValueChange={(val) => updateOrderItem(idx, "purchase_id", val)}
                              required
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn sản phẩm" />
                              </SelectTrigger>
                              <SelectContent>
                                {purchases.map((purchase) => (
                                  <SelectItem key={purchase.id} value={purchase.id}>
                                    {purchase.product_name} - Còn: {purchase.remaining_quantity} {purchase.unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Label className="text-sm font-medium">Số lượng</Label>
                            <Input
                              type="number"
                              min={1}
                              max={getMaxAndRemainQty(item.purchase_id, idx).max || undefined}
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(idx, "quantity", e.target.value)}
                              placeholder="Số lượng"
                              className="w-full"
                              required
                            />
                          </div>
                          <div className="col-span-3">
                            <Label className="text-sm font-medium">Thành tiền</Label>
                            <Input
                              type="number"
                              min={0}
                              value={item.price}
                              onChange={(e) => updateOrderItem(idx, "price", e.target.value)}
                              placeholder="Giá bán (tổng)"
                              className="w-full"
                              required
                            />
                          </div>
                          <div className="col-span-1 flex justify-end items-center h-full">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOrderItem(idx)} disabled={(formData.order_items || []).length === 1} className="text-red-500 hover:bg-red-50">
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                        {purchase && (
                          <div className="pt-1 text-xs text-gray-500">
                            {(() => {
                              const { max, remain } = getMaxAndRemainQty(item.purchase_id, idx)
                              return `Tối đa: ${max} ${purchase.unit} • Còn lại: ${remain} ${purchase.unit}`
                            })()}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <Button type="button" variant="outline" className="mt-1" onClick={addOrderItem}>
                    + Thêm sản phẩm
                  </Button>
                </div>

                {/* Tổng kết thanh toán */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                  <div className="font-semibold text-base mb-2">Tổng kết thanh toán</div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tổng giá bán:</span>
                    <span>{totalOrderPrice.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tổng cộng:</span>
                    <span className="font-bold text-blue-700">{totalOrderPrice.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Đã trả:</span>
                    <span className="text-green-700">{(Number(formData.amount_paid) || 0).toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Còn lại:</span>
                    <span className="text-red-600 font-semibold">{(totalOrderPrice - (Number(formData.amount_paid) || 0)).toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </>
            ) : (
              // UI cho đơn hàng cũ (một sản phẩm) - giữ nguyên
              <>
                <div className="space-y-2">
                  <Label htmlFor="purchase_id">Sản phẩm *</Label>
                  <Select name="purchase_id" value={formData.purchase_id} onValueChange={handlePurchaseSelect} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchases.map((purchase) => (
                        <SelectItem key={purchase.id} value={purchase.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{purchase.product_name}</span>
                            <span className="text-xs text-gray-500">
                              Còn: {getAvailableQuantityForOldOrder(purchase.id)} {purchase.unit} • 
                              Giá: {((purchase.total_cost || 0) / (purchase.quantity || 1)).toLocaleString("vi-VN")}đ/{purchase.unit}
                              {purchase.supplier_name && ` • NCC: ${purchase.supplier_name}`}
                              {purchase.id === order.purchase_id && ` • Hiện tại: +${order.quantity}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPurchase && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">{selectedPurchase.product_name}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Số lượng có sẵn:</span>
                            <span className="ml-2 text-blue-700 font-semibold">
                              {getAvailableQuantityForOldOrder(selectedPurchase.id)} {selectedPurchase.unit}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Giá nhập:</span>
                            <span className="ml-2 text-green-700 font-semibold">
                              {((selectedPurchase.total_cost || 0) / (selectedPurchase.quantity || 1)).toLocaleString("vi-VN")}đ/{selectedPurchase.unit}
                            </span>
                          </div>
                          {selectedPurchase.supplier_name && (
                            <div className="col-span-2">
                              <span className="font-medium text-gray-700">Nhà cung cấp:</span>
                              <span className="ml-2 text-gray-600">{selectedPurchase.supplier_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Tổng chi phí</div>
                        <div className="font-bold text-lg text-blue-900">
                          {(selectedPurchase.total_cost || 0).toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Số lượng bán *</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      max={getAvailableQuantityForOldOrder(formData.purchase_id)}
                      value={formData.quantity}
                      onChange={handleChange}
                      className={`${Number(formData.quantity) > getAvailableQuantityForOldOrder(formData.purchase_id) ? 'border-red-300' : ''}`}
                      required
                    />
                    {formData.purchase_id && (
                      <div className="text-xs text-gray-500">
                        Có sẵn: {getAvailableQuantityForOldOrder(formData.purchase_id)} {selectedPurchase?.unit}
                        {Number(formData.quantity) > getAvailableQuantityForOldOrder(formData.purchase_id) && (
                          <span className="text-red-500 ml-1">• Vượt quá tồn kho!</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_revenue">Giá bán (VNĐ) *</Label>
                    <Input
                      id="total_revenue"
                      name="total_revenue"
                      type="number"
                      placeholder="0"
                      value={formData.total_revenue}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Các trường chung cho cả hai loại đơn hàng */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Tên khách hàng</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  placeholder="Tên khách hàng"
                  value={formData.customer_name}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_method">Phương thức giao hàng</Label>
                <Select name="delivery_method" value={formData.delivery_method} onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_method: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">🏪 Tự lấy</SelectItem>
                    <SelectItem value="delivery">🚚 Giao hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shipping_fee">Phí ship (VNĐ)</Label>
                <Input
                  id="shipping_fee"
                  name="shipping_fee"
                  type="number"
                  placeholder="0"
                  value={formData.shipping_fee}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount_paid">Khách đã trả (VNĐ)</Label>
                <Input
                  id="amount_paid"
                  name="amount_paid"
                  type="number"
                  placeholder="0"
                  value={formData.amount_paid}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Ghi chú đơn hàng"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
              />
            </div>

            {!isNewOrder && (
              <div className="space-y-2">
                <Label htmlFor="notes_internal">Ghi chú nội bộ</Label>
                <Textarea
                  id="notes_internal"
                  name="notes_internal"
                  placeholder="Ghi chú nội bộ..."
                  value={formData.notes_internal}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || hasValidationErrors()}>
                {loading ? "Đang cập nhật..." : "Cập nhật đơn hàng"}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? "Đang xóa..." : "Xóa đơn hàng"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
            </div>
            
            {hasValidationErrors() && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Vui lòng kiểm tra lại thông tin: đảm bảo đã chọn sản phẩm, nhập số lượng và giá bán hợp lệ cho tất cả các mục.
                </p>
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
