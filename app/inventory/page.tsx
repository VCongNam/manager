import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Purchase } from "@/lib/supabase"

async function getInventory(): Promise<Purchase[]> {
  const { data, error } = await supabase.from("purchases").select("*").order("product_name")

  if (error) {
    console.error("Error fetching inventory:", error)
    return []
  }

  return data || []
}

export default async function InventoryPage() {
  const inventory = await getInventory()
  const lowStockItems = inventory.filter((item) => item.remaining_quantity <= 5)

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Quản lý tồn kho</h1>
          <p className="text-muted-foreground">Theo dõi số lượng hàng tồn kho</p>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Cảnh báo hàng sắp hết
            </CardTitle>
            <CardDescription className="text-orange-700">
              {lowStockItems.length} sản phẩm có số lượng tồn kho thấp (≤ 5)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <span className="font-medium">{item.product_name}</span>
                  <Badge variant="destructive">
                    Còn {item.remaining_quantity} {item.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tồn kho</CardTitle>
          <CardDescription>Tổng cộng {inventory.length} sản phẩm trong kho</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Số lượng nhập</TableHead>
                <TableHead>Số lượng còn lại</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Giá nhập/đơn vị</TableHead>
                <TableHead>Ngày nhập gần nhất</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const unitCost = item.total_cost / item.quantity
                const stockStatus =
                  item.remaining_quantity === 0 ? "out" : item.remaining_quantity <= 5 ? "low" : "good"

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="font-medium">{item.remaining_quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{unitCost.toLocaleString("vi-VN")}đ</TableCell>
                    <TableCell>{new Date(item.purchase_date).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          stockStatus === "out" ? "destructive" : stockStatus === "low" ? "secondary" : "default"
                        }
                      >
                        {stockStatus === "out" ? "Hết hàng" : stockStatus === "low" ? "Sắp hết" : "Còn hàng"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
