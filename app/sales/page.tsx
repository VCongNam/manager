import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Sale } from "@/lib/supabase"

async function getSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      purchases (
        product_name,
        unit
      )
    `)
    .order("sale_date", { ascending: false })

  if (error) {
    console.error("Error fetching sales:", error)
    return []
  }

  return data || []
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

export default async function SalesPage() {
  const sales = await getSales()

  // Group sales by date
  const salesByDate = sales.reduce((acc: { [key: string]: Sale[] }, sale) => {
    const date = sale.sale_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(sale)
    return acc
  }, {})

  const sortedDates = Object.keys(salesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

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
            Tổng cộng {sales.length} đơn hàng - Tổng doanh thu:{" "}
            {sales.reduce((sum, sale) => sum + sale.total_revenue, 0).toLocaleString("vi-VN")}đ
          </p>
        </div>
        <Link href="/sales/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Thêm đơn bán hàng
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {sortedDates.map((date) => {
          const dailySales = salesByDate[date]
          const dailyRevenue = dailySales.reduce((sum, sale) => sum + sale.total_revenue, 0)
          const paidAmount = dailySales
            .filter((sale) => sale.payment_status === "paid")
            .reduce((sum, sale) => sum + sale.total_revenue, 0)
          const unpaidAmount = dailySales
            .filter((sale) => sale.payment_status === "unpaid")
            .reduce((sum, sale) => sum + sale.total_revenue, 0)

          return (
            <Card key={date}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
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
                      {dailySales.length} đơn hàng - Doanh thu: {dailyRevenue.toLocaleString("vi-VN")}đ
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-green-600">Đã thu: {paidAmount.toLocaleString("vi-VN")}đ</div>
                    {unpaidAmount > 0 && (
                      <div className="text-red-600">Chưa thu: {unpaidAmount.toLocaleString("vi-VN")}đ</div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Trạng thái TT</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.purchases?.product_name || "N/A"}</TableCell>
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
              </CardContent>
            </Card>
          )
        })}
      </div>

      {sortedDates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Chưa có đơn hàng nào</p>
            <Link href="/sales/new">
              <Button className="mt-4">Tạo đơn hàng đầu tiên</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
