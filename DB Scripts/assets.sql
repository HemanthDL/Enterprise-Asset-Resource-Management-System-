CREATE TABLE assets
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    asset_tag VARCHAR(50) UNIQUE NOT NULL,

    asset_name VARCHAR(255) NOT NULL,

    category_id UUID NOT NULL,

    serial_number VARCHAR(100) UNIQUE,

    manufacturer VARCHAR(100),

    model VARCHAR(100),

    purchase_date DATE,

    purchase_cost NUMERIC(12,2),

    asset_condition VARCHAR(50),

    location VARCHAR(255),

    department_id UUID,

    is_bookable BOOLEAN DEFAULT FALSE,

    photo_url TEXT,

    warranty_months INTEGER,

    document_url TEXT,

    current_status asset_status_enum DEFAULT 'AVAILABLE',

    current_holder UUID,

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE'
);


ALTER TABLE assets
ADD CONSTRAINT fk_asset_category
FOREIGN KEY(category_id)
REFERENCES asset_categories(id);

ALTER TABLE assets
ADD CONSTRAINT fk_asset_department
FOREIGN KEY(department_id)
REFERENCES departments(id);

ALTER TABLE assets
ADD CONSTRAINT fk_asset_holder
FOREIGN KEY(current_holder)
REFERENCES users(id);