-- ============================================================
--  Manual Admin Creation Script for EventPro
--  Run this in MySQL Workbench or MySQL command line
-- ============================================================

USE eventpro;

-- Create admin account (password: admin123456)
-- Password hash for 'admin123456' using bcrypt
INSERT INTO admins (name, email, password) VALUES
('Admin', 'admin@eventpro.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeCt1uB0w/4ScI3W6')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password);

SELECT 'Admin account created/updated successfully!' as status;
SELECT 'Email: admin@eventpro.com' as login_info;
SELECT 'Password: admin123456' as login_info;