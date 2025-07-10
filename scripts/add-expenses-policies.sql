-- Bật Row Level Security cho bảng expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy 1: Cho phép SELECT tất cả expenses (đọc)
CREATE POLICY "Enable read access for all users" ON expenses
    FOR SELECT USING (true);

-- Policy 2: Cho phép INSERT expenses (tạo mới)
CREATE POLICY "Enable insert for all users" ON expenses
    FOR INSERT WITH CHECK (true);

-- Policy 3: Cho phép UPDATE expenses (cập nhật)
CREATE POLICY "Enable update for all users" ON expenses
    FOR UPDATE USING (true);

-- Policy 4: Cho phép DELETE expenses (xóa)
CREATE POLICY "Enable delete for all users" ON expenses
    FOR DELETE USING (true);

-- Nếu bạn muốn policies nghiêm ngặt hơn (chỉ authenticated users):
-- DROP POLICY "Enable read access for all users" ON expenses;
-- DROP POLICY "Enable insert for all users" ON expenses;
-- DROP POLICY "Enable update for all users" ON expenses;
-- DROP POLICY "Enable delete for all users" ON expenses;

-- CREATE POLICY "Enable read access for authenticated users" ON expenses
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable insert for authenticated users" ON expenses
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Enable update for authenticated users" ON expenses
--     FOR UPDATE USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable delete for authenticated users" ON expenses
--     FOR DELETE USING (auth.role() = 'authenticated');

-- Kiểm tra policies đã được tạo
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'expenses';

-- Comment
COMMENT ON POLICY "Enable read access for all users" ON expenses IS 'Cho phép tất cả user đọc expenses';
COMMENT ON POLICY "Enable insert for all users" ON expenses IS 'Cho phép tất cả user tạo expenses mới';
COMMENT ON POLICY "Enable update for all users" ON expenses IS 'Cho phép tất cả user cập nhật expenses';
COMMENT ON POLICY "Enable delete for all users" ON expenses IS 'Cho phép tất cả user xóa expenses';
