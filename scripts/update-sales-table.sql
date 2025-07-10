-- Thêm cột payment_status vào bảng sales
ALTER TABLE sales ADD COLUMN payment_status TEXT DEFAULT 'unpaid';

-- Thêm constraint để chỉ cho phép các giá trị hợp lệ
ALTER TABLE sales ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('paid', 'unpaid', 'partial'));

-- Cập nhật dữ liệu hiện tại (nếu có) thành 'paid' 
UPDATE sales SET payment_status = 'paid' WHERE payment_status IS NULL;

-- Thêm comment để mô tả
COMMENT ON COLUMN sales.payment_status IS 'Trạng thái thanh toán: paid (đã thanh toán), unpaid (chưa thanh toán), partial (thanh toán một phần)';
