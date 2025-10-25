from fastapi import FastAPI, HTTPException, BackgroundTasks, status, Depends
from pydantic import BaseModel
from datetime import datetime
import time
from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Optional
import os

app = FastAPI()

# SQLAlchemy Setup
# SQLALCHEMY_DATABASE_URL = "sqlite:///./transactions.db"
# SQLALCHEMY_DATABASE_URL =" postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Agd.ACLXBCs48dg@db.ecawgtedjdblfwrzidga.supabase.co:5432/postgres?sslmode=require")
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# SQLAlchemy Model
class TransactionModel(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True, index=True)
    source_account = Column(String, index=True)
    destination_account = Column(String, index=True)
    amount = Column(Float)
    currency = Column(String)
    status = Column(String, default="PROCESSING")
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

# Create database tables
Base.metadata.create_all(bind=engine)


class TransactionWebhook(BaseModel):
    transaction_id: str
    source_account: str
    destination_account: str
    amount: float
    currency: str

class Transaction(TransactionWebhook):
    status: str = "PROCESSING"
    created_at: datetime = datetime.utcnow()
    processed_at: Optional[datetime] = None

async def process_transaction_in_background(transaction_id: str, db: SessionLocal):
    time.sleep(30)  # Simulate external API call or heavy processing
    db_transaction = db.query(TransactionModel).filter(TransactionModel.transaction_id == transaction_id).first()
    if db_transaction:
        db_transaction.status = "PROCESSED"
        db_transaction.processed_at = datetime.utcnow()
        db.commit()
        db.refresh(db_transaction)

@app.post("/v1/webhooks/transactions", status_code=status.HTTP_202_ACCEPTED)
async def receive_webhook(webhook: TransactionWebhook, background_tasks: BackgroundTasks, db: SessionLocal = Depends(get_db)):
    # Check for idempotency
    existing_transaction = db.query(TransactionModel).filter(TransactionModel.transaction_id == webhook.transaction_id).first()
    if existing_transaction:
        return {"message": "Webhook already received and processing/processed", "status": existing_transaction.status}

    # Create new transaction in DB
    db_transaction = TransactionModel(
        transaction_id=webhook.transaction_id,
        source_account=webhook.source_account,
        destination_account=webhook.destination_account,
        amount=webhook.amount,
        currency=webhook.currency,
        created_at=datetime.utcnow()
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    # Add background task for processing
    background_tasks.add_task(process_transaction_in_background, webhook.transaction_id, SessionLocal())

    return {"message": "Webhook received and transaction queued for processing"}

@app.get("/")
async def health_check():
    return {
        "status": "HEALTHY",
        "current_time": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/v1/transactions/{transaction_id}")
async def get_transaction_status(transaction_id: str, db: SessionLocal = Depends(get_db)):
    transaction = db.query(TransactionModel).filter(TransactionModel.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction