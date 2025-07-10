"use client"

import { useState } from "react"
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
import { Plus } from "lucide-react"
import { createPurchase } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

export function AddPurchaseModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)

    try {
      const result = await createPurchase(formData)

      if (result.success) {
        toast({
          title: "✅ Thành công!",
          description: "Đã thêm đơn nhập hàng mới",
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Thêm đơn nhập hàng
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm đơn nhập hàng</DialogTitle>
          <DialogDescription>Điền đầy đủ thông tin về sản phẩm nhập kho</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product_name">Tên sản phẩm *</Label>
              <Input id="product_name" name="product_name" placeholder="Ví dụ: Gạo ST25" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Đơn vị *</Label>
              <Input id="unit" name="unit" placeholder="Ví dụ: kg, chai, gói" required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Số lượng *</Label>
              <Input id="quantity" name="quantity" type="number" step="0.01" placeholder="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_cost">Tổng chi phí (VNĐ) *</Label>
              <Input id="total_cost" name="total_cost" type="number" placeholder="0" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_date">Ngày nhập *</Label>
            <Input
              id="purchase_date"
              name="purchase_date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea id="notes" name="notes" placeholder="Ghi chú thêm về sản phẩm..." rows={3} />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo đơn nhập hàng"}
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
