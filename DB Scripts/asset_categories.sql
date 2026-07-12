CREATE TABLE asset_categories
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    category_name VARCHAR(100) UNIQUE NOT NULL,

    description TEXT,

    icon VARCHAR(255),

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE'
);