import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import type { Purchase } from "@/lib/supabase"

async function getPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase.from("purchases").select("*").order("purchase_date", { ascending: false })

  if (error) {
    console.error("Error fetching purchases:", error)
    return []
  }

  return data || []
}

export default async function PurchasesPage() {
  const purchases = await getPurchases()

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Quản lý nhập hàng</h1>
          <p className="text-muted-foreground">Danh sách các đơn nhập hàng</p>
        </div>
        <Link href="/purchases/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Thêm đơn nhập hàng
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhập hàng</CardTitle>
          <CardDescription>Tổng cộng {purchases.length} đơn nhập hàng</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Số lượng nhập</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Tổng chi phí</TableHead>
                <TableHead>Còn lại</TableHead>
                <TableHead>Ngày nhập</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">{purchase.product_name}</TableCell>
                  <TableCell>{purchase.quantity}</TableCell>
                  <TableCell>{purchase.unit}</TableCell>
                  <TableCell>{purchase.total_cost.toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>{purchase.remaining_quantity}</TableCell>
                  <TableCell>{new Date(purchase.purchase_date).toLocaleDateString("vi-VN")}</TableCell>
                  <TableCell>
                    <Badge variant={purchase.remaining_quantity > 0 ? "default" : "secondary"}>
                      {purchase.remaining_quantity > 0 ? "Còn hàng" : "Hết hàng"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
