CREATE TABLE audit_assets
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    audit_cycle_id UUID,

    asset_id UUID,

    auditor UUID,

    verification_status verification_status_enum,

    remarks TEXT,

    verified_date TIMESTAMPTZ,

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE'
);