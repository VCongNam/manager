-- Xóa constraint cũ
ALTER TABLE sales DROP CONSTRAINT IF EXISTS check_payment_status;

-- Thêm constraint mới với validation tốt hơn
ALTER TABLE sales ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('paid', 'unpaid', 'partial') AND payment_status IS NOT NULL);

-- Cập nhật các record có giá trị NULL (nếu có)
UPDATE sales SET payment_status = 'unpaid' WHERE payment_status IS NULL;

-- Kiểm tra constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'sales'::regclass 
AND conname = 'check_payment_status';

-- Kiểm tra dữ liệu hiện tại
SELECT payment_status, COUNT(*) 
FROM sales 
GROUP BY payment_status;
