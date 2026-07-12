CREATE TABLE asset_status_history
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    asset_id UUID NOT NULL,

    old_status asset_status_enum,

    new_status asset_status_enum,

    changed_by UUID,

    reason TEXT,

    changed_on TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE'
);