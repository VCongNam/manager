-- Cập nhật bảng sales để thêm các trường mới
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'pickup';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount_remaining INTEGER DEFAULT 0;

-- Cập nhật bảng purchases để thêm tên nhà cung cấp
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS supplier_name TEXT;

-- Thêm constraint cho delivery_method
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_delivery_method' 
        AND table_name = 'sales'
    ) THEN
        ALTER TABLE sales ADD CONSTRAINT check_delivery_method 
        CHECK (delivery_method IN ('pickup', 'delivery'));
    END IF;
END $$;

-- Cập nhật dữ liệu hiện tại để tính toán amount_paid và amount_remaining
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
  delivery_method = COALESCE(delivery_method, 'pickup')
WHERE amount_paid IS NULL OR amount_remaining IS NULL OR delivery_method IS NULL;

-- Thêm comments để mô tả
COMMENT ON COLUMN sales.customer_name IS 'Tên khách hàng';
COMMENT ON COLUMN sales.delivery_method IS 'Phương thức giao hàng: pickup (tự lấy) hoặc delivery (giao hàng)';
COMMENT ON COLUMN sales.amount_paid IS 'Số tiền đã thanh toán';
COMMENT ON COLUMN sales.amount_remaining IS 'Số tiền còn lại chưa thanh toán';
COMMENT ON COLUMN purchases.supplier_name IS 'Tên nhà cung cấp/nhà bán';

-- Kiểm tra kết quả
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('sales', 'purchases') 
    AND column_name IN ('customer_name', 'delivery_method', 'amount_paid', 'amount_remaining', 'supplier_name')
ORDER BY table_name, column_name;
