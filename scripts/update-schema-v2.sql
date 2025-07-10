-- Cập nhật bảng sales để thêm các trường mới
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'pickup'; -- 'pickup' hoặc 'delivery'
ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount_remaining INTEGER DEFAULT 0;

-- Cập nhật bảng purchases để thêm tên khách hàng
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS supplier_name TEXT;

-- Thêm constraint cho delivery_method
ALTER TABLE sales ADD CONSTRAINT IF NOT EXISTS check_delivery_method 
CHECK (delivery_method IN ('pickup', 'delivery'));

-- Cập nhật dữ liệu hiện tại
UPDATE sales SET 
  amount_paid = CASE 
    WHEN payment_status = 'paid' THEN total_revenue + COALESCE(shipping_fee, 0)
    WHEN payment_status = 'partial' THEN ROUND((total_revenue + COALESCE(shipping_fee, 0)) * 0.5)
    ELSE 0
  END,
  amount_remaining = CASE 
    WHEN payment_status = 'paid' THEN 0
    WHEN payment_status = 'partial' THEN ROUND((total_revenue + COALESCE(shipping_fee, 0)) * 0.5)
    ELSE total_revenue + COALESCE(shipping_fee, 0)
  END,
  delivery_method = 'pickup'
WHERE amount_paid IS NULL OR amount_remaining IS NULL;

-- Thêm comments
COMMENT ON COLUMN sales.customer_name IS 'Tên khách hàng';
COMMENT ON COLUMN sales.delivery_method IS 'Phương thức giao hàng: pickup (tự lấy) hoặc delivery (giao hàng)';
COMMENT ON COLUMN sales.amount_paid IS 'Số tiền đã thanh toán';
COMMENT ON COLUMN sales.amount_remaining IS 'Số tiền còn lại chưa thanh toán';
COMMENT ON COLUMN purchases.supplier_name IS 'Tên nhà cung cấp';
