from app.models.cycle import TreatmentCycle


def generate_decision(
    cycle: TreatmentCycle,
    completed_cycle_count: int,
) -> str:
    """
    Generate and store the backend treatment decision.

    Decisions:

        NO_ACTION
        CONTINUE
        OPTIMIZE
        HOLD
    """

    efficiency = cycle.tds_removal_efficiency
    improvement = cycle.efficiency_improvement

    # ---------------------------------------------------------
    # Not enough completed cycles
    # ---------------------------------------------------------

    if completed_cycle_count < 3:
        cycle.backend_action = "NO_ACTION"
        return cycle.backend_action

    # ---------------------------------------------------------
    # Efficiency or improvement unavailable
    # ---------------------------------------------------------

    if efficiency is None or improvement is None:
        cycle.backend_action = "NO_ACTION"
        return cycle.backend_action

    # ---------------------------------------------------------
    # Efficiency is declining
    # ---------------------------------------------------------

    if improvement < 0:
        cycle.backend_action = "HOLD"
        return cycle.backend_action

    # ---------------------------------------------------------
    # Improvement is positive but <= 8 percentage points
    # ---------------------------------------------------------

    if improvement <= 8:
        cycle.backend_action = "OPTIMIZE"
        return cycle.backend_action

    # ---------------------------------------------------------
    # Improvement is greater than 8 percentage points
    # ---------------------------------------------------------

    cycle.backend_action = "CONTINUE"

    return cycle.backend_action