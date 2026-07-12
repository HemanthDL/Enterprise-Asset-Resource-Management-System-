-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE status_enum AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE role_enum AS ENUM ('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE');
CREATE TYPE asset_status_enum AS ENUM ('AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED');
CREATE TYPE allocation_status_enum AS ENUM ('ALLOCATED', 'RETURNED', 'OVERDUE');
CREATE TYPE transfer_status_enum AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE booking_status_enum AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE maintenance_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'RESOLVED');
CREATE TYPE audit_status_enum AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED');
CREATE TYPE verification_status_enum AS ENUM ('VERIFIED', 'MISSING', 'DAMAGED');

-- 2. CORE SCHEMA ENTITIES
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) UNIQUE NOT NULL,
    parent_department_id UUID,
    description TEXT,
    department_head_id UUID,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone VARCHAR(20),
    department_id UUID,
    role role_enum DEFAULT 'EMPLOYEE',
    last_login TIMESTAMPTZ,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

-- Mutual Foreign Keys
ALTER TABLE users ADD CONSTRAINT fk_user_department FOREIGN KEY (department_id) REFERENCES departments(id);
ALTER TABLE departments ADD CONSTRAINT fk_department_head FOREIGN KEY (department_head_id) REFERENCES users(id);

-- 3. ASSET SETUP
CREATE TABLE asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL,
    serial_number VARCHAR(100) UNIQUE,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    purchase_date DATE,
    purchase_cost NUMERIC(12,2),
    asset_condition VARCHAR(50),
    location VARCHAR(255),
    department_id UUID,
    is_bookable BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    warranty_months INTEGER,
    document_url TEXT,
    current_status asset_status_enum DEFAULT 'AVAILABLE',
    current_holder UUID,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE',
    CONSTRAINT fk_asset_category FOREIGN KEY(category_id) REFERENCES asset_categories(id),
    CONSTRAINT fk_asset_department FOREIGN KEY(department_id) REFERENCES departments(id),
    CONSTRAINT fk_asset_holder FOREIGN KEY(current_holder) REFERENCES users(id)
);

CREATE TABLE asset_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id),
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_url TEXT,
    uploaded_by UUID,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

CREATE TABLE asset_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    old_status asset_status_enum,
    new_status asset_status_enum,
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    changed_on TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

-- 4. ALLOCATIONS & RESERVATIONS
CREATE TABLE asset_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    employee_id UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    allocated_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expected_return_date TIMESTAMPTZ,
    actual_return_date TIMESTAMPTZ,
    allocation_status allocation_status_enum DEFAULT 'ALLOCATED',
    check_in_notes TEXT,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

CREATE TABLE resource_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    booked_by UUID NOT NULL REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    purpose TEXT,
    booking_status booking_status_enum DEFAULT 'UPCOMING',
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE',
    CHECK (end_datetime > start_datetime)
);

CREATE TABLE transfer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    from_employee UUID NOT NULL REFERENCES users(id),
    to_employee UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    approval_status transfer_status_enum DEFAULT 'REQUESTED',
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMPTZ,
    comments TEXT,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

-- 5. MAINTENANCE & AUDITS
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    raised_by UUID NOT NULL REFERENCES users(id),
    issue_description TEXT,
    priority VARCHAR(20),
    attachment_url TEXT,
    approval_status maintenance_status_enum DEFAULT 'PENDING',
    approved_by UUID REFERENCES users(id),
    technician UUID REFERENCES users(id),
    resolved_date TIMESTAMPTZ,
    resolution_notes TEXT,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

CREATE TABLE maintenance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id),
    asset_id UUID NOT NULL REFERENCES assets(id),
    action_taken TEXT,
    performed_by UUID REFERENCES users(id),
    remarks TEXT,
    performed_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

CREATE TABLE audit_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_name VARCHAR(255),
    department_id UUID REFERENCES departments(id),
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    assigned_by UUID REFERENCES users(id),
    audit_status audit_status_enum DEFAULT 'OPEN',
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

CREATE TABLE audit_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_cycle_id UUID REFERENCES audit_cycles(id),
    asset_id UUID REFERENCES assets(id),
    auditor UUID REFERENCES users(id),
    verification_status verification_status_enum,
    remarks TEXT,
    verified_date TIMESTAMPTZ,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

-- Note: Created this base audit history table reference (referenced in index files)
CREATE TABLE audit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(30) NOT NULL,
    field_name VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    ip_address VARCHAR(50),
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient UUID REFERENCES users(id),
    title VARCHAR(255),
    message TEXT,
    notification_type VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    sent_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    status status_enum DEFAULT 'ACTIVE'
);

