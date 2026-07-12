CREATE TABLE audit_cycles
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    audit_name VARCHAR(255),

    department_id UUID,

    location VARCHAR(255),

    start_date DATE,

    end_date DATE,

    assigned_by UUID,

    audit_status audit_status_enum DEFAULT 'OPEN',

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE'
);