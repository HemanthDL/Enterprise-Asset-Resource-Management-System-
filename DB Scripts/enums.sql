CREATE TYPE status_enum AS ENUM
(
    'ACTIVE',
    'INACTIVE'
);

CREATE TYPE role_enum AS ENUM
(
    'ADMIN',
    'ASSET_MANAGER',
    'DEPARTMENT_HEAD',
    'EMPLOYEE'
);

CREATE TYPE asset_status_enum AS ENUM
(
    'AVAILABLE',
    'ALLOCATED',
    'RESERVED',
    'UNDER_MAINTENANCE',
    'LOST',
    'RETIRED',
    'DISPOSED'
);

CREATE TYPE allocation_status_enum AS ENUM
(
    'ALLOCATED',
    'RETURNED',
    'OVERDUE'
);

CREATE TYPE transfer_status_enum AS ENUM
(
    'REQUESTED',
    'APPROVED',
    'REJECTED',
    'COMPLETED'
);

CREATE TYPE booking_status_enum AS ENUM
(
    'UPCOMING',
    'ONGOING',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE maintenance_status_enum AS ENUM
(
    'PENDING',
    'APPROVED',
    'REJECTED',
    'TECHNICIAN_ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED'
);

CREATE TYPE audit_status_enum AS ENUM
(
    'OPEN',
    'IN_PROGRESS',
    'COMPLETED',
    'CLOSED'
);

CREATE TYPE verification_status_enum AS ENUM
(
    'VERIFIED',
    'MISSING',
    'DAMAGED'
);