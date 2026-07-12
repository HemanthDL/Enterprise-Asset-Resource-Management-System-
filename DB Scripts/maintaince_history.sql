CREATE TABLE maintenance_history
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    maintenance_request_id UUID NOT NULL,

    asset_id UUID NOT NULL,

    action_taken TEXT,

    performed_by UUID,

    remarks TEXT,

    performed_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE'
);