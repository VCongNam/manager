-- Insert sample purchases
INSERT INTO purchases (product_name, quantity, unit, total_cost, remaining_quantity, purchase_date, notes) VALUES
('Gạo ST25', 100, 'kg', 2500000, 85, '2024-01-15', 'Gạo chất lượng cao từ An Giang'),
('Đường trắng', 50, 'kg', 1200000, 35, '2024-01-16', 'Đường tinh luyện Biên Hòa'),
('Nước mắm', 24, 'chai', 960000, 18, '2024-01-17', 'Nước mắm Phú Quốc 500ml'),
('Dầu ăn', 20, 'chai', 800000, 15, '2024-01-18', 'Dầu ăn Neptune 1L'),
('Mì tôm', 100, 'gói', 500000, 75, '2024-01-19', 'Mì tôm Hảo Hảo các vị');

-- Insert sample sales
INSERT INTO sales (purchase_id, quantity, unit_price, total_revenue, sale_date, notes) VALUES
((SELECT id FROM purchases WHERE product_name = 'Gạo ST25'), 15, 28000, 420000, '2024-01-20', 'Bán cho khách lẻ'),
((SELECT id FROM purchases WHERE product_name = 'Đường trắng'), 15, 26000, 390000, '2024-01-21', 'Bán cho cửa hàng tạp hóa'),
((SELECT id FROM purchases WHERE product_name = 'Nước mắm'), 6, 45000, 270000, '2024-01-22', 'Bán lẻ'),
((SELECT id FROM purchases WHERE product_name = 'Dầu ăn'), 5, 45000, 225000, '2024-01-23', 'Bán cho nhà hàng'),
((SELECT id FROM purchases WHERE product_name = 'Mì tôm'), 25, 6500, 162500, '2024-01-24', 'Bán buôn');
