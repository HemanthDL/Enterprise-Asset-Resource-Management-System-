"""
Auto-generates sequential asset tags in the format AF-XXXX.
"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset


async def generate_asset_tag(db: AsyncSession) -> str:
    """
    Generate the next asset tag (e.g., AF-0001, AF-0002, ...).
    Finds the maximum existing numeric suffix and increments.
    """
    result = await db.execute(select(func.count(Asset.id)))
    count = result.scalar_one()
    next_number = count + 1
    return f"AF-{next_number:04d}"
