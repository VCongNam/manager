import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, ShoppingCart, TrendingUp, DollarSign, Calendar, Edit } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { AddPurchaseModal } from "@/components/add-purchase-modal"
import { AddSaleModal } from "@/components/add-sale-modal"
import { EditSaleModal } from "@/components/edit-sale-modal"
import { QuickPaymentToggle } from "@/components/quick-payment-toggle"
import type { Sale } from "@/lib/supabase"

async function getDashboardData() {
  const today = new Date().toISOString().split("T")[0]

  const [purchasesResult, salesResult, todayPurchasesResult, todaySalesResult, recentSalesResult] = await Promise.all([
    supabase.from("purchases").select("*"),
    supabase.from("sales").select("*"),
    supabase.from("purchases").select("*").eq("purchase_date", today),
    supabase.from("sales").select("*").eq("sale_date", today),
    supabase
      .from("sales")
      .select(`
      *,
      purchases (
        product_name,
        unit
      ),
      expenses (
        id,
        expense_type,
        description,
        amount
      )
    `)
      .order("sale_date", { ascending: false })
      .limit(15),
  ])

  const purchases = purchasesResult.data || []
  const sales = salesResult.data || []
  const todayPurchases = todayPurchasesResult.data || []
  const todaySales = todaySalesResult.data || []
  const recentSales = recentSalesResult.data || []

  // Tính toán doanh thu thực (bao gồm phí ship và chi phí khác)
  const calculateActualRevenue = (sale: any) => {
    const expensesTotal = (sale.expenses || []).reduce((sum: number, exp: any) => sum + exp.amount, 0)
    return sale.total_revenue + (sale.shipping_fee || 0) + expensesTotal
  }

  const totalPurchaseCost = purchases.reduce((sum, p) => sum + p.total_cost, 0)
  const totalActualRevenue = sales.reduce((sum, s) => sum + calculateActualRevenue(s), 0)
  const todayPurchaseCost = todayPurchases.reduce((sum, p) => sum + p.total_cost, 0)
  const todayActualRevenue = todaySales.reduce((sum, s) => sum + calculateActualRevenue(s), 0)

  // Group recent sales by date
  const salesByDate = recentSales.reduce((acc: { [key: string]: Sale[] }, sale) => {
    const date = sale.sale_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(sale)
    return acc
  }, {})

  const sortedDates = Object.keys(salesByDate)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 5)

  return {
    totalPurchaseCost,
    totalActualRevenue,
    totalProducts: purchases.length,
    totalSales: sales.length,
    profit: totalActualRevenue - totalPurchaseCost,
    todayPurchaseCost,
    todayActualRevenue,
    todayPurchases: todayPurchases.length,
    todaySales: todaySales.length,
    todayProfit: todayActualRevenue - todayPurchaseCost,
    salesByDate,
    sortedDates,
    calculateActualRevenue,
  }
}

export default async function Dashboard() {
  const data = await getDashboardData()

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quản lý kho hàng</h1>
        <p className="text-muted-foreground">
          Tổng quan hoạt động kinh doanh - {new Date().toLocaleDateString("vi-VN")}
        </p>
      </div>

      {/* Thống kê hôm nay */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Hoạt động hôm nay
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Nhập hàng hôm nay</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">{data.todayPurchaseCost.toLocaleString("vi-VN")}đ</div>
              <p className="text-xs text-blue-600">{data.todayPurchases} đơn nhập</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Doanh thu thực hôm nay</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">
                {data.todayActualRevenue.toLocaleString("vi-VN")}đ
              </div>
              <p className="text-xs text-green-600">{data.todaySales} đơn bán</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Lợi nhuận hôm nay</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">{data.todayProfit.toLocaleString("vi-VN")}đ</div>
              <p className="text-xs text-purple-600">
                {data.todayActualRevenue > 0 ? ((data.todayProfit / data.todayActualRevenue) * 100).toFixed(1) : 0}%
                margin
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Tổng giao dịch</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-800">{data.todayPurchases + data.todaySales}</div>
              <p className="text-xs text-orange-600">giao dịch hôm nay</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Thống kê tổng */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tổng quan tất cả</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng chi phí nhập</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalPurchaseCost.toLocaleString("vi-VN")}đ</div>
              <p className="text-xs text-muted-foreground">{data.totalProducts} đơn nhập</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu thực</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalActualRevenue.toLocaleString("vi-VN")}đ</div>
              <p className="text-xs text-muted-foreground">{data.totalSales} đơn bán</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng lợi nhuận</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.profit.toLocaleString("vi-VN")}đ</div>
              <p className="text-xs text-muted-foreground">
                {data.totalActualRevenue > 0 ? ((data.profit / data.totalActualRevenue) * 100).toFixed(1) : 0}% margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.totalPurchaseCost > 0 ? ((data.profit / data.totalPurchaseCost) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Return on Investment</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Thêm đơn hàng mới</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddPurchaseModal />
            <AddSaleModal />
            <div className="pt-2 space-y-2">
              <Link href="/purchases">
                <Button variant="outline" className="w-full bg-transparent">
                  Xem tất cả nhập hàng
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" className="w-full bg-transparent">
                  Xem báo cáo chi tiết
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales by Date */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bán hàng gần đây theo ngày</CardTitle>
            <CardDescription>5 ngày gần nhất có giao dịch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.sortedDates.map((date) => {
                const dailySales = data.salesByDate[date]
                const dailyActualRevenue = dailySales.reduce((sum, sale) => sum + data.calculateActualRevenue(sale), 0)
                const paidAmount = dailySales
                  .filter((sale) => sale.payment_status === "paid")
                  .reduce((sum, sale) => sum + data.calculateActualRevenue(sale), 0)

                return (
                  <div key={date} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="font-medium">
                          📅{" "}
                          {new Date(date).toLocaleDateString("vi-VN", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {dailySales.length} đơn • {dailyActualRevenue.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-green-600">Đã thu: {paidAmount.toLocaleString("vi-VN")}đ</div>
                        {paidAmount < dailyActualRevenue && (
                          <div className="text-red-600">
                            Chưa thu: {(dailyActualRevenue - paidAmount).toLocaleString("vi-VN")}đ
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {dailySales.map((sale) => {
                        const actualRevenue = data.calculateActualRevenue(sale)
                        const hasExtras = (sale.shipping_fee || 0) !== 0 || (sale.expenses || []).length > 0

                        return (
                          <div
                            key={sale.id}
                            className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded"
                          >
                            <div className="flex-1">
                              <span className="font-medium">{sale.purchases?.product_name || "N/A"}</span>
                              {hasExtras && <span className="ml-2 text-xs text-blue-600">(có phí/chi phí)</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div>{actualRevenue.toLocaleString("vi-VN")}đ</div>
                                {actualRevenue !== sale.total_revenue && (
                                  <div className="text-xs text-muted-foreground">
                                    (gốc: {sale.total_revenue.toLocaleString("vi-VN")}đ)
                                  </div>
                                )}
                              </div>
                              <QuickPaymentToggle sale={sale} />
                              <EditSaleModal sale={sale}>
                                <Button variant="ghost" size="sm" className="p-1">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </EditSaleModal>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {data.sortedDates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Chưa có đơn hàng nào</p>
              </div>
            )}

            <div className="pt-4">
              <Link href="/sales">
                <Button variant="outline" className="w-full bg-transparent">
                  Xem tất cả bán hàng theo ngày
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
