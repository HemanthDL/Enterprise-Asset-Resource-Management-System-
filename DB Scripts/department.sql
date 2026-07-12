CREATE TABLE departments
(
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