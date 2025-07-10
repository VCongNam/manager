"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import type { Purchase } from "@/lib/supabase"

export default function NewSalePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [formData, setFormData] = useState({
    purchase_id: "",
    quantity: "",
    total_price: "",
    payment_status: "unpaid" as "paid" | "unpaid" | "partial",
    sale_date: new Date().toISOString().split("T")[0],
    notes: "",
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
      const quantity = Number.parseFloat(formData.quantity)
      const totalPrice = Number.parseInt(formData.total_price)
      const unitPrice = Math.round(totalPrice / quantity)

      if (!selectedPurchase) {
        throw new Error("Vui lòng chọn sản phẩm")
      }

      if (quantity > selectedPurchase.remaining_quantity) {
        throw new Error("Số lượng bán vượt quá số lượng tồn kho")
      }

      // Insert sale
      const { error: saleError } = await supabase.from("sales").insert([
        {
          purchase_id: formData.purchase_id,
          quantity: quantity,
          unit_price: unitPrice,
          total_revenue: totalPrice,
          payment_status: formData.payment_status,
          sale_date: formData.sale_date,
          notes: formData.notes || null,
        },
      ])

      if (saleError) throw saleError

      // Update remaining quantity in purchases
      const newRemainingQuantity = selectedPurchase.remaining_quantity - quantity
      const { error: updateError } = await supabase
        .from("purchases")
        .update({ remaining_quantity: newRemainingQuantity })
        .eq("id", formData.purchase_id)

      if (updateError) throw updateError

      router.push("/sales")
    } catch (error: any) {
      console.error("Error creating sale:", error)
      alert(error.message || "Có lỗi xảy ra khi tạo đơn bán hàng")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
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
          <p className="text-muted-foreground">Tạo đơn bán hàng mới</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Thông tin bán hàng</CardTitle>
          <CardDescription>Điền đầy đủ thông tin về đơn hàng bán ra</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_id">Chọn sản phẩm *</Label>
              <Select onValueChange={handlePurchaseSelect} required>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sản phẩm để bán" />
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

            {selectedPurchase && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Thông tin sản phẩm:</h4>
                <p className="text-sm text-muted-foreground">
                  Tên: {selectedPurchase.product_name}
                  <br />
                  Số lượng còn lại: {selectedPurchase.remaining_quantity} {selectedPurchase.unit}
                  <br />
                  Giá nhập: {(selectedPurchase.total_cost / selectedPurchase.quantity).toLocaleString("vi-VN")}đ/
                  {selectedPurchase.unit}
                </p>
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
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  max={selectedPurchase?.remaining_quantity || undefined}
                  required
                />
                {selectedPurchase && (
                  <p className="text-xs text-muted-foreground">
                    Tối đa: {selectedPurchase.remaining_quantity} {selectedPurchase.unit}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_price">Tổng giá tiền (VNĐ) *</Label>
                <Input
                  id="total_price"
                  name="total_price"
                  type="number"
                  value={formData.total_price}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_status">Trạng thái thanh toán *</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value: "paid" | "unpaid" | "partial") =>
                  setFormData((prev) => ({ ...prev, payment_status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">✅ Đã thanh toán</SelectItem>
                  <SelectItem value="unpaid">❌ Chưa thanh toán</SelectItem>
                  <SelectItem value="partial">⏳ Thanh toán một phần</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.total_price && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-medium text-green-800">
                  Tổng tiền: {Number.parseInt(formData.total_price).toLocaleString("vi-VN")}đ
                </p>
                {formData.quantity && (
                  <p className="text-sm text-green-700">
                    Đơn giá trung bình:{" "}
                    {(Number.parseInt(formData.total_price) / Number.parseFloat(formData.quantity)).toLocaleString(
                      "vi-VN",
                    )}
                    đ/{selectedPurchase?.unit}
                  </p>
                )}
              </div>
            )}

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
                placeholder="Ghi chú về đơn hàng..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || !selectedPurchase}>
                {loading ? "Đang tạo..." : "Tạo đơn bán hàng"}
              </Button>
              <Link href="/sales">
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
