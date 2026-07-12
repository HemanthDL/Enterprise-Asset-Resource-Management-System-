"""
Pagination helper utilities.
"""


def paginate_params(skip: int = 0, limit: int = 20) -> dict:
    """Normalize pagination parameters with sensible bounds."""
    skip = max(0, skip)
    limit = max(1, min(limit, 100))  # Cap at 100 items per page
    return {"skip": skip, "limit": limit}
