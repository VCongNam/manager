import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Calendar,
  Edit,
  History,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { AddPurchaseModal } from "@/components/add-purchase-modal";
import { AddSaleModal } from "@/components/add-sale-modal";
import { EditSaleModal } from "@/components/edit-sale-modal";
import { QuickPaymentToggle } from "@/components/quick-payment-toggle";
import { RefreshButton } from "@/components/refresh-button";
import type { Sale } from "@/lib/supabase";
import { DailyExpenseModal } from "@/components/daily-expense-modal";
import { getAllOrders, getCombinedStats } from "@/lib/actions";

// Force dynamic rendering - không cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getDashboardData() {
  const today = new Date().toISOString().split("T")[0];

  const [
    purchasesResult,
    todayPurchasesResult,
    recentOrdersResult,
    dailyExpensesResult,
    todayExpensesResult,
    combinedStatsResult,
  ] = await Promise.all([
    supabase.from("purchases").select("*"),
    supabase.from("purchases").select("*").eq("purchase_date", today),
    getAllOrders(),
    supabase.from("daily_expenses").select("*"),
    supabase.from("daily_expenses").select("*").eq("expense_date", today),
    getCombinedStats(),
  ]);

  const purchases = purchasesResult.data || [];
  const todayPurchases = todayPurchasesResult.data || [];
  const recentOrders = recentOrdersResult.data || [];
  const dailyExpenses = dailyExpensesResult.data || [];
  const todayExpenses = todayExpensesResult.data || [];
  const combinedStats = combinedStatsResult;

  // Tính toán doanh thu thực (bao gồm phí ship và chi phí khác)
  const calculateActualRevenue = (order: any) => {
    if (order.is_new_order) {
      // Đơn hàng mới: tổng từ order_items + shipping_fee
      return order.total_revenue + (order.shipping_fee || 0);
    } else {
      // Đơn hàng cũ: total_revenue + shipping_fee + expenses
      const expensesTotal = (order.expenses || []).reduce(
        (sum: number, exp: any) => sum + exp.amount,
        0
      );
      return order.total_revenue + (order.shipping_fee || 0) + expensesTotal;
    }
  };

  const totalPurchaseCost = purchases.reduce((sum, p) => sum + p.total_cost, 0);
  const totalActualRevenue = recentOrders.reduce(
    (sum, order) => sum + calculateActualRevenue(order),
    0
  );
  const totalDailyExpenses = dailyExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const todayPurchaseCost = todayPurchases.reduce(
    (sum, p) => sum + p.total_cost,
    0
  );
  
  // Lọc đơn hàng hôm nay
  const todayOrders = recentOrders.filter(order => order.sale_date === today);
  const todayActualRevenue = todayOrders.reduce(
    (sum, order) => sum + calculateActualRevenue(order),
    0
  );
  
  const todayDailyExpenses = todayExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  // Group recent orders by date
  const ordersByDate = recentOrders.reduce(
    (acc: { [key: string]: any[] }, order) => {
      const date = order.sale_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(order);
      return acc;
    },
    {}
  );

  // Lấy 2 ngày gần nhất có đơn hàng
  const allOrderDates = Object.keys(ordersByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const sortedDates = allOrderDates.slice(0, 2);

  // Hàng còn lại trong kho
  const inventory = purchases.filter(p => p.remaining_quantity > 0).sort((a, b) => b.remaining_quantity - a.remaining_quantity);

  return {
    totalPurchaseCost,
    totalActualRevenue,
    totalDailyExpenses,
    totalProducts: purchases.length,
    totalSales: combinedStats.totalSales,
    totalOrders: combinedStats.totalOrders,
    profit: totalActualRevenue - totalPurchaseCost,
    realProfit: totalActualRevenue - totalPurchaseCost - totalDailyExpenses,
    todayPurchaseCost,
    todayActualRevenue,
    todayDailyExpenses,
    todayPurchases: todayPurchases.length,
    todaySales: combinedStats.todaySales,
    todayOrders: combinedStats.todayOrders,
    todayProfit: todayActualRevenue - todayPurchaseCost,
    todayRealProfit:
      todayActualRevenue - todayPurchaseCost - todayDailyExpenses,
    ordersByDate,
    sortedDates,
    calculateActualRevenue,
    recentOrders: recentOrders.slice(0, 15), // Lấy 15 đơn hàng gần nhất
    inventory,
  };
}

