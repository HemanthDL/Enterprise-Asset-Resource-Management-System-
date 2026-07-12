"""
Seed the first Admin user.
Usage:
    python seed_admin.py --email admin@assetflow.com --password SecureP@ss123 --first-name Admin --last-name User
"""

import argparse
import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.core.constants import RoleEnum, StatusEnum
from app.db.session import AsyncSessionLocal
from app.models.user import User


async def seed_admin(email: str, password: str, first_name: str, last_name: str) -> None:
    """Create the first Admin user if not exists."""
    async with AsyncSessionLocal() as db:
        # Check if admin already exists
        result = await db.execute(select(User).where(User.email == email))
        existing = result.scalars().first()

        if existing:
            print(f"User with email '{email}' already exists (role: {existing.role.value}).")
            if existing.role != RoleEnum.ADMIN:
                existing.role = RoleEnum.ADMIN
                await db.commit()
                print(f"Updated role to ADMIN.")
            return

        admin = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=hash_password(password),
            role=RoleEnum.ADMIN,
            status=StatusEnum.ACTIVE,
        )
        db.add(admin)
        await db.commit()
        await db.refresh(admin)

        print(f"Admin user created successfully!")
        print(f"  ID:    {admin.id}")
        print(f"  Email: {admin.email}")
        print(f"  Role:  {admin.role.value}")


def main():
    parser = argparse.ArgumentParser(description="Seed the first Admin user for AssetFlow")
    parser.add_argument("--email", required=True, help="Admin email address")
    parser.add_argument("--password", required=True, help="Admin password (min 8 chars)")
    parser.add_argument("--first-name", required=True, help="First name")
    parser.add_argument("--last-name", default="", help="Last name")

    args = parser.parse_args()

    if len(args.password) < 8:
        print("Error: Password must be at least 8 characters.")
        sys.exit(1)

    asyncio.run(seed_admin(args.email, args.password, args.first_name, args.last_name))


if __name__ == "__main__":
    main()
