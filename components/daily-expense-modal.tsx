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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Receipt } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { addDailyExpense, deleteDailyExpense } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import type { DailyExpense } from "@/lib/supabase"

interface DailyExpenseModalProps {
  selectedDate?: string
}

export function DailyExpenseModal({ selectedDate = new Date().toISOString().split("T")[0] }: DailyExpenseModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expenses, setExpenses] = useState<DailyExpense[]>([])
  const [expenseDate, setExpenseDate] = useState(selectedDate)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    expense_type: "other" as "fuel" | "rent" | "utilities" | "marketing" | "other",
    description: "",
    amount: "",
  })

  useEffect(() => {
    if (open) {
      fetchExpenses()
    }
  }, [open, expenseDate])

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("daily_expenses")
      .select("*")
      .eq("expense_date", expenseDate)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching daily expenses:", error)
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
      const result = await addDailyExpense(expenseDate, formData)

      if (result.success) {
        toast({
          title: "✅ Thành công!",
          description: "Đã thêm chi phí hàng ngày",
          duration: 3000,
        })
        setFormData({
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

  const handleDelete = async (expenseId: string) => {
    if (!confirm("Bạn có chắc muốn xóa chi phí này?")) {
      return
    }

    try {
      const result = await deleteDailyExpense(expenseId)

      if (result.success) {
        toast({
          title: "✅ Xóa thành công",
          description: "Chi phí đã được xóa",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  const getExpenseTypeLabel = (type: string) => {
    switch (type) {
      case "fuel":
        return "⛽ Xăng xe"
      case "rent":
        return "🏠 Thuê mặt bằng"
      case "utilities":
        return "💡 Điện nước"
      case "marketing":
        return "📢 Marketing"
      case "other":
        return "📝 Khác"
      default:
        return "📝 Khác"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Receipt className="h-4 w-4" />
          Chi phí hàng ngày
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Quản lý chi phí hàng ngày</DialogTitle>
          <DialogDescription>
            Nhập các chi phí phát sinh hàng ngày (xăng xe, thuê mặt bằng, điện nước, v.v.)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Chọn ngày */}
          <div className="space-y-6">
            {/* Chọn ngày */}
            <div className="space-y-2">
              <Label htmlFor="expense_date">Chọn ngày</Label>
              <Input
                id="expense_date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>

            {/* Form thêm chi phí */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thêm chi phí mới</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="expense_type">Loại chi phí *</Label>
                      <Select
                        value={formData.expense_type}
                        onValueChange={(value: any) => setFormData((prev) => ({ ...prev, expense_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fuel">⛽ Xăng xe</SelectItem>
                          <SelectItem value="rent">🏠 Thuê mặt bằng</SelectItem>
                          <SelectItem value="utilities">💡 Điện nước</SelectItem>
                          <SelectItem value="marketing">📢 Marketing</SelectItem>
                          <SelectItem value="other">📝 Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Số tiền (VNĐ) *</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả chi phí *</Label>
                    <Input
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Mô tả chi tiết về chi phí..."
                      required
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Đang thêm..." : "Thêm chi phí"}
                      <Plus className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Danh sách chi phí trong ngày */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Chi phí ngày {new Date(expenseDate).toLocaleDateString("vi-VN")}
                </CardTitle>
                <CardDescription>
                  Tổng chi phí: {totalExpenses.toLocaleString("vi-VN")}đ ({expenses.length} khoản)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{getExpenseTypeLabel(expense.expense_type)}</Badge>
                          <span className="text-sm font-medium">{expense.description}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(expense.created_at).toLocaleString("vi-VN")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-red-600">-{expense.amount.toLocaleString("vi-VN")}đ</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {expenses.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>Chưa có chi phí nào trong ngày này</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
