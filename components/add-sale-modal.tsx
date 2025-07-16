"use client"

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
import { Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { createOrderWithItems } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import type { Purchase } from "@/lib/supabase"

export function AddSaleModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [formData, setFormData] = useState({
    total_price: "",
    shipping_fee: "0",
    amount_paid: "",
  })
  const { toast } = useToast()

  // 1. State cho nhiều sản phẩm (thêm price)
  const [orderItems, setOrderItems] = useState([
    { purchase_id: "", quantity: "", price: "" }
  ])

  // 2. Hàm thêm/xóa dòng sản phẩm giữ nguyên
  const addOrderItem = () => setOrderItems([...orderItems, { purchase_id: "", quantity: "", price: "" }])
  const removeOrderItem = (idx: number) => setOrderItems(orderItems.filter((_, i) => i !== idx))

  // 3. Hàm cập nhật từng dòng sản phẩm (giữ nguyên)
  const updateOrderItem = (idx: number, field: string, value: string) => {
    setOrderItems(orderItems.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  // 4. Tính tổng tiền tự động (tổng các giá bán từng dòng)
  const totalOrderPrice = orderItems.reduce((sum, item) => {
    const price = Number(item.price) || 0
    return sum + price
  }, 0)

  // 4. Kiểm tra tồn kho khi nhập số lượng
  const getPurchaseById = (id: string) => purchases.find((p) => p.id === id)
  const isQuantityValid = (purchase_id: string, quantity: string) => {
    const purchase = getPurchaseById(purchase_id)
    if (!purchase) return true
    return Number(quantity) <= Number(purchase.remaining_quantity)
  }

  useEffect(() => {
    if (open) {
      fetchPurchases()
    }
  }, [open])

  const fetchPurchases = async () => {
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

    setPurchases(data || [])
  }

  const handlePurchaseSelect = (purchaseId: string) => {
    const purchase = purchases.find((p) => p.id === purchaseId)
    setSelectedPurchase(purchase || null)
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)

    try {
      // Thêm thông tin sản phẩm vào formData
      orderItems.forEach((item, idx) => {
        formData.append(`purchase_id_${idx}`, item.purchase_id)
        formData.append(`quantity_${idx}`, item.quantity)
        formData.append(`price_${idx}`, item.price)
      })
      
      // Thêm tổng số sản phẩm
      formData.append("total_items", orderItems.length.toString())

      const result = await createOrderWithItems(formData)

      if (result.success) {
        toast({
          title: "✅ Thành công!",
          description: "Đã thêm đơn bán hàng mới",
          duration: 3000,
        })
        setOrderItems([{ purchase_id: "", quantity: "", price: "" }])
        setFormData({ total_price: "", shipping_fee: "0", amount_paid: "" })
        setOpen(false)
      } else {
        toast({
          title: "❌ Lỗi",
          description: result.error,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "❌ Lỗi hệ thống",
        description: "Có lỗi xảy ra, vui lòng thử lại",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = Number.parseInt(formData.total_price) || 0
  const shippingFee = Number.parseInt(formData.shipping_fee) || 0
  const totalAmount = totalPrice + shippingFee
  const amountPaid = Number.parseInt(formData.amount_paid) || 0
  const amountRemaining = totalAmount - amountPaid

  // Reset state khi đóng modal
  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) {
      setOrderItems([{ purchase_id: "", quantity: "", price: "" }])
      setFormData({ total_price: "", shipping_fee: "0", amount_paid: "" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Thêm đơn bán hàng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Thêm đơn bán hàng</DialogTitle>
          <DialogDescription>Chọn nhiều sản phẩm, nhập số lượng, giá bán, tổng tiền từng sản phẩm.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form action={handleSubmit} className="space-y-4">
            {/* Danh sách sản phẩm */}
            <div className="space-y-3">
              {orderItems.map((item, idx) => {
                const purchase = getPurchaseById(item.purchase_id)
                return (
                  <div key={idx} className="bg-white border rounded-lg shadow-sm p-4 flex flex-col gap-2 relative">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label className="text-sm font-medium">Sản phẩm</Label>
                        <Select
                          name={`purchase_id_${idx}`}
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
                          name={`quantity_${idx}`}
                          type="number"
                          min={1}
                          max={purchase?.remaining_quantity || undefined}
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
                          name={`price_${idx}`}
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
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOrderItem(idx)} disabled={orderItems.length === 1} className="text-red-500 hover:bg-red-50">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    {purchase && (
                      <div className="pt-1 text-xs text-gray-500">
                        Tối đa: {purchase.remaining_quantity} {purchase.unit} • Còn lại: {purchase.remaining_quantity} {purchase.unit}
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

            {/* Các trường khác */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Tên khách hàng</Label>
                <Input id="customer_name" name="customer_name" placeholder="Tên khách hàng" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_method">Phương thức giao hàng</Label>
                <Select name="delivery_method" defaultValue="pickup">
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
                <Label htmlFor="amount_paid">Số tiền đã trả (VNĐ)</Label>
                <Input
                  id="amount_paid"
                  name="amount_paid"
                  type="number"
                  placeholder="0"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount_paid: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea id="notes" name="notes" placeholder="Ghi chú đơn hàng" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Đang lưu..." : "Tạo đơn hàng"}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
