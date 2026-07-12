-- ==========================================
-- ASSETFLOW ERP - SAMPLE DATA SCRIPT
-- ==========================================
-- This script populates the database with realistic, role-based sample data.
-- It resolves circular dependencies (e.g., users <-> departments) and 
-- respects all constraints, including foreign keys and enum types.

-- NOTE: The password here is inserted as plain text ('password123') as requested.
-- Please ensure your backend handles hashing during login or on first access if needed.

-- 1. CLEANUP EXISTING DATA (Optional, useful for clean slate)
TRUNCATE TABLE audit_assets, audit_cycles, maintenance_history, maintenance_requests, transfer_requests, resource_bookings, asset_allocations, asset_status_history, asset_documents, assets, asset_categories, users, departments RESTART IDENTITY CASCADE;

-- 2. INSERT DEPARTMENTS (Initially without department_head_id to avoid FK conflict with users)
INSERT INTO departments (id, department_name, department_code, description, status) VALUES
('11111111-1111-4111-a111-111111111111', 'Information Technology', 'IT', 'Handles all technical infrastructure and software.', 'ACTIVE'),
('22222222-2222-4222-a222-222222222222', 'Human Resources', 'HR', 'Manages employee relations and benefits.', 'ACTIVE'),
('33333333-3333-4333-a333-333333333333', 'Operations', 'OPS', 'Manages day-to-day business operations and logistics.', 'ACTIVE');

-- 3. INSERT USERS
-- Password is 'password123'
INSERT INTO users (id, first_name, last_name, email, password_hash, phone, department_id, role, status) VALUES
-- Admin
('aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa1', 'Alice', 'Admin', 'admin@assetflow.com', 'password123', '+1234567890', '11111111-1111-4111-a111-111111111111', 'ADMIN', 'ACTIVE'),
-- Asset Manager
('aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa2', 'Bob', 'Manager', 'manager@assetflow.com', 'password123', '+1987654321', '33333333-3333-4333-a333-333333333333', 'ASSET_MANAGER', 'ACTIVE'),
-- Department Heads
('aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa3', 'Charlie', 'HeadIT', 'charlie.it@assetflow.com', 'password123', '+1122334455', '11111111-1111-4111-a111-111111111111', 'DEPARTMENT_HEAD', 'ACTIVE'),
('aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa4', 'Diana', 'HeadHR', 'diana.hr@assetflow.com', 'password123', '+1554433221', '22222222-2222-4222-a222-222222222222', 'DEPARTMENT_HEAD', 'ACTIVE'),
-- Employees
('aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa5', 'Eve', 'Employee', 'eve.it@assetflow.com', 'password123', '+1667788990', '11111111-1111-4111-a111-111111111111', 'EMPLOYEE', 'ACTIVE'),
('aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa6', 'Frank', 'Employee', 'frank.hr@assetflow.com', 'password123', '+1998877665', '22222222-2222-4222-a222-222222222222', 'EMPLOYEE', 'ACTIVE');

-- 4. UPDATE DEPARTMENTS WITH HEADS
UPDATE departments SET department_head_id = 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa3' WHERE id = '11111111-1111-4111-a111-111111111111';
UPDATE departments SET department_head_id = 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa4' WHERE id = '22222222-2222-4222-a222-222222222222';

-- 5. INSERT ASSET CATEGORIES
INSERT INTO asset_categories (id, category_name, description, icon) VALUES
('cccccccc-cccc-4ccc-bccc-ccccccccccc1', 'Laptops', 'Company issued laptops for employees', 'laptop'),
('cccccccc-cccc-4ccc-bccc-ccccccccccc2', 'Monitors', 'External displays', 'monitor'),
('cccccccc-cccc-4ccc-bccc-ccccccccccc3', 'Vehicles', 'Company cars for travel and logistics', 'car'),
('cccccccc-cccc-4ccc-bccc-ccccccccccc4', 'Conference Rooms', 'Shared spaces for meetings', 'building');

