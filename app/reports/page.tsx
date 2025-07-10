import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

async function getReportData() {
  const [purchasesResult, salesResult] = await Promise.all([
    supabase.from("purchases").select("*"),
    supabase.from("sales").select("*, purchases(product_name, unit)"),
  ])

  const purchases = purchasesResult.data || []
  const sales = salesResult.data || []

  // Calculate totals
  const totalPurchaseCost = purchases.reduce((sum, p) => sum + p.total_cost, 0)
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total_revenue, 0)
  const totalProfit = totalSalesRevenue - totalPurchaseCost

  // Top selling products
  const productSales = sales.reduce((acc: any, sale) => {
    const productName = sale.purchases?.product_name || "Unknown"
    if (!acc[productName]) {
      acc[productName] = { quantity: 0, revenue: 0 }
    }
    acc[productName].quantity += sale.quantity
    acc[productName].revenue += sale.total_revenue
    return acc
  }, {})

  const topProducts = Object.entries(productSales)
    .map(([name, data]: [string, any]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Recent transactions
  const recentSales = sales
    .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
    .slice(0, 5)

  return {
    totalPurchaseCost,
    totalSalesRevenue,
    totalProfit,
    profitMargin: totalSalesRevenue > 0 ? (totalProfit / totalSalesRevenue) * 100 : 0,
    topProducts,
    recentSales,
    totalProducts: purchases.length,
    totalSales: sales.length,
  }
}

export default async function ReportsPage() {
  const data = await getReportData()

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Báo cáo kinh doanh</h1>
          <p className="text-muted-foreground">Tổng quan tình hình kinh doanh</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi phí</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.totalPurchaseCost.toLocaleString("vi-VN")}đ</div>
            <p className="text-xs text-muted-foreground">{data.totalProducts} sản phẩm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.totalSalesRevenue.toLocaleString("vi-VN")}đ</div>
            <p className="text-xs text-muted-foreground">{data.totalSales} đơn hàng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lợi nhuận</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.totalProfit.toLocaleString("vi-VN")}đ</div>
            <p className="text-xs text-muted-foreground">{data.profitMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.totalPurchaseCost > 0 ? ((data.totalProfit / data.totalPurchaseCost) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Return on Investment</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 sản phẩm bán chạy</CardTitle>
            <CardDescription>Theo doanh thu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Đã bán: {product.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{product.revenue.toLocaleString("vi-VN")}đ</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Giao dịch gần đây</CardTitle>
            <CardDescription>5 đơn hàng mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{sale.purchases?.product_name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.sale_date).toLocaleDateString("vi-VN")} -{sale.quantity}{" "}
                      {sale.purchases?.unit || ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">+{sale.total_revenue.toLocaleString("vi-VN")}đ</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
