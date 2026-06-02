from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..news_provider import resolve_company

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("", response_model=list[schemas.WatchlistOut])
def get_watchlist(db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    return (
        db.query(models.WatchlistItem)
        .filter(models.WatchlistItem.user_id == user.user_id)
        .order_by(models.WatchlistItem.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.WatchlistOut, status_code=201)
def add_to_watchlist(
    payload: schemas.WatchlistCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    ticker = payload.ticker.strip().upper()
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")

    already_added = (
        db.query(models.WatchlistItem)
        .filter(models.WatchlistItem.user_id == user.user_id, models.WatchlistItem.ticker == ticker)
        .first()
    )
    if already_added:
        raise HTTPException(status_code=400, detail=f"{ticker} is already in your watchlist")

    # Fill in the company name/sector if the user didn't provide them.
    info = resolve_company(ticker)
    item = models.WatchlistItem(
        user_id=user.user_id,
        ticker=ticker,
        company_name=payload.company_name or info["company_name"],
        sector=payload.sector or info["sector"],
        notes=payload.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{ticker}", status_code=204)
def remove_from_watchlist(
    ticker: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(auth.get_current_user),
):
    item = (
        db.query(models.WatchlistItem)
        .filter(models.WatchlistItem.user_id == user.user_id, models.WatchlistItem.ticker == ticker.upper())
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Ticker not in watchlist")
    db.delete(item)
    db.commit()
