"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, Calendar, TrendingUp, TrendingDown, DollarSign, Users, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"
import { getOrdersByDate } from "@/lib/actions"

// Hàm chuẩn hóa ngày về local string YYYY-MM-DD
function getLocalDateString(date: Date) {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0')
}

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

// Custom Calendar Component
function CustomCalendar({ 
  selectedDate, 
  onDateSelect, 
  availableDates 
}: { 
  selectedDate: Date, 
  onDateSelect: (date: Date) => void, 
  availableDates: {[key: string]: number} 
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  
  const daysInWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }
  
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }
  
  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }
  
  const isDateWithData = (date: Date) => {
    const dateStr = getLocalDateString(date)
    return availableDates[dateStr] > 0
  }
  
  const getOrderCount = (date: Date) => {
    const dateStr = getLocalDateString(date)
    return availableDates[dateStr] || 0
  }
  
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    onDateSelect(today)
  }
  
  const days = getDaysInMonth(currentMonth)
  
  return (
    <div className="calendar-container">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-blue-600" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900">
          {currentMonth.toLocaleDateString('vi-VN', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-blue-600" />
        </button>
      </div>
      
      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysInWeek.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-10" />
          }
          
          const hasOrders = isDateWithData(date)
          const orderCount = getOrderCount(date)
          const isSelectedDate = isSelected(date)
          const isTodayDate = isToday(date)
          
          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={`
                relative h-10 w-10 rounded-full text-sm font-medium transition-all duration-200
                ${isSelectedDate 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : hasOrders 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : isTodayDate 
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                      : 'hover:bg-gray-100 text-gray-900'
                }
                ${isSelectedDate || hasOrders ? 'font-bold' : 'font-normal'}
              `}
            >
              {date.getDate()}
              {hasOrders && orderCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {orderCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SalesByDatePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [availableDates, setAvailableDates] = useState<{[key: string]: number}>({})
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
      try {
        // Lấy dates từ cả sales và orders với số lượng đơn hàng
        const [salesResult, ordersResult] = await Promise.all([
          supabase.from("sales").select("sale_date").order("sale_date", { ascending: false }),
          supabase.from("orders").select("sale_date").order("sale_date", { ascending: false })
        ])
        
        if (salesResult.error) {
          console.error("Error fetching sales dates:", salesResult.error)
        }
        
        if (ordersResult.error) {
          console.error("Error fetching orders dates:", ordersResult.error)
        }
        
        if (!salesResult.error && !ordersResult.error) {
          const salesDates = salesResult.data || []
          const ordersDates = ordersResult.data || []
          
          console.log("Sales dates:", salesDates)
          console.log("Orders dates:", ordersDates)
          
          // Đếm số lượng đơn hàng cho mỗi ngày
          const dateCounts: {[key: string]: number} = {}
          
          salesDates.forEach(sale => {
            if (sale.sale_date) {
              const date = new Date(sale.sale_date)
              const dateStr = getLocalDateString(date)
              dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1
            }
          })
          
          ordersDates.forEach(order => {
            if (order.sale_date) {
              const date = new Date(order.sale_date)
              const dateStr = getLocalDateString(date)
              dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1
            }
          })
          
          console.log("Final date counts:", dateCounts)
          setAvailableDates(dateCounts)
        }
      } catch (error) {
        console.error("Error in fetchAvailableDates:", error)
      }
    }
    fetchAvailableDates()
  }, [])

  // Debug: Check today's data on mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      checkTodayData()
    }
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

  const checkTodayData = async () => {
    const today = new Date().toISOString().split('T')[0]
    console.log("Checking data for today:", today)
    
    const [salesResult, ordersResult] = await Promise.all([
      supabase.from("sales").select("*").eq("sale_date", today),
      supabase.from("orders").select("*").eq("sale_date", today)
    ])
    
    console.log("Today sales:", salesResult.data)
    console.log("Today orders:", ordersResult.data)
    console.log("Sales error:", salesResult.error)
    console.log("Orders error:", ordersResult.error)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
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
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Calendar className="h-5 w-5 text-blue-600" />
                Chọn ngày
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Nút Hôm nay và Tuần này */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={isToday(selectedDate) ? "default" : "outline"}
                    onClick={() => setSelectedDate(new Date())}
                    size="sm"
                    className={isToday(selectedDate) ? "bg-blue-600 hover:bg-blue-700" : ""}
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
                
                {/* Nút điều hướng ngày */}
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={getPreviousDay} className="text-gray-600 hover:text-gray-800">
                    ← Hôm qua
                  </Button>
                  <Button variant="ghost" size="sm" onClick={getNextDay} className="text-gray-600 hover:text-gray-800">
                    Ngày mai →
                  </Button>
                </div>

                {/* Custom Calendar */}
                <CustomCalendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  availableDates={availableDates}
                />
                
                {/* Debug Info - chỉ hiển thị trong development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
                    <div className="font-semibold mb-2">Debug Info:</div>
                    <div>Selected Date: {
                      selectedDate.getFullYear() + '-' +
                      String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' +
                      String(selectedDate.getDate()).padStart(2, '0')
                    }</div>
                    <div>Available Dates: {Object.keys(availableDates).length}</div>
                    <div>Today Orders: {availableDates[getLocalDateString(new Date())] || 0}</div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs mr-2"
                    >
                      Refresh Data
                    </button>
                    <button 
                      onClick={checkTodayData}
                      className="mt-2 px-2 py-1 bg-green-500 text-white rounded text-xs"
                    >
                      Check Today Data
                    </button>
                  </div>
                )}
                
                {/* Chú thích */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Ngày có đơn hàng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Ngày được chọn</span>
                  </div>
                </div>
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