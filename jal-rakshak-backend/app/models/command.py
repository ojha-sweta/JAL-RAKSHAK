from datetime import datetime

from sqlalchemy import DateTime, Integer, String  # type: ignore[reportMissingImports]
from sqlalchemy.orm import Mapped, mapped_column  # type: ignore[reportMissingImports]

from app.database.database import Base


class DeviceCommand(Base):
    __tablename__ = "device_commands"

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
        index=True,
    )

    # ---------------------------------------------------------
    # Command information
    # ---------------------------------------------------------

    command: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PENDING",
    )

    # ---------------------------------------------------------
    # Related treatment cycle
    # ---------------------------------------------------------

    cycle_number: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # ---------------------------------------------------------
    # Timestamps
    # ---------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    executed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )