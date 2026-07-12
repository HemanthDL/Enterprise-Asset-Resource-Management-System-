CREATE TABLE maintenance_requests
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    asset_id UUID NOT NULL,

    raised_by UUID NOT NULL,

    issue_description TEXT,

    priority VARCHAR(20),

    attachment_url TEXT,

    approval_status maintenance_status_enum DEFAULT 'PENDING',

    approved_by UUID,

    technician UUID,

    resolved_date TIMESTAMPTZ,

    resolution_notes TEXT,

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE'
);