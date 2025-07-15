"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { updateSalePaymentStatus, updateOrderPaymentStatus } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import type { Sale } from "@/lib/supabase"

interface QuickPaymentToggleProps {
  order: any // Có thể là sale (cũ) hoặc order (mới)
}

export function QuickPaymentToggle({ order }: QuickPaymentToggleProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Kiểm tra xem đây là đơn hàng cũ hay mới
  const isNewOrder = order.is_new_order === true

  const togglePaymentStatus = async () => {
    setLoading(true)
    try {
      const currentStatus = order.payment_status
      const newStatus = currentStatus === "paid" ? "unpaid" : "paid"
      
      let result
      if (isNewOrder) {
        result = await updateOrderPaymentStatus(order.id, newStatus)
      } else {
        result = await updateSalePaymentStatus(order.id, newStatus)
      }

      if (result.success) {
        toast({
          title: "✅ Cập nhật thành công",
          description: `Trạng thái thanh toán đã được thay đổi thành "${
            newStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"
          }"`,
          duration: 2000,
        })
      } else {
        toast({
          title: "❌ Lỗi",
          description: result.error,
          variant: "destructive",
          duration: 4000,
        })
      }
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast({
        title: "❌ Lỗi hệ thống",
        description: "Có lỗi xảy ra khi cập nhật trạng thái thanh toán",
        variant: "destructive",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusDisplay = () => {
    const paymentStatus = order.payment_status
    
    switch (paymentStatus) {
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
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={togglePaymentStatus} 
      disabled={loading} 
      className="p-1 h-auto"
      title="Click để thay đổi trạng thái thanh toán"
    >
      <Badge 
        variant={status.variant} 
        className={`text-xs cursor-pointer hover:opacity-80 ${status.bgColor}`}
      >
        {loading ? "..." : status.text}
      </Badge>
    </Button>
  )
}
