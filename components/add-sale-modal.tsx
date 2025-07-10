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
import { Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { createSale } from "@/lib/actions"
import type { Purchase } from "@/lib/supabase"

export function AddSaleModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)

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
      const result = await createSale(formData)

      if (result.success) {
        setSelectedPurchase(null)
        setOpen(false)
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Thêm đơn bán hàng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm đơn bán hàng</DialogTitle>
          <DialogDescription>Điền đầy đủ thông tin về đơn hàng bán ra</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="purchase_id">Chọn sản phẩm *</Label>
            <Select name="purchase_id" onValueChange={handlePurchaseSelect} required>
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
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium">{selectedPurchase.product_name}</p>
              <p className="text-muted-foreground">
                Còn lại: {selectedPurchase.remaining_quantity} {selectedPurchase.unit} • Giá nhập:{" "}
                {(selectedPurchase.total_cost / selectedPurchase.quantity).toLocaleString("vi-VN")}đ/
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
                placeholder="0"
                max={selectedPurchase?.remaining_quantity || undefined}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_price">Tổng giá tiền (VNĐ) *</Label>
              <Input id="total_price" name="total_price" type="number" placeholder="0" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_status">Trạng thái thanh toán *</Label>
            <Select name="payment_status" defaultValue="unpaid">
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

          <div className="space-y-2">
            <Label htmlFor="sale_date">Ngày bán *</Label>
            <Input
              id="sale_date"
              name="sale_date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea id="notes" name="notes" placeholder="Ghi chú về đơn hàng..." rows={2} />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading || !selectedPurchase}>
              {loading ? "Đang tạo..." : "Tạo đơn bán hàng"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