-- Fake index log table to prevent index breaking (if referenced)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    module VARCHAR(100),
    action VARCHAR(100),
    record_id UUID,
    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. INDEXES & CONSTRAINTS
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_departments_name ON departments(department_name);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);
CREATE INDEX idx_departments_status ON departments(status);

CREATE INDEX idx_asset_categories_name ON asset_categories(category_name);
CREATE INDEX idx_asset_categories_status ON asset_categories(status);

CREATE INDEX idx_assets_tag ON assets(asset_tag);
CREATE INDEX idx_assets_serial_number ON assets(serial_number);
CREATE INDEX idx_assets_category ON assets(category_id);
CREATE INDEX idx_assets_department ON assets(department_id);
CREATE INDEX idx_assets_status ON assets(current_status);
CREATE INDEX idx_assets_holder ON assets(current_holder);
CREATE INDEX idx_assets_location ON assets(location);
CREATE INDEX idx_assets_bookable ON assets(is_bookable);

CREATE INDEX idx_asset_allocations_asset ON asset_allocations(asset_id);
CREATE INDEX idx_asset_allocations_employee ON asset_allocations(employee_id);
CREATE INDEX idx_asset_allocations_department ON asset_allocations(department_id);
CREATE INDEX idx_asset_allocations_status ON asset_allocations(allocation_status);
CREATE INDEX idx_asset_allocations_expected_return ON asset_allocations(expected_return_date);

CREATE INDEX idx_transfer_requests_asset ON transfer_requests(asset_id);
CREATE INDEX idx_transfer_requests_from_employee ON transfer_requests(from_employee);
CREATE INDEX idx_transfer_requests_to_employee ON transfer_requests(to_employee);
CREATE INDEX idx_transfer_requests_status ON transfer_requests(approval_status);

CREATE INDEX idx_resource_bookings_asset ON resource_bookings(asset_id);
CREATE INDEX idx_resource_bookings_user ON resource_bookings(booked_by);
CREATE INDEX idx_resource_bookings_department ON resource_bookings(department_id);
CREATE INDEX idx_resource_bookings_start ON resource_bookings(start_datetime);
CREATE INDEX idx_resource_bookings_end ON resource_bookings(end_datetime);
CREATE INDEX idx_resource_bookings_status ON resource_bookings(booking_status);

CREATE INDEX idx_maintenance_asset ON maintenance_requests(asset_id);
CREATE INDEX idx_maintenance_raised_by ON maintenance_requests(raised_by);
CREATE INDEX idx_maintenance_status ON maintenance_requests(approval_status);
CREATE INDEX idx_maintenance_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_technician ON maintenance_requests(technician);

CREATE INDEX idx_maintenance_history_request ON maintenance_history(maintenance_request_id);
CREATE INDEX idx_maintenance_history_asset ON maintenance_history(asset_id);
CREATE INDEX idx_maintenance_history_performed_by ON maintenance_history(performed_by);

CREATE INDEX idx_audit_cycles_department ON audit_cycles(department_id);
CREATE INDEX idx_audit_cycles_status ON audit_cycles(audit_status);
CREATE INDEX idx_audit_cycles_date ON audit_cycles(start_date, end_date);

CREATE INDEX idx_audit_assets_cycle ON audit_assets(audit_cycle_id);
CREATE INDEX idx_audit_assets_asset ON audit_assets(asset_id);
CREATE INDEX idx_audit_assets_auditor ON audit_assets(auditor);
CREATE INDEX idx_audit_assets_status ON audit_assets(verification_status);

CREATE INDEX idx_notifications_recipient ON notifications(recipient);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_sent ON notifications(sent_date);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_module ON activity_logs(module);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_record ON activity_logs(record_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_datetime);

CREATE INDEX idx_asset_documents_asset ON asset_documents(asset_id);
CREATE INDEX idx_asset_documents_uploaded_by ON asset_documents(uploaded_by);

CREATE INDEX idx_asset_status_history_asset ON asset_status_history(asset_id);
CREATE INDEX idx_asset_status_history_changed_on ON asset_status_history(changed_on);
CREATE INDEX idx_asset_status_history_new_status ON asset_status_history(new_status);
CREATE INDEX idx_asset_status_history_changed_by ON asset_status_history(changed_by);

-- Overlapping Bookings Constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE resource_bookings
ADD CONSTRAINT no_overlapping_resource_booking
EXCLUDE USING gist (
    asset_id WITH =,
    tstzrange(start_datetime, end_datetime) WITH &&
);