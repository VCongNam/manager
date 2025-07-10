-- Tạo bảng chi phí hàng ngày
CREATE TABLE IF NOT EXISTS daily_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_date DATE NOT NULL,
  expense_type TEXT NOT NULL, -- 'fuel', 'rent', 'utilities', 'marketing', 'other'
  description TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Số tiền chi phí (luôn là số dương)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_daily_expenses_date ON daily_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_type ON daily_expenses(expense_type);

-- Tạo trigger cho daily_expenses
CREATE TRIGGER update_daily_expenses_updated_at BEFORE UPDATE ON daily_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS cho daily_expenses
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for daily_expenses" ON daily_expenses
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON daily_expenses TO anon;
GRANT ALL ON daily_expenses TO authenticated;

-- Comments
COMMENT ON TABLE daily_expenses IS 'Bảng quản lý chi phí hàng ngày (xăng xe, thuê mặt bằng, điện nước, v.v.)';
COMMENT ON COLUMN daily_expenses.amount IS 'Số tiền chi phí (luôn là số dương)';
COMMENT ON COLUMN daily_expenses.expense_type IS 'Loại chi phí: fuel, rent, utilities, marketing, other';
