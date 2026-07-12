CREATE TABLE asset_documents
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    asset_id UUID,

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