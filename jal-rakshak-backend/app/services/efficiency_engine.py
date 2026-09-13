from app.models.cycle import TreatmentCycle


def calculate_removal_efficiency(
    input_value: float | None,
    output_value: float | None,
) -> float | None:
    """
    Calculate percentage removal efficiency.

    Formula:

        ((Input - Output) / Input) * 100

    Returns None when the input value is missing or zero.
    """

    if input_value is None or output_value is None:
        return None

    if input_value == 0:
        return None

    return (
        (input_value - output_value)
        / input_value
    ) * 100


def calculate_cycle_efficiency(
    cycle: TreatmentCycle,
) -> TreatmentCycle:
    """
    Calculate treatment efficiency for a completed cycle.

    Primary efficiency:
        TDS removal efficiency

    Supporting efficiency:
        Turbidity removal efficiency
    """

    cycle.tds_removal_efficiency = calculate_removal_efficiency(
        cycle.avg_point_a_tds,
        cycle.avg_point_b_tds,
    )

    cycle.turbidity_removal_efficiency = (
        calculate_removal_efficiency(
            cycle.avg_point_a_turbidity,
            cycle.avg_point_b_turbidity,
        )
    )

    return cycle