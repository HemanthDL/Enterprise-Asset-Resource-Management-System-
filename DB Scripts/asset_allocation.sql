CREATE TABLE asset_allocations
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    asset_id UUID NOT NULL,

    employee_id UUID,

    department_id UUID,

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


ALTER TABLE asset_allocations
ADD FOREIGN KEY(asset_id) REFERENCES assets(id);

ALTER TABLE asset_allocations
ADD FOREIGN KEY(employee_id) REFERENCES users(id);

ALTER TABLE asset_allocations
ADD FOREIGN KEY(department_id) REFERENCES departments(id);