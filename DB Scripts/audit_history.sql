CREATE TABLE audit_history
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    entity_name VARCHAR(100) NOT NULL,

    entity_id UUID NOT NULL,

    operation VARCHAR(30) NOT NULL,

    field_name VARCHAR(100),

    old_value JSONB,

    new_value JSONB,

    performed_by UUID,

    performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    remarks TEXT,

    ip_address VARCHAR(50),

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE'
);