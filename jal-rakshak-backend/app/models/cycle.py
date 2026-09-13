from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class TreatmentCycle(Base):
    __tablename__ = "treatment_cycles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    device_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )

    cycle_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    end_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="ACTIVE"
    )

    reading_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    # ============================================================
    # POINT A - RAW WATER
    # Cycle averages
    # ============================================================

    avg_point_a_tds: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    avg_point_a_turbidity: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    avg_point_a_temperature: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    # ============================================================
    # POINT B - TREATED WATER
    # Cycle averages
    # ============================================================

    avg_point_b_ph: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    avg_point_b_tds: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    avg_point_b_turbidity: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    avg_point_b_temperature: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    # ============================================================
    # PROCESS FLOW
    # Average flow during cycle
    # ============================================================

    avg_flow_rate_l_min: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    # ============================================================
    # EFFICIENCY
    # ============================================================

    tds_removal_efficiency: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    turbidity_removal_efficiency: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    filter_health_score_pct: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    efficiency_improvement: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    # ============================================================
    # ML PREDICTIONS
    # ============================================================

    ml_filter_health_prediction: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True
    )

    ml_filter_health_confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    ml_water_quality_prediction: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True
    )

    ml_water_quality_confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    # ============================================================
    # DECISION / CONTROL
    # ============================================================

    improvement_condition: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True
    )

    backend_action: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True
    )