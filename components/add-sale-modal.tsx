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
      const result = await createSale(formData)

      if (result.success) {
        toast({
          title: "✅ Thành công!",
          description: "Đã thêm đơn bán hàng mới",
          duration: 3000,
        })
        setSelectedPurchase(null)
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Thêm đơn bán hàng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Thêm đơn bán hàng</DialogTitle>
          <DialogDescription>Điền đầy đủ thông tin về đơn hàng bán ra</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
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
                  {selectedPurchase.supplier_name && <span> • NCC: {selectedPurchase.supplier_name}</span>}
                </p>
              </div>
            )}

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
                <Label htmlFor="total_price">Giá bán (VNĐ) *</Label>
                <Input
                  id="total_price"
                  name="total_price"
                  type="number"
                  placeholder="0"
                  value={formData.total_price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, total_price: e.target.value }))}
                  required
                />
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, shipping_fee: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Âm (-): Chi phí ship | Dương (+): Thu phí ship từ khách</p>
              </div>
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
            </div>

            {totalAmount > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Tổng kết thanh toán</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Giá bán:</span>
                    <span>{totalPrice.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí ship:</span>
                    <span className={shippingFee >= 0 ? "text-green-600" : "text-red-600"}>
                      {shippingFee >= 0 ? "+" : ""}
                      {shippingFee.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Tổng cộng:</span>
                    <span>{totalAmount.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Đã trả:</span>
                    <span>{amountPaid.toLocaleString("vi-VN")}đ</span>
                  </div>
                  {amountRemaining > 0 && (
                    <div className="flex justify-between text-red-600 font-medium">
                      <span>Còn lại:</span>
                      <span>{amountRemaining.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                  {amountRemaining < 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Thừa trả:</span>
                      <span>{Math.abs(amountRemaining).toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
        </div>
      </DialogContent>
    </Dialog>
  )
}
