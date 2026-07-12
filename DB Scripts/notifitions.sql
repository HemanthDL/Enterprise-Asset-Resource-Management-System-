CREATE TABLE notifications
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    recipient UUID,

    title VARCHAR(255),

    message TEXT,

    notification_type VARCHAR(100),

    is_read BOOLEAN DEFAULT FALSE,

    sent_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE'
);