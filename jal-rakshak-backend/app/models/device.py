from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class Device(Base):
    __tablename__ = "devices"

    # ---------------------------------------------------------
    # Primary identification
    # ---------------------------------------------------------

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    device_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
    )

    # ---------------------------------------------------------
    # Device status
    # ---------------------------------------------------------

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="OFFLINE",
    )

    # ---------------------------------------------------------
    # Connection information
    # ---------------------------------------------------------

    wifi_connected: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    last_heartbeat: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    last_telemetry: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # ---------------------------------------------------------
    # Device metadata
    # ---------------------------------------------------------

    firmware_version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )