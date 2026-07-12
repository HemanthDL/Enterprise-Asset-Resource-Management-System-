CREATE TABLE transfer_requests
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    asset_id UUID NOT NULL,

    from_employee UUID NOT NULL,

    to_employee UUID NOT NULL,

    reason TEXT,

    approval_status transfer_status_enum DEFAULT 'REQUESTED',

    approved_by UUID,

    approval_date TIMESTAMPTZ,

    comments TEXT,

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE'
);