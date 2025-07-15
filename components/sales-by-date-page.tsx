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
import { getOrdersByDate } from "@/lib/actions"

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

function getOrderTypeBadge(isNewOrder: boolean) {
  if (isNewOrder) {
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">🆕 Đơn mới</Badge>
  } else {
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">📋 Đơn cũ</Badge>
  }
}

export default function SalesByDatePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [orders, setOrders] = useState<any[]>([])
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
      // Lấy dates từ cả sales và orders
      const [salesResult, ordersResult] = await Promise.all([
        supabase.from("sales").select("sale_date").order("sale_date", { ascending: false }),
        supabase.from("orders").select("sale_date").order("sale_date", { ascending: false })
      ])
      
      if (!salesResult.error && !ordersResult.error) {
        const salesDates = salesResult.data?.map(s => s.sale_date) || []
        const ordersDates = ordersResult.data?.map(o => o.sale_date) || []
        const allDates = [...new Set([...salesDates, ...ordersDates])]
        setAvailableDates(allDates)
      }
    }
    fetchAvailableDates()
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    const fetchOrders = async () => {
      setLoading(true)
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      const result = await getOrdersByDate(dateStr)
      
      if (result.success) {
        setOrders(result.data || [])
        
        // Calculate stats
        const totalRevenue = result.data.reduce((sum, order) => {
          if (order.is_new_order) {
            return sum + order.total_revenue + (order.shipping_fee || 0)
          } else {
            const expensesTotal = (order.expenses || []).reduce((sum: number, exp: any) => sum + exp.amount, 0)
            return sum + order.total_revenue + (order.shipping_fee || 0) + expensesTotal
          }
        }, 0)
        
        const paidAmount = result.data.filter(order => order.payment_status === "paid").reduce((sum, order) => {
          if (order.is_new_order) {
            return sum + order.total_revenue + (order.shipping_fee || 0)
          } else {
            const expensesTotal = (order.expenses || []).reduce((sum: number, exp: any) => sum + exp.amount, 0)
            return sum + order.total_revenue + (order.shipping_fee || 0) + expensesTotal
          }
        }, 0)
        
        const unpaidAmount = result.data.filter(order => order.payment_status === "unpaid").reduce((sum, order) => {
          if (order.is_new_order) {
            return sum + order.total_revenue + (order.shipping_fee || 0)
          } else {
            const expensesTotal = (order.expenses || []).reduce((sum: number, exp: any) => sum + exp.amount, 0)
            return sum + order.total_revenue + (order.shipping_fee || 0) + expensesTotal
          }
        }, 0)
        
        const partialAmount = result.data.filter(order => order.payment_status === "partial").reduce((sum, order) => {
          if (order.is_new_order) {
            return sum + order.total_revenue + (order.shipping_fee || 0)
          } else {
            const expensesTotal = (order.expenses || []).reduce((sum: number, exp: any) => sum + exp.amount, 0)
            return sum + order.total_revenue + (order.shipping_fee || 0) + expensesTotal
          }
        }, 0)
        
        const uniqueCustomers = new Set(result.data.filter(order => order.customer_name).map(order => order.customer_name)).size
        
        setStats({
          totalRevenue,
          paidAmount,
          unpaidAmount,
          partialAmount,
          totalOrders: result.data.length,
          uniqueCustomers,
          avgOrderValue: result.data.length > 0 ? Math.round(totalRevenue / result.data.length) : 0
        })
      }
      
      setLoading(false)
    }
    fetchOrders()
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cột thống kê và danh sách */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thống kê */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString("vi-VN")}đ</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalOrders} đơn hàng
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.paidAmount.toLocaleString("vi-VN")}đ</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalOrders > 0 ? Math.round((stats.paidAmount / stats.totalRevenue) * 100) : 0}% tổng
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chưa thanh toán</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.unpaidAmount.toLocaleString("vi-VN")}đ</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalOrders > 0 ? Math.round((stats.unpaidAmount / stats.totalRevenue) * 100) : 0}% tổng
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  Trung bình: {stats.avgOrderValue.toLocaleString("vi-VN")}đ/đơn
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Danh sách đơn hàng */}
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng ngày {selectedDate.toLocaleDateString("vi-VN")}</CardTitle>
              <CardDescription>
                {loading ? "Đang tải..." : `${stats.totalOrders} đơn hàng (bao gồm đơn hàng cũ và mới)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const actualRevenue = order.is_new_order 
                      ? order.total_revenue + (order.shipping_fee || 0)
                      : order.total_revenue + (order.shipping_fee || 0) + (order.expenses || []).reduce((sum: number, exp: any) => sum + exp.amount, 0)
                    
                    const hasExtras = (order.shipping_fee || 0) !== 0 || (order.expenses || []).length > 0

                    return (
                      <div
                        key={order.id}
                        className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getOrderTypeBadge(order.is_new_order)}
                            <span className="font-medium">
                              {order.is_new_order ? (
                                <div>
                                  <div>{order.purchases?.product_name || "N/A"}</div>
                                  {order.total_items > 1 && (
                                    <div className="text-xs text-blue-600">
                                      +{order.total_items - 1} sản phẩm khác
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  {order.purchases?.product_name || "N/A"}
                                  {hasExtras && <span className="ml-2 text-xs text-blue-600">(có phí/chi phí)</span>}
                                </div>
                              )}
                            </span>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {order.customer_name && <span>Khách: {order.customer_name} • </span>}
                            <span>
                              {order.is_new_order ? (
                                <div>
                                  <div>{order.order_items[0]?.quantity} {order.order_items[0]?.purchases?.unit || ""}</div>
                                  {order.total_items > 1 && (
                                    <div className="text-xs">
                                      Tổng: {order.order_items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  {order.quantity} {order.purchases?.unit || ""}
                                </div>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-medium">
                            {actualRevenue.toLocaleString("vi-VN")}đ
                          </div>
                          {actualRevenue !== order.total_revenue && (
                            <div className="text-xs text-muted-foreground">
                              (gốc: {order.total_revenue.toLocaleString("vi-VN")}đ)
                            </div>
                          )}
                          {(order.amount_remaining || 0) > 0 && (
                            <div className="text-xs text-red-600">
                              Còn: {(order.amount_remaining || 0).toLocaleString("vi-VN")}đ
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {orders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Không có đơn hàng nào trong ngày này</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 