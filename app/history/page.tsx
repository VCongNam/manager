import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Package, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { EditSaleModal } from "@/components/edit-sale-modal"
import { EditPurchaseModal } from "@/components/edit-purchase-modal"
import { getAllOrders } from "@/lib/actions"

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const revalidate = 0

async function getHistoryData() {
  const [purchasesResult, ordersResult] = await Promise.all([
    supabase.from("purchases").select("*").order("purchase_date", { ascending: false }).limit(50),
    getAllOrders(),
  ])

  const purchases = purchasesResult.data || []
  const allOrders = ordersResult.data || []

  return { purchases, allOrders }
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

function getDeliveryMethodBadge(method: string) {
  switch (method) {
    case "delivery":
      return <Badge variant="outline">🚚 Giao hàng</Badge>
    case "pickup":
      return <Badge variant="outline">🏪 Tự lấy</Badge>
    default:
      return <Badge variant="secondary">-</Badge>
  }
}

function getOrderTypeBadge(isNewOrder: boolean) {
  if (isNewOrder) {
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">🆕 Đơn mới</Badge>
  } else {
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">📋 Đơn cũ</Badge>
  }
}

export default async function HistoryPage() {
  const { purchases, allOrders } = await getHistoryData()

  const calculateActualRevenue = (order: any) => {
    if (order.is_new_order) {
      // Đơn hàng mới: tổng từ order_items + shipping_fee
      return order.total_revenue + (order.shipping_fee || 0);
    } else {
      // Đơn hàng cũ: total_revenue + shipping_fee + expenses
      const expensesTotal = (order.expenses || []).reduce((sum: number, exp: any) => sum + exp.amount, 0)
      return order.total_revenue + (order.shipping_fee || 0) + expensesTotal
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Lịch sử giao dịch</h1>
          <p className="text-muted-foreground">Xem lại tất cả các giao dịch nhập hàng và bán hàng</p>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Lịch sử bán hàng ({allOrders.length})
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Lịch sử nhập hàng ({purchases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử bán hàng</CardTitle>
              <CardDescription>50 giao dịch bán hàng gần nhất (bao gồm đơn hàng cũ và mới)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày bán</TableHead>
                    <TableHead>Loại đơn</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Doanh thu thực</TableHead>
                    <TableHead>Đã trả/Còn lại</TableHead>
                    <TableHead>Giao hàng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOrders.slice(0, 50).map((order) => {
                    const actualRevenue = calculateActualRevenue(order)
                    const hasExtras = (order.shipping_fee || 0) !== 0 || (order.expenses || []).length > 0

                    return (
                      <TableRow key={order.id}>
                        <TableCell>{new Date(order.sale_date).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell>{getOrderTypeBadge(order.is_new_order)}</TableCell>
                        <TableCell className="font-medium">
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
                        </TableCell>
                        <TableCell>{order.customer_name || "-"}</TableCell>
                        <TableCell>
                          {order.is_new_order ? (
                            <div>
                              <div>{order.order_items[0]?.quantity} {order.order_items[0]?.purchases?.unit || ""}</div>
                              {order.total_items > 1 && (
                                <div className="text-xs text-gray-500">
                                  Tổng: {order.order_items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              {order.quantity} {order.purchases?.unit || ""}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {actualRevenue.toLocaleString("vi-VN")}đ
                          {actualRevenue !== order.total_revenue && (
                            <div className="text-xs text-muted-foreground">
                              (gốc: {order.total_revenue.toLocaleString("vi-VN")}đ)
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-green-600">
                              Đã trả: {(order.amount_paid || 0).toLocaleString("vi-VN")}đ
                            </div>
                            {(order.amount_remaining || 0) > 0 && (
                              <div className="text-red-600">
                                Còn lại: {(order.amount_remaining || 0).toLocaleString("vi-VN")}đ
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getDeliveryMethodBadge(order.delivery_method)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                        <TableCell>
                          <EditSaleModal order={order}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </EditSaleModal>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {allOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chưa có giao dịch bán hàng nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử nhập hàng</CardTitle>
              <CardDescription>50 giao dịch nhập hàng gần nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày nhập</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Nhà cung cấp</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Còn lại</TableHead>
                    <TableHead>Chi phí</TableHead>
                    <TableHead>Giá/đơn vị</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => {
                    const unitPrice = Math.round(purchase.total_cost / purchase.quantity)
                    const soldPercentage = Math.round(
                      ((purchase.quantity - purchase.remaining_quantity) / purchase.quantity) * 100
                    )

                    return (
                      <TableRow key={purchase.id}>
                        <TableCell>{new Date(purchase.purchase_date).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell className="font-medium">{purchase.product_name}</TableCell>
                        <TableCell>{purchase.supplier_name || "-"}</TableCell>
                        <TableCell>
                          {purchase.quantity} {purchase.unit}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{purchase.remaining_quantity} {purchase.unit}</div>
                            <div className="text-xs text-muted-foreground">
                              Đã bán: {purchase.quantity - purchase.remaining_quantity} {purchase.unit} ({soldPercentage}%)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {purchase.total_cost.toLocaleString("vi-VN")}đ
                        </TableCell>
                        <TableCell>
                          {unitPrice.toLocaleString("vi-VN")}đ/{purchase.unit}
                        </TableCell>
                        <TableCell>
                          {purchase.remaining_quantity > 0 ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Còn hàng
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Hết hàng</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <EditPurchaseModal purchase={purchase}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </EditPurchaseModal>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {purchases.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chưa có giao dịch nhập hàng nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
