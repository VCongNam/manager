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
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Sale, Expense } from "@/lib/supabase"
import { updateSale, addExpense, deleteExpense } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

interface EditSaleModalProps {
  sale: Sale
  children?: React.ReactNode
}

export function EditSaleModal({ sale, children }: EditSaleModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    shipping_fee: sale.shipping_fee?.toString() || "0",
    payment_status: sale.payment_status || "unpaid",
    notes: sale.notes || "",
    notes_internal: sale.notes_internal || "",
  })
  const [newExpense, setNewExpense] = useState({
    expense_type: "other" as "shipping_cost" | "packaging" | "other",
    description: "",
    amount: "",
  })

  useEffect(() => {
    if (open) {
      fetchExpenses()
      // Reset form data when opening
      setFormData({
        shipping_fee: sale.shipping_fee?.toString() || "0",
        payment_status: sale.payment_status || "unpaid",
        notes: sale.notes || "",
        notes_internal: sale.notes_internal || "",
      })
    }
  }, [open, sale])

  const fetchExpenses = async () => {
    const { data, error } = await supabase.from("expenses").select("*").eq("sale_id", sale.id).order("created_at")

    if (error) {
      console.error("Error fetching expenses:", error)
      toast({
        title: "❌ Lỗi",
        description: "Không thể tải danh sách chi phí",
        variant: "destructive",
      })
      return
    }

    setExpenses(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateSale(sale.id, formData)

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

  const handleAddExpense = async () => {
    if (!newExpense.description.trim() || !newExpense.amount) {
      toast({
        title: "⚠️ Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin chi phí",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    try {
      const result = await addExpense(sale.id, newExpense)

      if (result.success) {
        toast({
          title: "✅ Thêm thành công",
          description: "Chi phí đã được thêm vào đơn hàng",
          duration: 2000,
        })
        setNewExpense({
          expense_type: "other",
          description: "",
          amount: "",
        })
        fetchExpenses()
      } else {
        toast({
          title: "❌ Lỗi",
          description: result.error,
          variant: "destructive",
          duration: 4000,
        })
      }
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "❌ Lỗi hệ thống",
        description: "Có lỗi xảy ra khi thêm chi phí",
        variant: "destructive",
        duration: 4000,
      })
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const result = await deleteExpense(expenseId)

      if (result.success) {
        toast({
          title: "✅ Xóa thành công",
          description: "Chi phí đã được xóa khỏi đơn hàng",
          duration: 2000,
        })
        fetchExpenses()
      } else {
        toast({
          title: "❌ Lỗi",
          description: result.error,
          variant: "destructive",
          duration: 4000,
        })
      }
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast({
        title: "❌ Lỗi hệ thống",
        description: "Có lỗi xảy ra khi xóa chi phí",
        variant: "destructive",
        duration: 4000,
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const shippingFee = Number.parseInt(formData.shipping_fee) || 0
  const finalRevenue = sale.total_revenue + shippingFee + totalExpenses

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa đơn hàng</DialogTitle>
          <DialogDescription>
            {sale.purchases?.product_name} - {sale.quantity} {sale.purchases?.unit}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thông tin cơ bản */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Thông tin đơn hàng</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Sản phẩm: {sale.purchases?.product_name}</div>
              <div>
                Số lượng: {sale.quantity} {sale.purchases?.unit}
              </div>
              <div>Giá gốc: {sale.total_revenue.toLocaleString("vi-VN")}đ</div>
              <div>Ngày bán: {new Date(sale.sale_date).toLocaleDateString("vi-VN")}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shipping_fee">Phí ship (VNĐ)</Label>
                <Input
                  id="shipping_fee"
                  name="shipping_fee"
                  type="number"
                  value={formData.shipping_fee}
                  onChange={handleChange}
                  placeholder="0 (âm = chi phí, dương = thu thêm)"
                />
                <p className="text-xs text-muted-foreground">Âm (-): Chi phí ship | Dương (+): Thu phí ship từ khách</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_status">Trạng thái thanh toán</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value: "paid" | "unpaid" | "partial") =>
                    setFormData((prev) => ({ ...prev, payment_status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">✅ Đã thanh toán</SelectItem>
                    <SelectItem value="unpaid">❌ Chưa thanh toán</SelectItem>
                    <SelectItem value="partial">⏳ Thanh toán một phần</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
            </div>
          </form>

          {/* Chi phí khác */}
          <div className="space-y-4">
            <h4 className="font-medium">Chi phí khác</h4>

            {/* Danh sách chi phí hiện tại */}
            {expenses.length > 0 && (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {expense.expense_type === "shipping_cost"
                            ? "Ship"
                            : expense.expense_type === "packaging"
                              ? "Đóng gói"
                              : "Khác"}
                        </Badge>
                        <span className="text-sm">{expense.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${expense.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {expense.amount >= 0 ? "+" : ""}
                        {expense.amount.toLocaleString("vi-VN")}đ
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Bạn có chắc muốn xóa chi phí này?")) {
                            handleDeleteExpense(expense.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Thêm chi phí mới */}
            <div className="p-4 border rounded-lg space-y-3">
              <h5 className="font-medium text-sm">Thêm chi phí mới</h5>
              <div className="grid gap-3 md:grid-cols-3">
                <Select
                  value={newExpense.expense_type}
                  onValueChange={(value: "shipping_cost" | "packaging" | "other") =>
                    setNewExpense((prev) => ({ ...prev, expense_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shipping_cost">Chi phí ship</SelectItem>
                    <SelectItem value="packaging">Đóng gói</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Mô tả chi phí"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense((prev) => ({ ...prev, description: e.target.value }))}
                />

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Số tiền"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                  <Button type="button" onClick={handleAddExpense} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Số âm (-) = chi phí, số dương (+) = thu thêm</p>
            </div>
          </div>

          {/* Tổng kết */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Tổng kết đơn hàng</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Doanh thu gốc:</span>
                <span>{sale.total_revenue.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between">
                <span>Phí ship:</span>
                <span className={shippingFee >= 0 ? "text-green-600" : "text-red-600"}>
                  {shippingFee >= 0 ? "+" : ""}
                  {shippingFee.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span>Chi phí khác:</span>
                <span className={totalExpenses >= 0 ? "text-green-600" : "text-red-600"}>
                  {totalExpenses >= 0 ? "+" : ""}
                  {totalExpenses.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-medium text-green-800">
                <span>Doanh thu thực:</span>
                <span>{finalRevenue.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
