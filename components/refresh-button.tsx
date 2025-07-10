"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function RefreshButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleRefresh = async () => {
    setLoading(true)
    try {
      // Force refresh page
      router.refresh()

      toast({
        title: "🔄 Đã làm mới",
        description: "Dữ liệu đã được cập nhật",
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: "Không thể làm mới dữ liệu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="gap-2 bg-transparent">
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Đang làm mới..." : "Làm mới"}
    </Button>
  )
}
