from app.models.cycle import TreatmentCycle


# --------------------------------
# Engineering constants
# --------------------------------

FLOW_WEIGHT = 0.4
TURBIDITY_WEIGHT = 0.6

Q_MAX_L_MIN = 2.0
TURBIDITY_BASELINE_EFFICIENCY_PCT = 80.0


def calculate_filter_health_score(
    flow_rate_l_min: float | None,
    turbidity_efficiency_pct: float | None,
) -> float | None:
    """
    Calculate the engineering Filter Health Score.

    Formula:

    H_filter =
        0.4 * (Q_process / Q_max)
        +
        0.6 * (E_turb / E_turb_base)

    Q_max = 2.0 L/min
    E_turb_base = 80%
    """

    if flow_rate_l_min is None:
        return None

    if turbidity_efficiency_pct is None:
        return None

    flow_component = (
        flow_rate_l_min / Q_MAX_L_MIN
    )

    turbidity_component = (
        turbidity_efficiency_pct
        / TURBIDITY_BASELINE_EFFICIENCY_PCT
    )

    score = (
        FLOW_WEIGHT * flow_component
        +
        TURBIDITY_WEIGHT * turbidity_component
    )

    return score * 100.0


def calculate_cycle_filter_health(
    cycle: TreatmentCycle,
) -> TreatmentCycle:
    """
    Calculate and store the Filter Health Score
    for a completed treatment cycle.
    """

    cycle.filter_health_score_pct = (
        calculate_filter_health_score(
            cycle.avg_flow_rate_l_min,
            cycle.turbidity_removal_efficiency,
        )
    )

    return cycle