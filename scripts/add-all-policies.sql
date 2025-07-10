-- ==============================================
-- RLS POLICIES CHO TẤT CẢ CÁC BẢNG
-- ==============================================

-- 1. BẢNG PURCHASES
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for purchases" ON purchases
    FOR ALL USING (true);

-- 2. BẢNG SALES  
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for sales" ON sales
    FOR ALL USING (true);

-- 3. BẢNG EXPENSES
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for expenses" ON expenses
    FOR ALL USING (true);

-- ==============================================
-- KIỂM TRA TẤT CẢ POLICIES
-- ==============================================

SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive,
    cmd,
    CASE 
        WHEN cmd = 'ALL' THEN 'Tất cả thao tác'
        WHEN cmd = 'SELECT' THEN 'Đọc dữ liệu'
        WHEN cmd = 'INSERT' THEN 'Thêm mới'
        WHEN cmd = 'UPDATE' THEN 'Cập nhật'
        WHEN cmd = 'DELETE' THEN 'Xóa'
    END as operation_type
FROM pg_policies 
WHERE tablename IN ('purchases', 'sales', 'expenses')
ORDER BY tablename, policyname;

-- ==============================================
-- GRANT PERMISSIONS CHO ANON ROLE
-- ==============================================

-- Cấp quyền cho anon role (public access)
GRANT ALL ON purchases TO anon;
GRANT ALL ON sales TO anon;
GRANT ALL ON expenses TO anon;

-- Cấp quyền cho authenticated role
GRANT ALL ON purchases TO authenticated;
GRANT ALL ON sales TO authenticated;
GRANT ALL ON expenses TO authenticated;

-- Cấp quyền sử dụng sequences (cho auto-increment)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==============================================
-- KIỂM TRA PERMISSIONS
-- ==============================================

SELECT 
    table_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name IN ('purchases', 'sales', 'expenses')
    AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
