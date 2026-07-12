from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

users = [
    ("aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa1", "password123"),
    ("aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa2", "password123"),
    ("aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa3", "password123"),
    ("aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa4", "password123"),
    ("aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa5", "password123"),
    ("aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaa6", "password123"),
]

print("-- Run the following SQL in PostgreSQL --\n")

for user_id, password in users:
    hashed = pwd_context.hash(password)
    print(
        f"UPDATE users SET password_hash = '{hashed}' "
        f"WHERE id = '{user_id}';"
    )