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
import { updateSaleComplete, deleteSale } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

interface EditSaleModalProps {
  sale: Sale
  children?: React.ReactNode
}

export function EditSaleModal({ sale, children }: EditSaleModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    purchase_id: sale.purchase_id || "",
    quantity: sale.quantity?.toString() || "",
    total_revenue: sale.total_revenue?.toString() || "",
    customer_name: sale.customer_name || "",
    delivery_method: sale.delivery_method || "pickup",
    amount_paid: sale.amount_paid?.toString() || "0",
    shipping_fee: sale.shipping_fee?.toString() || "0",
    sale_date: sale.sale_date || "",
    notes: sale.notes || "",
    notes_internal: sale.notes_internal || "",
  })

  useEffect(() => {
    if (open) {
      fetchPurchases()
      setFormData({
        purchase_id: sale.purchase_id || "",
        quantity: sale.quantity?.toString() || "",
        total_revenue: sale.total_revenue?.toString() || "",
        customer_name: sale.customer_name || "",
        delivery_method: sale.delivery_method || "pickup",
        amount_paid: sale.amount_paid?.toString() || "0",
        shipping_fee: sale.shipping_fee?.toString() || "0",
        sale_date: sale.sale_date || "",
        notes: sale.notes || "",
        notes_internal: sale.notes_internal || "",
      })
    }
  }, [open, sale])

  const fetchPurchases = async () => {
    const { data, error } = await supabase.from("purchases").select("*").order("product_name")

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

    // Set selected purchase
    const currentPurchase = data?.find((p) => p.id === sale.purchase_id)
    setSelectedPurchase(currentPurchase || null)
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
      const result = await updateSaleComplete(sale.id, formData)

      if (result.success) {
        toast({
          title: "✅ Cập nhật thành công",
          description: "Thông tin đơn hàng đã được lưu",
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
    } catch (error) {
      console.error("Error updating sale:", error)
      toast({
        title: "❌ Lỗi hệ thống",
        description: "Có lỗi xảy ra khi cập nhật đơn hàng",
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
      const result = await deleteSale(sale.id)

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
    } catch (error) {
      console.error("Error deleting sale:", error)
      toast({
        title: "❌ Lỗi hệ thống",
        description: "Có lỗi xảy ra khi xóa đơn hàng",
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
    ? selectedPurchase.remaining_quantity + (sale.purchase_id === selectedPurchase.id ? sale.quantity : 0)
    : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            Cập nhật toàn bộ thông tin đơn hàng - Ngày: {new Date(sale.sale_date).toLocaleDateString("vi-VN")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chọn sản phẩm */}
            <div className="space-y-2">
              <Label htmlFor="purchase_id">Chọn sản phẩm *</Label>
              <Select value={formData.purchase_id} onValueChange={handlePurchaseSelect} required>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  {purchases.map((purchase) => (
                    <SelectItem key={purchase.id} value={purchase.id}>
                      {purchase.product_name} - Còn: {purchase.remaining_quantity} {purchase.unit}
                      {purchase.id === sale.purchase_id && ` (hiện tại: +${sale.quantity})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPurchase && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">{selectedPurchase.product_name}</p>
                <p className="text-muted-foreground">
                  Có thể bán: {availableQuantity} {selectedPurchase.unit} • Giá nhập:{" "}
                  {(selectedPurchase.total_cost / selectedPurchase.quantity).toLocaleString("vi-VN")}đ/
                  {selectedPurchase.unit}
                  {selectedPurchase.supplier_name && <span> • NCC: {selectedPurchase.supplier_name}</span>}
                </p>
              </div>
            )}

            {/* Thông tin khách hàng */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Tên khách hàng</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="Tên khách hàng"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_method">Phương thức giao hàng</Label>
                <Select
                  value={formData.delivery_method}
                  onValueChange={(value: "pickup" | "delivery") =>
                    setFormData((prev) => ({ ...prev, delivery_method: value }))
                  }
                >
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

            {/* Thông tin bán hàng */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="quantity">Số lượng *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  max={availableQuantity || undefined}
                  required
                />
                {selectedPurchase && (
                  <p className="text-xs text-muted-foreground">
                    Tối đa: {availableQuantity} {selectedPurchase.unit}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_revenue">Giá bán (VNĐ) *</Label>
                <Input
                  id="total_revenue"
                  name="total_revenue"
                  type="number"
                  value={formData.total_revenue}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
              </div>

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
            </div>

            {/* Thông tin thanh toán */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shipping_fee">Phí ship (VNĐ)</Label>
                <Input
                  id="shipping_fee"
                  name="shipping_fee"
                  type="number"
                  value={formData.shipping_fee}
                  onChange={handleChange}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Âm (-): Chi phí ship | Dương (+): Thu phí ship từ khách</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount_paid">Số tiền đã trả (VNĐ)</Label>
                <Input
                  id="amount_paid"
                  name="amount_paid"
                  type="number"
                  value={formData.amount_paid}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú khách hàng</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Ghi chú cho khách hàng..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes_internal">Ghi chú nội bộ</Label>
                <Textarea
                  id="notes_internal"
                  name="notes_internal"
                  value={formData.notes_internal}
                  onChange={handleChange}
                  placeholder="Ghi chú nội bộ (không hiển thị cho khách)..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? "Đang xóa..." : "Xóa đơn hàng"}
                <Trash2 className="h-4 w-4 ml-2" />
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
            </div>
          </form>

          {/* Tổng kết thanh toán */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Tổng kết thanh toán</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Giá bán:</span>
                <span>{totalRevenue.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between">
                <span>Phí ship:</span>
                <span className={shippingFee >= 0 ? "text-green-600" : "text-red-600"}>
                  {shippingFee >= 0 ? "+" : ""}
                  {shippingFee.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-medium text-blue-800">
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
              {formData.quantity && selectedPurchase && (
                <div className="flex justify-between text-purple-600 text-xs mt-2">
                  <span>Đơn giá:</span>
                  <span>
                    {(totalRevenue / Number.parseFloat(formData.quantity)).toLocaleString("vi-VN")}đ/
                    {selectedPurchase.unit}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
