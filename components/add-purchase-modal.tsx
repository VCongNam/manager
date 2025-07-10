"use client"

import type React from "react"

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
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export function AddPurchaseModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    product_name: "",
    quantity: "",
    unit: "",
    total_cost: "",
    purchase_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("purchases").insert([
        {
          product_name: formData.product_name,
          quantity: Number.parseFloat(formData.quantity),
          unit: formData.unit,
          total_cost: Number.parseInt(formData.total_cost),
          remaining_quantity: Number.parseFloat(formData.quantity),
          purchase_date: formData.purchase_date,
          notes: formData.notes || null,
        },
      ])

      if (error) throw error

      // Reset form
      setFormData({
        product_name: "",
        quantity: "",
        unit: "",
        total_cost: "",
        purchase_date: new Date().toISOString().split("T")[0],
        notes: "",
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating purchase:", error)
      alert("Có lỗi xảy ra khi tạo đơn nhập hàng")
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product_name">Tên sản phẩm *</Label>
              <Input
                id="product_name"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                placeholder="Ví dụ: Gạo ST25"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Đơn vị *</Label>
              <Input
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="Ví dụ: kg, chai, gói"
                required
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
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_cost">Tổng chi phí (VNĐ) *</Label>
              <Input
                id="total_cost"
                name="total_cost"
                type="number"
                value={formData.total_cost}
                onChange={handleChange}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_date">Ngày nhập *</Label>
            <Input
              id="purchase_date"
              name="purchase_date"
              type="date"
              value={formData.purchase_date}
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
