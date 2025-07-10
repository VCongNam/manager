import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

async function getDailyReports() {
  const [purchasesResult, salesResult] = await Promise.all([
    supabase.from("purchases").select("*").order("purchase_date", { ascending: false }),
    supabase.from("sales").select("*, purchases(product_name)").order("sale_date", { ascending: false }),
  ])

  const purchases = purchasesResult.data || []
  const sales = salesResult.data || []

  // Group by date
  const dailyData: {
    [key: string]: {
      purchases: any[]
      sales: any[]
      purchaseCost: number
      salesRevenue: number
      paidRevenue: number
      unpaidRevenue: number
    }
  } = {}

  purchases.forEach((purchase) => {
    const date = purchase.purchase_date
    if (!dailyData[date]) {
      dailyData[date] = { purchases: [], sales: [], purchaseCost: 0, salesRevenue: 0, paidRevenue: 0, unpaidRevenue: 0 }
    }
    dailyData[date].purchases.push(purchase)
    dailyData[date].purchaseCost += purchase.total_cost
  })

  sales.forEach((sale) => {
    const date = sale.sale_date
    if (!dailyData[date]) {
      dailyData[date] = { purchases: [], sales: [], purchaseCost: 0, salesRevenue: 0, paidRevenue: 0, unpaidRevenue: 0 }
    }
    dailyData[date].sales.push(sale)
    dailyData[date].salesRevenue += sale.total_revenue

    if (sale.payment_status === "paid") {
      dailyData[date].paidRevenue += sale.total_revenue
    } else {
      dailyData[date].unpaidRevenue += sale.total_revenue
    }
  })

  const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  return { dailyData, sortedDates }
}

export default async function DailyReportPage() {
  const { dailyData, sortedDates } = await getDailyReports()

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Báo cáo theo ngày</h1>
          <p className="text-muted-foreground">Chi tiết hoạt động kinh doanh từng ngày</p>
        </div>
      </div>

      <div className="space-y-6">
        {sortedDates.map((date) => {
          const data = dailyData[date]
          const profit = data.salesRevenue - data.purchaseCost
          const profitMargin = data.salesRevenue > 0 ? (profit / data.salesRevenue) * 100 : 0

          return (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-lg">
                  📅{" "}
                  {new Date(date).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardTitle>
                <CardDescription>
                  {data.purchases.length} đơn nhập • {data.sales.length} đơn bán
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <TrendingDown className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600">Chi phí nhập</p>
                      <p className="text-lg font-bold text-red-800">{data.purchaseCost.toLocaleString("vi-VN")}đ</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Doanh thu</p>
                      <p className="text-lg font-bold text-green-800">{data.salesRevenue.toLocaleString("vi-VN")}đ</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Lợi nhuận</p>
                      <p className="text-lg font-bold text-blue-800">{profit.toLocaleString("vi-VN")}đ</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600">Margin</p>
                      <p className="text-lg font-bold text-purple-800">{profitMargin.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {data.purchases.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-800">📦 Nhập hàng ({data.purchases.length})</h4>
                      <div className="space-y-2">
                        {data.purchases.map((purchase) => (
                          <div
                            key={purchase.id}
                            className="flex justify-between items-center p-2 bg-red-50 rounded text-sm"
                          >
                            <span>{purchase.product_name}</span>
                            <span className="font-medium text-red-800">
                              {purchase.total_cost.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.sales.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-green-800">🛒 Bán hàng ({data.sales.length})</h4>
                      <div className="space-y-2">
                        {data.sales.map((sale) => (
                          <div
                            key={sale.id}
                            className="flex justify-between items-center p-2 bg-green-50 rounded text-sm"
                          >
                            <span>{sale.purchases?.product_name || "N/A"}</span>
                            <div className="text-right">
                              <span className="font-medium text-green-800">
                                {sale.total_revenue.toLocaleString("vi-VN")}đ
                              </span>
                              <div className="text-xs">
                                {sale.payment_status === "paid"
                                  ? "✅"
                                  : sale.payment_status === "partial"
                                    ? "⏳"
                                    : "❌"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {data.unpaidRevenue > 0 && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                          <span className="text-yellow-800">
                            💰 Chưa thu: {data.unpaidRevenue.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {sortedDates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Chưa có dữ liệu</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
