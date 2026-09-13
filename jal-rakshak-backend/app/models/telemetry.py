from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class Telemetry(Base):
    __tablename__ = "telemetry"

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

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    cycle_id: Mapped[int | None] = mapped_column(
        ForeignKey("treatment_cycles.id"),
        nullable=True,
        index=True,
    )

    point_a_tds: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    point_a_turbidity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    point_a_temperature: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    point_b_ph: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    point_b_tds: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    point_b_turbidity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    point_b_temperature: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    flow_rate_l_min: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    pump_status: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )