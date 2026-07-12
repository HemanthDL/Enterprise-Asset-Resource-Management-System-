/**********************************************************************
 * AssetFlow ERP
 * File: 03_indexes.sql
 * Description: Database indexes for performance optimization
 **********************************************************************/

-------------------------------------------------------------
-- USERS
-------------------------------------------------------------
CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_users_department
ON users(department_id);

CREATE INDEX idx_users_role
ON users(role);

CREATE INDEX idx_users_status
ON users(status);


-------------------------------------------------------------
-- DEPARTMENTS
-------------------------------------------------------------
CREATE INDEX idx_departments_name
ON departments(department_name);

CREATE INDEX idx_departments_parent
ON departments(parent_department_id);

CREATE INDEX idx_departments_status
ON departments(status);


-------------------------------------------------------------
-- ASSET CATEGORIES
-------------------------------------------------------------
CREATE INDEX idx_asset_categories_name
ON asset_categories(category_name);

CREATE INDEX idx_asset_categories_status
ON asset_categories(status);


-------------------------------------------------------------
-- ASSETS
-------------------------------------------------------------
CREATE INDEX idx_assets_tag
ON assets(asset_tag);

CREATE INDEX idx_assets_serial_number
ON assets(serial_number);

CREATE INDEX idx_assets_category
ON assets(category_id);

CREATE INDEX idx_assets_department
ON assets(department_id);

CREATE INDEX idx_assets_status
ON assets(current_status);

CREATE INDEX idx_assets_holder
ON assets(current_holder);

CREATE INDEX idx_assets_location
ON assets(location);

CREATE INDEX idx_assets_bookable
ON assets(is_bookable);


-------------------------------------------------------------
-- ASSET ALLOCATIONS
-------------------------------------------------------------
CREATE INDEX idx_asset_allocations_asset
ON asset_allocations(asset_id);

CREATE INDEX idx_asset_allocations_employee
ON asset_allocations(employee_id);

CREATE INDEX idx_asset_allocations_department
ON asset_allocations(department_id);

CREATE INDEX idx_asset_allocations_status
ON asset_allocations(allocation_status);

CREATE INDEX idx_asset_allocations_expected_return
ON asset_allocations(expected_return_date);


-------------------------------------------------------------
-- TRANSFER REQUESTS
-------------------------------------------------------------
CREATE INDEX idx_transfer_requests_asset
ON transfer_requests(asset_id);

CREATE INDEX idx_transfer_requests_from_employee
ON transfer_requests(from_employee);

CREATE INDEX idx_transfer_requests_to_employee
ON transfer_requests(to_employee);

CREATE INDEX idx_transfer_requests_status
ON transfer_requests(approval_status);


-------------------------------------------------------------
-- RESOURCE BOOKINGS
-------------------------------------------------------------
CREATE INDEX idx_resource_bookings_asset
ON resource_bookings(asset_id);

CREATE INDEX idx_resource_bookings_user
ON resource_bookings(booked_by);

CREATE INDEX idx_resource_bookings_department
ON resource_bookings(department_id);

CREATE INDEX idx_resource_bookings_start
ON resource_bookings(start_datetime);

CREATE INDEX idx_resource_bookings_end
ON resource_bookings(end_datetime);

CREATE INDEX idx_resource_bookings_status
ON resource_bookings(booking_status);


-------------------------------------------------------------
-- MAINTENANCE REQUESTS
-------------------------------------------------------------
CREATE INDEX idx_maintenance_asset
ON maintenance_requests(asset_id);

CREATE INDEX idx_maintenance_raised_by
ON maintenance_requests(raised_by);

CREATE INDEX idx_maintenance_status
ON maintenance_requests(approval_status);

CREATE INDEX idx_maintenance_priority
ON maintenance_requests(priority);

CREATE INDEX idx_maintenance_technician
ON maintenance_requests(technician);


-------------------------------------------------------------
-- MAINTENANCE HISTORY
-------------------------------------------------------------
CREATE INDEX idx_maintenance_history_request
ON maintenance_history(maintenance_request_id);

CREATE INDEX idx_maintenance_history_asset
ON maintenance_history(asset_id);

CREATE INDEX idx_maintenance_history_performed_by
ON maintenance_history(performed_by);


-------------------------------------------------------------
-- AUDIT CYCLES
-------------------------------------------------------------
CREATE INDEX idx_audit_cycles_department
ON audit_cycles(department_id);

CREATE INDEX idx_audit_cycles_status
ON audit_cycles(audit_status);

CREATE INDEX idx_audit_cycles_date
ON audit_cycles(start_date, end_date);


-------------------------------------------------------------
-- AUDIT ASSETS
-------------------------------------------------------------
CREATE INDEX idx_audit_assets_cycle
ON audit_assets(audit_cycle_id);

CREATE INDEX idx_audit_assets_asset
ON audit_assets(asset_id);

CREATE INDEX idx_audit_assets_auditor
ON audit_assets(auditor);

CREATE INDEX idx_audit_assets_status
ON audit_assets(verification_status);


-------------------------------------------------------------
-- NOTIFICATIONS
-------------------------------------------------------------
CREATE INDEX idx_notifications_recipient
ON notifications(recipient);

CREATE INDEX idx_notifications_read
ON notifications(is_read);

CREATE INDEX idx_notifications_sent
ON notifications(sent_date);


-------------------------------------------------------------
-- ACTIVITY LOGS
-------------------------------------------------------------
CREATE INDEX idx_activity_logs_user
ON activity_logs(user_id);

CREATE INDEX idx_activity_logs_module
ON activity_logs(module);

CREATE INDEX idx_activity_logs_action
ON activity_logs(action);

CREATE INDEX idx_activity_logs_record
ON activity_logs(record_id);

CREATE INDEX idx_activity_logs_created
ON activity_logs(created_datetime);


-------------------------------------------------------------
-- ASSET DOCUMENTS
-------------------------------------------------------------
CREATE INDEX idx_asset_documents_asset
ON asset_documents(asset_id);

CREATE INDEX idx_asset_documents_uploaded_by
ON asset_documents(uploaded_by);


-------------------------------------------------------------
-- ASSET STATUS HISTORY
-------------------------------------------------------------
CREATE INDEX idx_asset_status_history_asset
ON asset_status_history(asset_id);

CREATE INDEX idx_asset_status_history_changed_on
ON asset_status_history(changed_on);

CREATE INDEX idx_asset_status_history_new_status
ON asset_status_history(new_status);

CREATE INDEX idx_asset_status_history_changed_by
ON asset_status_history(changed_by);


-------------------------------------------------------------
-- PREVENT OVERLAPPING RESOURCE BOOKINGS
-------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE resource_bookings
ADD CONSTRAINT no_overlapping_resource_booking
EXCLUDE USING gist
(
    asset_id WITH =,
    tstzrange(start_datetime, end_datetime) WITH &&
);