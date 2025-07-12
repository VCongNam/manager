"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, Calendar, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { Skeleton } from "@/components/ui/skeleton"

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Đã thanh toán</Badge>
    case "unpaid":
      return <Badge variant="destructive">❌ Chưa thanh toán</Badge>
    case "partial":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⏳ Thanh toán một phần</Badge>
    default:
      return <Badge variant="secondary">Không xác định</Badge>
  }
}

export default function SalesByDatePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    partialAmount: 0,
    totalOrders: 0,
    uniqueCustomers: 0,
    avgOrderValue: 0
  })

  // Fetch available dates for calendar highlighting
  useEffect(() => {
    const fetchAvailableDates = async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("sale_date")
        .order("sale_date", { ascending: false })
      
      if (!error && data) {
        const dates = [...new Set(data.map(s => s.sale_date))]
        setAvailableDates(dates)
      }
    }
    fetchAvailableDates()
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    const fetchSales = async () => {
      setLoading(true)
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      const { data, error } = await supabase
        .from("sales")
        .select(`*, purchases ( product_name, unit )`)
        .eq("sale_date", dateStr)
        .order("created_at", { ascending: false })
      
      if (error) {
        console.error('Error fetching sales:', error)
      }
      
      setSales(data || [])
      
      // Calculate stats
      if (data) {
        const totalRevenue = data.reduce((sum, sale) => sum + sale.total_revenue, 0)
        const paidAmount = data.filter(sale => sale.payment_status === "paid").reduce((sum, sale) => sum + sale.total_revenue, 0)
        const unpaidAmount = data.filter(sale => sale.payment_status === "unpaid").reduce((sum, sale) => sum + sale.total_revenue, 0)
        const partialAmount = data.filter(sale => sale.payment_status === "partial").reduce((sum, sale) => sum + sale.total_revenue, 0)
        const uniqueCustomers = new Set(data.filter(sale => sale.customer_name).map(sale => sale.customer_name)).size
        
        setStats({
          totalRevenue,
          paidAmount,
          unpaidAmount,
          partialAmount,
          totalOrders: data.length,
          uniqueCustomers,
          avgOrderValue: data.length > 0 ? Math.round(totalRevenue / data.length) : 0
        })
      }
      
      setLoading(false)
    }
    fetchSales()
  }, [selectedDate])

  const getPreviousDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    setSelectedDate(prev)
  }

  const getNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    setSelectedDate(next)
  }

  const getThisWeek = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    setSelectedDate(startOfWeek)
  }

  const isDateWithData = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return availableDates.includes(dateStr)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Quản lý bán hàng theo ngày</h1>
          <p className="text-muted-foreground">
            Ngày: {selectedDate.toLocaleDateString("vi-VN")}
          </p>
        </div>
        <Link href="/sales/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Thêm đơn bán hàng
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột lịch */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Chọn ngày
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedDate(new Date())}
                    size="sm"
                  >
                    Hôm nay
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={getThisWeek}
                    size="sm"
                  >
                    Tuần này
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={getPreviousDay}>
                    ← Hôm qua
                  </Button>
                  <Button variant="ghost" size="sm" onClick={getNextDay}>
                    Ngày mai →
                  </Button>
                </div>

                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  required
                  modifiers={{
                    hasData: isDateWithData
                  }}
                  modifiersStyles={{
                    hasData: { 
                      backgroundColor: '#10b981', 
                      color: 'white',
                      fontWeight: 'bold'
                    }
                  }}
                />
                
                <div className="text-xs text-muted-foreground text-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full inline-block mr-1"></div>
                  Có dữ liệu bán hàng
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cột danh sách đơn hàng */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thống kê tổng quan */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Doanh thu</p>
                    <p className="text-lg font-bold">
                      {loading ? <Skeleton className="h-6 w-20" /> : `${stats.totalRevenue.toLocaleString("vi-VN")}đ`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Đã thu</p>
                    <p className="text-lg font-bold text-green-600">
                      {loading ? <Skeleton className="h-6 w-20" /> : `${stats.paidAmount.toLocaleString("vi-VN")}đ`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Chưa thu</p>
                    <p className="text-lg font-bold text-red-600">
                      {loading ? <Skeleton className="h-6 w-20" /> : `${stats.unpaidAmount.toLocaleString("vi-VN")}đ`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Đơn hàng</p>
                    <p className="text-lg font-bold">
                      {loading ? <Skeleton className="h-6 w-8" /> : stats.totalOrders}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Danh sách đơn hàng */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    📅 {selectedDate.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </CardTitle>
                  <CardDescription>
                    {stats.totalOrders} đơn hàng - Trung bình: {stats.avgOrderValue.toLocaleString("vi-VN")}đ/đơn
                  </CardDescription>
                </div>
                <div className="text-right text-sm space-y-1">
                  <div className="text-green-600">Đã thu: {stats.paidAmount.toLocaleString("vi-VN")}đ</div>
                  {stats.unpaidAmount > 0 && (
                    <div className="text-red-600">Chưa thu: {stats.unpaidAmount.toLocaleString("vi-VN")}đ</div>
                  )}
                  {stats.partialAmount > 0 && (
                    <div className="text-yellow-600">Thanh toán một phần: {stats.partialAmount.toLocaleString("vi-VN")}đ</div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : sales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Không có đơn hàng nào cho ngày này</p>
                  <Link href="/sales/new">
                    <Button className="mt-4">Tạo đơn hàng đầu tiên</Button>
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Trạng thái TT</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.purchases?.product_name || "N/A"}</TableCell>
                        <TableCell>{sale.customer_name || "-"}</TableCell>
                        <TableCell>
                          {sale.quantity} {sale.purchases?.unit || ""}
                        </TableCell>
                        <TableCell className="font-medium">{sale.total_revenue.toLocaleString("vi-VN")}đ</TableCell>
                        <TableCell>{getPaymentStatusBadge(sale.payment_status)}</TableCell>
                        <TableCell className="max-w-xs truncate">{sale.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 