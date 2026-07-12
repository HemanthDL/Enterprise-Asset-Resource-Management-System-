CREATE TABLE resource_bookings
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    asset_id UUID NOT NULL,

    booked_by UUID NOT NULL,

    department_id UUID,

    start_datetime TIMESTAMPTZ NOT NULL,

    end_datetime TIMESTAMPTZ NOT NULL,

    purpose TEXT,

    booking_status booking_status_enum DEFAULT 'UPCOMING',

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE',

    CHECK (end_datetime > start_datetime)
);