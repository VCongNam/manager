# Quản lý kho hàng (Inventory Management System)

Hệ thống quản lý kho hàng hiện đại được xây dựng với Next.js 15, Supabase và Tailwind CSS. Ứng dụng hỗ trợ quản lý toàn diện hoạt động kinh doanh cho doanh nghiệp nhỏ.

## 🚀 Tính năng chính

### 📊 Dashboard tổng quan
- Thống kê hoạt động hôm nay (nhập hàng, bán hàng, lợi nhuận)
- Tổng quan doanh thu và chi phí
- Biểu đồ theo dõi xu hướng kinh doanh
- Lịch sử giao dịch gần đây

### 🛒 Quản lý kho hàng
- **Nhập hàng**: Ghi nhận hàng hóa mới với thông tin chi tiết
- **Bán hàng**: Xử lý đơn hàng và tính toán doanh thu
- **Tồn kho**: Theo dõi số lượng hàng còn lại
- **Lịch sử**: Xem lại tất cả giao dịch

### 💰 Quản lý tài chính
- Tính toán lợi nhuận thực tế
- Quản lý chi phí hàng ngày
- Theo dõi thanh toán (đã trả, chưa trả, trả một phần)
- Phí vận chuyển và chi phí phát sinh

### 📈 Báo cáo và phân tích
- Báo cáo doanh thu theo ngày
- Phân tích lợi nhuận
- Thống kê sản phẩm bán chạy
- Xuất báo cáo chi tiết

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: Radix UI, Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## 📋 Yêu cầu hệ thống

- Node.js 18+ 
- npm
- Tài khoản Supabase

## ⚡ Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd manager
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
Tạo file `.env.local` và thêm các biến môi trường:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Thiết lập database
Chạy các script SQL trong thư mục `scripts/` theo thứ tự:
```bash
# 1. Tạo bảng cơ bản
psql -d your_database -f scripts/create-tables.sql

# 2. Cập nhật schema
psql -d your_database -f scripts/update-schema-complete.sql

# 3. Thêm dữ liệu mẫu (tùy chọn)
psql -d your_database -f scripts/seed-data.sql

# 4. Thiết lập policies bảo mật
psql -d your_database -f scripts/add-secure-policies.sql
```

### 5. Chạy ứng dụng
```bash
npm run dev
```

Truy cập ứng dụng tại: http://localhost:3000

## 📁 Cấu trúc dự án

```
manager/
├── app/                    # Next.js App Router
│   ├── daily-report/      # Báo cáo hàng ngày
│   ├── history/          # Lịch sử giao dịch
│   ├── inventory/        # Quản lý kho hàng
│   ├── purchases/        # Quản lý nhập hàng
│   ├── sales/           # Quản lý bán hàng
│   └── reports/         # Báo cáo tổng hợp
├── components/           # React components
│   ├── ui/              # UI components (shadcn/ui)
│   └── *.tsx           # Custom components
├── lib/                 # Utilities và configurations
├── scripts/             # SQL scripts cho database
└── public/              # Static assets
```

## 🗄️ Cấu trúc Database

### Bảng chính:
- **purchases**: Thông tin nhập hàng
- **sales**: Thông tin bán hàng  
- **daily_expenses**: Chi phí hàng ngày
- **expenses**: Chi phí phát sinh

### Quan hệ:
- Sales liên kết với Purchases qua `purchase_id`
- Expenses liên kết với Sales qua `sale_id`

## 🎯 Cách sử dụng

### Quản lý nhập hàng
1. Vào trang **Nhập hàng** 
2. Nhấn **Thêm nhập hàng**
3. Điền thông tin sản phẩm, số lượng, giá
4. Lưu thông tin

### Quản lý bán hàng
1. Vào trang **Bán hàng**
2. Chọn sản phẩm từ kho
3. Nhập số lượng và giá bán
4. Thêm thông tin khách hàng
5. Xác nhận đơn hàng

### Xem báo cáo
- **Dashboard**: Tổng quan hoạt động
- **Báo cáo hàng ngày**: Chi tiết theo ngày
- **Lịch sử**: Xem lại tất cả giao dịch

## 🔧 Scripts có sẵn

```bash
npm run dev       # Chạy development server
npm run build     # Build production
npm run start     # Chạy production server
npm run lint      # Kiểm tra code style
```

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Dự án này được phát hành dưới MIT License.

## 📞 Hỗ trợ

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên GitHub repository.

---

**Lưu ý**: Đây là ứng dụng quản lý kho hàng bằng tiếng Việt, được thiết kế đặc biệt cho thị trường Việt Nam với các tính năng phù hợp với cách làm việc của doanh nghiệp nhỏ.