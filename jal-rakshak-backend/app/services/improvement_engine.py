from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.cycle import TreatmentCycle


MAX_IMPROVEMENT_THRESHOLD = 8.0
MIN_COMPLETED_CYCLES = 3


def get_completed_cycles(
    db: Session,
    device_id: str,
) -> list[TreatmentCycle]:
    """
    Return completed treatment cycles for a device,
    ordered from oldest to newest.
    """

    return (
        db.query(TreatmentCycle)
        .filter(
            TreatmentCycle.device_id == device_id,
            TreatmentCycle.status == "COMPLETED",
        )
        .order_by(TreatmentCycle.cycle_number.asc())
        .all()
    )


def calculate_cycle_improvement(
    db: Session,
    cycle: TreatmentCycle,
) -> float | None:
    """
    Calculate improvement of the current cycle
    compared with the previous completed cycle.

    Formula:

        Current efficiency - Previous efficiency
    """

    if cycle.tds_removal_efficiency is None:
        return None

    previous_cycle = (
        db.query(TreatmentCycle)
        .filter(
            TreatmentCycle.device_id == cycle.device_id,
            TreatmentCycle.status == "COMPLETED",
            TreatmentCycle.cycle_number < cycle.cycle_number,
        )
        .order_by(desc(TreatmentCycle.cycle_number))
        .first()
    )

    if previous_cycle is None:
        cycle.efficiency_improvement = None
        return None

    if previous_cycle.tds_removal_efficiency is None:
        cycle.efficiency_improvement = None
        return None

    improvement = (
        cycle.tds_removal_efficiency
        - previous_cycle.tds_removal_efficiency
    )

    cycle.efficiency_improvement = improvement

    return improvement


def evaluate_improvement_condition(
    db: Session,
    cycle: TreatmentCycle,
) -> dict:
    """
    Evaluate the JAL-RAKSHAK improvement condition.

    Condition:

        completed cycles > 3
        AND
        efficiency improvement <= 8 percentage points
    """

    completed_cycles = get_completed_cycles(
        db,
        cycle.device_id,
    )

    completed_cycle_count = len(completed_cycles)

    improvement = cycle.efficiency_improvement

    if improvement is None:
        return {
            "condition": False,
            "completed_cycles": completed_cycle_count,
            "max_cycle": (
                completed_cycles[-1].cycle_number
                if completed_cycles
                else 0
            ),
            "efficiency_improvement": None,
        }

    condition = (
        completed_cycle_count > MIN_COMPLETED_CYCLES
        and improvement <= MAX_IMPROVEMENT_THRESHOLD
    )

    return {
        "condition": condition,
        "completed_cycles": completed_cycle_count,
        "max_cycle": (
            completed_cycles[-1].cycle_number
            if completed_cycles
            else 0
        ),
        "efficiency_improvement": improvement,
    }