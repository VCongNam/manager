-- Thêm bảng expenses để quản lý các chi phí
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL, -- 'shipping_cost', 'packaging', 'other'
  description TEXT,
  amount INTEGER NOT NULL, -- Số tiền (có thể âm hoặc dương)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm cột shipping_fee và notes_internal vào bảng sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shipping_fee INTEGER DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes_internal TEXT;

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_expenses_sale_id ON expenses(sale_id);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);

-- Tạo trigger cho expenses
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE expenses IS 'Bảng quản lý các chi phí liên quan đến đơn hàng';
COMMENT ON COLUMN expenses.amount IS 'Số tiền: dương = thu thêm, âm = chi phí';
COMMENT ON COLUMN sales.shipping_fee IS 'Phí ship: dương = thu thêm, âm = chi phí ship';
