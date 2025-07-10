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
import { Edit, Trash2 } from "lucide-react"
import { updatePurchase, deletePurchase } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import type { Purchase } from "@/lib/supabase"

interface EditPurchaseModalProps {
  purchase: Purchase
  children?: React.ReactNode
}

export function EditPurchaseModal({ purchase, children }: EditPurchaseModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    product_name: purchase.product_name,
    quantity: purchase.quantity.toString(),
    unit: purchase.unit,
    total_cost: purchase.total_cost.toString(),
    supplier_name: purchase.supplier_name || "",
    notes: purchase.notes || "",
  })

  useEffect(() => {
    if (open) {
      setFormData({
        product_name: purchase.product_name,
        quantity: purchase.quantity.toString(),
        unit: purchase.unit,
        total_cost: purchase.total_cost.toString(),
        supplier_name: purchase.supplier_name || "",
        notes: purchase.notes || "",
      })
    }
  }, [open, purchase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updatePurchase(purchase.id, formData)

      if (result.success) {
        toast({
          title: "✅ Cập nhật thành công",
          description: "Thông tin đơn nhập hàng đã được lưu",
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
      console.error("Error updating purchase:", error)
      toast({
        title: "❌ Lỗi hệ thống",
        description: "Có lỗi xảy ra khi cập nhật đơn nhập hàng",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn xóa đơn nhập hàng này? Hành động này không thể hoàn tác.")) {
      return
    }

    setDeleteLoading(true)

    try {
      const result = await deletePurchase(purchase.id)

      if (result.success) {
        toast({
          title: "✅ Xóa thành công",
          description: "Đơn nhập hàng đã được xóa",
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
      console.error("Error deleting purchase:", error)
      toast({
        title: "❌ Lỗi hệ thống",
        description: "Có lỗi xảy ra khi xóa đơn nhập hàng",
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

  const soldQuantity = purchase.quantity - purchase.remaining_quantity

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Chỉnh sửa đơn nhập hàng</DialogTitle>
          <DialogDescription>Cập nhật thông tin đơn nhập hàng</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Thông tin hiện tại */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Thông tin hiện tại</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                Đã bán: {soldQuantity} {purchase.unit}
              </div>
              <div>
                Còn lại: {purchase.remaining_quantity} {purchase.unit}
              </div>
              <div>Ngày nhập: {new Date(purchase.purchase_date).toLocaleDateString("vi-VN")}</div>
              <div>Giá nhập/đơn vị: {(purchase.total_cost / purchase.quantity).toLocaleString("vi-VN")}đ</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product_name">Tên sản phẩm *</Label>
                <Input
                  id="product_name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Tên nhà cung cấp</Label>
                <Input
                  id="supplier_name"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleChange}
                  placeholder="Tên nhà cung cấp"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Số lượng *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
                {soldQuantity > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tối thiểu: {soldQuantity} (đã bán {soldQuantity} {purchase.unit})
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Đơn vị *</Label>
                <Input id="unit" name="unit" value={formData.unit} onChange={handleChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_cost">Tổng chi phí (VNĐ) *</Label>
              <Input
                id="total_cost"
                name="total_cost"
                type="number"
                value={formData.total_cost}
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
                placeholder="Ghi chú thêm về sản phẩm..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteLoading || soldQuantity > 0}
              >
                {deleteLoading ? "Đang xóa..." : "Xóa"}
                <Trash2 className="h-4 w-4 ml-2" />
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
            </div>

            {soldQuantity > 0 && (
              <p className="text-xs text-red-600">* Không thể xóa đơn nhập hàng đã có giao dịch bán</p>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
