-- ==============================================
-- POLICIES BẢO MẬT CHO AUTHENTICATED USERS
-- ==============================================

-- Xóa policies cũ nếu có
DROP POLICY IF EXISTS "Enable all operations for purchases" ON purchases;
DROP POLICY IF EXISTS "Enable all operations for sales" ON sales;
DROP POLICY IF EXISTS "Enable all operations for expenses" ON expenses;

-- 1. PURCHASES - Chỉ authenticated users
CREATE POLICY "Authenticated users can manage purchases" ON purchases
    FOR ALL USING (auth.role() = 'authenticated');

-- 2. SALES - Chỉ authenticated users
CREATE POLICY "Authenticated users can manage sales" ON sales
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. EXPENSES - Chỉ authenticated users  
CREATE POLICY "Authenticated users can manage expenses" ON expenses
    FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================
-- POLICIES CHI TIẾT HỚN (OPTIONAL)
-- ==============================================

-- Nếu muốn tách riêng từng thao tác:

-- DROP POLICY "Authenticated users can manage expenses" ON expenses;

-- CREATE POLICY "Authenticated users can read expenses" ON expenses
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can create expenses" ON expenses
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can update expenses" ON expenses
--     FOR UPDATE USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can delete expenses" ON expenses
--     FOR DELETE USING (auth.role() = 'authenticated');

-- ==============================================
-- KIỂM TRA KẾT QUẢ
-- ==============================================

SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('purchases', 'sales', 'expenses')
ORDER BY tablename, policyname;