export default async function Dashboard() {
  const data = await getDashboardData();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý kho hàng</h1>
          <p className="text-muted-foreground">
            Tổng quan hoạt động kinh doanh -{" "}
            {new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/history">
            <Button variant="outline" className="gap-2 bg-transparent">
              <History className="h-4 w-4" />
              Lịch sử giao dịch
            </Button>
          </Link>
          <RefreshButton />
        </div>
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
              <CardTitle className="text-sm font-medium text-blue-800">
                Nhập hàng hôm nay
              </CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {data.todayPurchaseCost.toLocaleString("vi-VN")}đ
              </div>
              <p className="text-xs text-blue-600">
                {data.todayPurchases} đơn nhập
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Doanh thu thực hôm nay
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">
                {data.todayActualRevenue.toLocaleString("vi-VN")}đ
              </div>
              <p className="text-xs text-green-600">
                {data.todayOrders} đơn bán
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">
                Lợi nhuận hôm nay
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">
                {data.todayProfit.toLocaleString("vi-VN")}đ
              </div>
              <p className="text-xs text-purple-600">
                {data.todayActualRevenue > 0
                  ? (
                      (data.todayProfit / data.todayActualRevenue) *
                      100
                    ).toFixed(1)
                  : 0}
                % margin
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">
                Tổng giao dịch
              </CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-800">
                {data.todayPurchases + data.todayOrders}
              </div>
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
              <CardTitle className="text-sm font-medium">
                Tổng chi phí nhập
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.totalPurchaseCost.toLocaleString("vi-VN")}đ
              </div>
              <p className="text-xs text-muted-foreground">
                {data.totalProducts} đơn nhập
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng doanh thu thực
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.totalActualRevenue.toLocaleString("vi-VN")}đ
              </div>
              <p className="text-xs text-muted-foreground">
                {data.totalOrders} đơn bán
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng lợi nhuận
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.profit.toLocaleString("vi-VN")}đ
              </div>
              <p className="text-xs text-muted-foreground">
                {data.totalActualRevenue > 0
                  ? ((data.profit / data.totalActualRevenue) * 100).toFixed(1)
                  : 0}
                % margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng lợi nhuận thực
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.realProfit.toLocaleString("vi-VN")}đ
              </div>
              <p className="text-xs text-muted-foreground">
                {data.totalActualRevenue > 0
                  ? ((data.realProfit / data.totalActualRevenue) * 100).toFixed(
                      1
                    )
                  : 0}
                % margin
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Hàng còn lại trong kho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Sản phẩm</th>
                    <th className="text-right py-2 px-2">Còn lại</th>
                    <th className="text-right py-2 px-2">Đơn vị</th>
                    <th className="text-right py-2 px-2">Nhà cung cấp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted-foreground">
                        Không còn hàng tồn kho
                      </td>
                    </tr>
                  )}
                  {data.inventory.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{item.product_name}</td>
                      <td className="py-2 px-2 text-right">{item.remaining_quantity}</td>
                      <td className="py-2 px-2 text-right">{item.unit}</td>
                      <td className="py-2 px-2 text-right">{item.supplier_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Thêm đơn hàng mới</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddPurchaseModal />
            <AddSaleModal />
            <DailyExpenseModal />
            <div className="pt-2 space-y-2">
              <Link href="/purchases">
                <Button variant="outline" className="w-full bg-transparent">
                  Xem tất cả nhập hàng
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="outline" className="w-full bg-transparent">
                  Xem lịch sử giao dịch
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales by Date */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bán hàng gần đây theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.sortedDates.map((date) => {
                const dailyOrders = data.ordersByDate[date];
                const dailyActualRevenue = dailyOrders.reduce(
                  (sum, order) => sum + data.calculateActualRevenue(order),
                  0
                );
                const paidAmount = dailyOrders
                  .filter((order) => order.payment_status === "paid")
                  .reduce(
                    (sum, order) => sum + data.calculateActualRevenue(order),
                    0
                  );

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
                          {dailyOrders.length} đơn •{" "}
                          {dailyActualRevenue.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-green-600">
                          Đã thu: {paidAmount.toLocaleString("vi-VN")}đ
                        </div>
                        {paidAmount < dailyActualRevenue && (
                          <div className="text-red-600">
                            Chưa thu: {(
                              dailyActualRevenue - paidAmount
                            ).toLocaleString("vi-VN")}
                            đ
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {dailyOrders.map((order) => {
                        const actualRevenue = data.calculateActualRevenue(order);
                        const hasExtras =
                          (order.shipping_fee || 0) !== 0 ||
                          (order.expenses || []).length > 0;

                        return (
                          <div
                            key={order.id}
                            className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded"
                          >
                            <div className="flex-1">
                              {order.is_new_order ? (
                                <span className="font-medium">
                                  {order.order_items && order.order_items.length > 0
                                    ? order.order_items.map((item: any) => item.purchases?.product_name).filter(Boolean).join(", ")
                                    : "N/A"}
                                </span>
                              ) : (
                                <span className="font-medium">
                                  {order.purchases?.product_name || "N/A"}
                                </span>
                              )}
                              {order.customer_name && (
                                <span className="ml-2 text-xs text-blue-600">
                                  ({order.customer_name})
                                </span>
                              )}
                              {hasExtras && (
                                <span className="ml-2 text-xs text-blue-600">
                                  (có phí/chi phí)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div>
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
                              <QuickPaymentToggle order={order} />
                              <EditSaleModal order={order}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </EditSaleModal>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
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

        {/* Hàng còn lại trong kho */}
        
      </div>
    </div>
  );
}