-- 6. INSERT ASSETS
INSERT INTO assets (id, asset_tag, asset_name, category_id, serial_number, manufacturer, model, purchase_date, purchase_cost, asset_condition, location, department_id, is_bookable, current_status, current_holder) VALUES
-- Allocated Asset
('ffffffff-ffff-4fff-bfff-fffffffffff1', 'TAG-LAP-001', 'MacBook Pro 16"', 'cccccccc-cccc-4ccc-bccc-ccccccccccc1', 'SN-MBP-12345', 'Apple', 'M2 Pro', '2023-01-15', 2499.00, 'good', 'HQ - Floor 2', '11111111-1111-4111-a111-111111111111', false, 'ALLOCATED', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa5'),
-- Available Asset
('ffffffff-ffff-4fff-bfff-fffffffffff2', 'TAG-LAP-002', 'Dell XPS 15', 'cccccccc-cccc-4ccc-bccc-ccccccccccc1', 'SN-DXPS-98765', 'Dell', 'XPS 15 9520', '2023-06-20', 1899.00, 'new', 'IT Storage', '11111111-1111-4111-a111-111111111111', false, 'AVAILABLE', NULL),
-- Allocated Asset (Overdue return scenario)
('ffffffff-ffff-4fff-bfff-fffffffffff3', 'TAG-MON-001', 'Dell UltraSharp 27"', 'cccccccc-cccc-4ccc-bccc-ccccccccccc2', 'SN-MON-55555', 'Dell', 'U2723QE', '2022-11-10', 599.00, 'fair', 'HQ - Floor 3', '22222222-2222-4222-a222-222222222222', false, 'ALLOCATED', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa6'),
-- Bookable Vehicle
('ffffffff-ffff-4fff-bfff-fffffffffff4', 'TAG-VEH-001', 'Toyota Prius', 'cccccccc-cccc-4ccc-bccc-ccccccccccc3', 'VIN-123456789', 'Toyota', 'Prius 2022', '2022-05-01', 25000.00, 'good', 'HQ Parking - Spot 12', '33333333-3333-4333-a333-333333333333', true, 'AVAILABLE', NULL),
-- Bookable Room
('ffffffff-ffff-4fff-bfff-fffffffffff5', 'TAG-ROM-001', 'Boardroom Alpha', 'cccccccc-cccc-4ccc-bccc-ccccccccccc4', NULL, NULL, NULL, NULL, NULL, 'good', 'HQ - Floor 1', '33333333-3333-4333-a333-333333333333', true, 'AVAILABLE', NULL),
-- Under Maintenance Asset
('ffffffff-ffff-4fff-bfff-fffffffffff6', 'TAG-LAP-003', 'Lenovo ThinkPad X1', 'cccccccc-cccc-4ccc-bccc-ccccccccccc1', 'SN-TP-112233', 'Lenovo', 'X1 Carbon Gen 9', '2021-08-12', 1599.00, 'damaged', 'IT Workshop', '11111111-1111-4111-a111-111111111111', false, 'UNDER_MAINTENANCE', NULL),
-- Lost Asset
('ffffffff-ffff-4fff-bfff-fffffffffff7', 'TAG-MOB-001', 'iPhone 13 Pro', 'cccccccc-cccc-4ccc-bccc-ccccccccccc1', 'SN-IPH-99999', 'Apple', '13 Pro', '2022-02-14', 999.00, 'poor', 'Unknown', '22222222-2222-4222-a222-222222222222', false, 'LOST', NULL);

-- 7. INSERT ASSET ALLOCATIONS
INSERT INTO asset_allocations (id, asset_id, employee_id, department_id, allocated_date, expected_return_date, allocation_status) VALUES
-- Active Allocation for Eve
(uuid_generate_v4(), 'ffffffff-ffff-4fff-bfff-fffffffffff1', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa5', '11111111-1111-4111-a111-111111111111', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '30 days', 'ALLOCATED'),
-- Overdue Allocation for Frank
(uuid_generate_v4(), 'ffffffff-ffff-4fff-bfff-fffffffffff3', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa6', '22222222-2222-4222-a222-222222222222', CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 'OVERDUE'),
-- Past Returned Allocation for ThinkPad
(uuid_generate_v4(), 'ffffffff-ffff-4fff-bfff-fffffffffff6', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa3', '11111111-1111-4111-a111-111111111111', CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '10 days', 'RETURNED');

-- 8. INSERT RESOURCE BOOKINGS
INSERT INTO resource_bookings (id, asset_id, booked_by, department_id, start_datetime, end_datetime, purpose, booking_status) VALUES
-- Upcoming booking for the Company Car
(uuid_generate_v4(), 'ffffffff-ffff-4fff-bfff-fffffffffff4', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa3', '11111111-1111-4111-a111-111111111111', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '2 days', 'Client Visit', 'UPCOMING'),
-- Ongoing booking for Boardroom
(uuid_generate_v4(), 'ffffffff-ffff-4fff-bfff-fffffffffff5', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa4', '22222222-2222-4222-a222-222222222222', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '1 hour', 'Quarterly HR Meeting', 'ONGOING'),
-- Completed booking
(uuid_generate_v4(), 'ffffffff-ffff-4fff-bfff-fffffffffff5', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa5', '11111111-1111-4111-a111-111111111111', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '2 hours', 'Team Sync', 'COMPLETED');

-- 9. INSERT TRANSFER REQUESTS
INSERT INTO transfer_requests (id, asset_id, from_employee, to_employee, reason, approval_status, created_datetime) VALUES
-- Pending Request
(uuid_generate_v4(), 'ffffffff-ffff-4fff-bfff-fffffffffff1', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa5', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa3', 'Reassigning to Dept Head', 'REQUESTED', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- 10. INSERT MAINTENANCE REQUESTS
INSERT INTO maintenance_requests (id, asset_id, raised_by, issue_description, priority, approval_status, technician, created_datetime) VALUES
-- In Progress Maintenance for Thinkpad
('eeeeeeee-eeee-4eee-beee-eeeeeeeeeee1', 'ffffffff-ffff-4fff-bfff-fffffffffff6', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa3', 'Screen flickering and battery draining fast', 'HIGH', 'IN_PROGRESS', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa2', CURRENT_TIMESTAMP - INTERVAL '5 days'),
-- Pending Request for Dell Monitor
('eeeeeeee-eeee-4eee-beee-eeeeeeeeeee2', 'ffffffff-ffff-4fff-bfff-fffffffffff3', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa6', 'Monitor display color is distorted', 'MEDIUM', 'PENDING', NULL, CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- 11. INSERT MAINTENANCE HISTORY
INSERT INTO maintenance_history (id, maintenance_request_id, asset_id, action_taken, performed_by, remarks, performed_date) VALUES
(uuid_generate_v4(), 'eeeeeeee-eeee-4eee-beee-eeeeeeeeeee1', 'ffffffff-ffff-4fff-bfff-fffffffffff6', 'Diagnosed hardware issue', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa2', 'Ordered replacement screen and battery.', CURRENT_TIMESTAMP - INTERVAL '4 days');

-- 12. INSERT AUDIT CYCLES
INSERT INTO audit_cycles (id, audit_name, department_id, location, start_date, end_date, assigned_by, audit_status) VALUES
-- Open Audit
('dddddddd-dddd-4ddd-bddd-ddddddddddd1', 'Q3 IT Equipment Audit', '11111111-1111-4111-a111-111111111111', 'HQ - Floor 2', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa1', 'IN_PROGRESS');

-- 13. INSERT AUDIT ASSETS
INSERT INTO audit_assets (id, audit_cycle_id, asset_id, auditor, verification_status, remarks, verified_date) VALUES
(uuid_generate_v4(), 'dddddddd-dddd-4ddd-bddd-ddddddddddd1', 'ffffffff-ffff-4fff-bfff-fffffffffff1', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa2', 'VERIFIED', 'All good', CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'dddddddd-dddd-4ddd-bddd-ddddddddddd1', 'ffffffff-ffff-4fff-bfff-fffffffffff2', 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa2', NULL, NULL, NULL);

-- 14. GENERATE SOME NOTIFICATIONS
INSERT INTO notifications (id, recipient, title, message, notification_type, is_read) VALUES
(uuid_generate_v4(), 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa5', 'Asset Assigned', 'You have been assigned MacBook Pro 16".', 'asset_assigned', TRUE),
(uuid_generate_v4(), 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa6', 'Overdue Return', 'Your allocation for Dell UltraSharp 27" is overdue.', 'overdue_return', FALSE);

-- Done.
