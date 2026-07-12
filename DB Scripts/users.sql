CREATE TABLE users
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    phone VARCHAR(20),

    department_id UUID,

    role role_enum DEFAULT 'EMPLOYEE',

    last_login TIMESTAMPTZ,

    created_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    updated_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,

    status status_enum DEFAULT 'ACTIVE'
);

ALTER TABLE users
ADD CONSTRAINT fk_user_department
FOREIGN KEY (department_id)
REFERENCES departments(id);

ALTER TABLE departments
ADD CONSTRAINT fk_department_head
FOREIGN KEY (department_head_id)
REFERENCES users(id);