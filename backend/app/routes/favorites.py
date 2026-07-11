"""Favorites routes."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.schemas import FavoriteOut, ListingCardOut
from app.services.listing_service import build_listing_card

router = APIRouter(prefix="/api/v1", tags=["favorites"])


def _require_user(x_demo_user_id: Optional[str] = Header(None)) -> int:
    if not x_demo_user_id:
        raise HTTPException(status_code=401, detail="X-Demo-User-Id header required")
    try:
        return int(x_demo_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid X-Demo-User-Id")


@router.get("/users/{user_id}/favorites", response_model=List[FavoriteOut])
def list_favorites(
    user_id: int,
    requester_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    if requester_id != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own favorites")
    favs = crud.get_favorites(db, user_id)
    result = []
    for fav in favs:
        listing_card = ListingCardOut(**build_listing_card(fav.listing)) if fav.listing else None
        result.append(
            FavoriteOut(
                user_id=fav.user_id,
                listing_id=fav.listing_id,
                created_at=fav.created_at,
                listing=listing_card,
            )
        )
    return result


@router.post("/users/{user_id}/favorites/{listing_id}", response_model=FavoriteOut, status_code=201)
def add_favorite(
    user_id: int,
    listing_id: int,
    requester_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    if requester_id != user_id:
        raise HTTPException(status_code=403, detail="You can only manage your own favorites")

    listing = crud.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    existing = crud.get_favorite(db, user_id, listing_id)
    if existing:
        raise HTTPException(status_code=409, detail="Already in favorites")

    fav = crud.add_favorite(db, user_id, listing_id)
    listing_card = ListingCardOut(**build_listing_card(listing))
    return FavoriteOut(
        user_id=fav.user_id,
        listing_id=fav.listing_id,
        created_at=fav.created_at,
        listing=listing_card,
    )


@router.delete("/users/{user_id}/favorites/{listing_id}", status_code=204)
def remove_favorite(
    user_id: int,
    listing_id: int,
    requester_id: int = Depends(_require_user),
    db: Session = Depends(get_db),
):
    if requester_id != user_id:
        raise HTTPException(status_code=403, detail="You can only manage your own favorites")

    fav = crud.get_favorite(db, user_id, listing_id)
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")

    crud.remove_favorite(db, fav)
