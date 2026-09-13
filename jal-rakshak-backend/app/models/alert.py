from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class AlertState(Base):
    __tablename__ = "alert_states"

    __table_args__ = (
        UniqueConstraint(
            "device_id",
            "alert_key",
            name="uq_alert_state_device_key",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    device_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    alert_key: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    first_detected_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    last_notified_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )