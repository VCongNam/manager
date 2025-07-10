"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { updateSalePaymentStatus } from "@/lib/actions"
import type { Sale } from "@/lib/supabase"

interface QuickPaymentToggleProps {
  sale: Sale
}

export function QuickPaymentToggle({ sale }: QuickPaymentToggleProps) {
  const [loading, setLoading] = useState(false)

  const togglePaymentStatus = async () => {
    setLoading(true)
    try {
      const newStatus = sale.payment_status === "paid" ? "unpaid" : "paid"
      const result = await updateSalePaymentStatus(sale.id, newStatus)

      if (!result.success) {
        alert(result.error)
      }
    } catch (error) {
      console.error("Error updating payment status:", error)
      alert("Có lỗi xảy ra khi cập nhật trạng thái thanh toán")
    } finally {
      setLoading(false)
    }
  }

  const getStatusDisplay = () => {
    switch (sale.payment_status) {
      case "paid":
        return {
          text: "✅ Đã TT",
          variant: "default" as const,
          bgColor: "bg-green-100 text-green-800 border-green-200",
        }
      case "unpaid":
        return { text: "❌ Chưa TT", variant: "destructive" as const, bgColor: "" }
      case "partial":
        return {
          text: "⏳ Một phần",
          variant: "secondary" as const,
          bgColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
        }
      default:
        return { text: "?", variant: "secondary" as const, bgColor: "" }
    }
  }

  const status = getStatusDisplay()

  return (
    <Button variant="ghost" size="sm" onClick={togglePaymentStatus} disabled={loading} className="p-1 h-auto">
      <Badge variant={status.variant} className={`text-xs cursor-pointer hover:opacity-80 ${status.bgColor}`}>
        {loading ? "..." : status.text}
      </Badge>
    </Button>
  )
}
