"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import type { Purchase } from "@/lib/supabase"

export default function NewSalePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [orderItems, setOrderItems] = useState([
    { purchase_id: "", quantity: "", price: "" }
  ])
  const [formData, setFormData] = useState({
    shipping_fee: "0",
    amount_paid: "",
    notes: "",
    sale_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .gt("remaining_quantity", 0)
      .order("product_name")

    if (error) {
      console.error("Error fetching purchases:", error)
      return
    }
    setPurchases(data || [])
  }

  const addOrderItem = () => setOrderItems([...orderItems, { purchase_id: "", quantity: "", price: "" }])
  const removeOrderItem = (idx: number) => setOrderItems(orderItems.filter((_, i) => i !== idx))
  const updateOrderItem = (idx: number, field: string, value: string) => {
    setOrderItems(orderItems.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }
  const getPurchaseById = (id: string) => purchases.find((p) => p.id === id)

  // Tính tổng tiền tự động (tổng các giá bán từng dòng)
  const totalOrderPrice = orderItems.reduce((sum, item) => {
    const price = Number(item.price) || 0
    return sum + price
  }, 0)
  const shippingFee = Number.parseInt(formData.shipping_fee) || 0
  const totalAmount = totalOrderPrice + shippingFee
  const amountPaid = Number.parseInt(formData.amount_paid) || 0
  const amountRemaining = totalAmount - amountPaid

  // Kiểm tra tồn kho khi nhập số lượng
  const isQuantityValid = (purchase_id: string, quantity: string) => {
    const purchase = getPurchaseById(purchase_id)
    if (!purchase) return true
    return Number(quantity) <= Number(purchase.remaining_quantity)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Validate
      for (let i = 0; i < orderItems.length; i++) {
        const item = orderItems[i]
        if (!item.purchase_id || !item.quantity || !item.price) {
          throw new Error(`Vui lòng điền đầy đủ thông tin cho sản phẩm thứ ${i + 1}`)
        }
        if (!isQuantityValid(item.purchase_id, item.quantity)) {
          throw new Error(`Số lượng vượt tồn kho cho sản phẩm thứ ${i + 1}`)
        }
      }
      // Chuẩn bị dữ liệu gửi đi
      const form = new FormData()
      orderItems.forEach((item, idx) => {
        form.append(`purchase_id_${idx}`, item.purchase_id)
        form.append(`quantity_${idx}`, item.quantity)
        form.append(`price_${idx}`, item.price)
      })
      form.append("total_items", orderItems.length.toString())
      form.append("shipping_fee", formData.shipping_fee)
      form.append("amount_paid", formData.amount_paid)
      form.append("notes", formData.notes)
      form.append("sale_date", formData.sale_date)
      // Gọi API backend (giống modal)
      const { data, error } = await supabase.functions.invoke("createOrderWithItems", { body: Object.fromEntries(form) })
      if (error) throw error
      router.push("/sales")
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra khi tạo đơn bán hàng")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/sales">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Thêm đơn bán hàng</h1>
          <p className="text-muted-foreground">Tạo đơn bán hàng nhiều sản phẩm</p>
        </div>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Thông tin bán hàng</CardTitle>
          <CardDescription>Chọn nhiều sản phẩm, nhập số lượng, giá bán từng dòng.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <span>Phí vận chuyển:</span>
                <span>{shippingFee.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tổng cộng:</span>
                <span className="font-semibold">{totalAmount.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Đã thanh toán:</span>
                <span>{amountPaid.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Còn lại:</span>
                <span className={amountRemaining > 0 ? "text-red-600 font-semibold" : "text-green-700 font-semibold"}>{amountRemaining.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
            {/* Ngày bán, ghi chú, submit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sale_date">Ngày bán *</Label>
                <Input
                  id="sale_date"
                  name="sale_date"
                  type="date"
                  value={formData.sale_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Ghi chú cho đơn hàng (nếu có)"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="mt-2">
                {loading ? "Đang lưu..." : "Lưu đơn hàng"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
