from typing import Any


# ============================================================
# S3 — PURIFIED TANK CONDITIONS
# ============================================================

def check_s3_conditions(
    ph: float,
    turbidity: float,
    tds: float,
    temperature: float,
) -> dict[str, bool]:

    ph_ok = (
        6.5 <= ph <= 8.5
    )

    turbidity_ok = (
        turbidity <= 5
    )

    tds_ok = (
        tds <= 500
    )

    temperature_ok = (
        0 <= temperature <= 40
    )

    return {
        "ph": ph_ok,
        "turbidity": turbidity_ok,
        "tds": tds_ok,
        "temperature": temperature_ok,
    }


# ============================================================
# S2 — RECYCLE TANK CONDITIONS
# ============================================================

def check_s2_conditions(
    ph: float,
    turbidity: float,
    tds: float,
    temperature: float,
) -> dict[str, bool]:

    ph_ok = (
        5 <= ph <= 6
        or
        9 <= ph <= 10
    )

    turbidity_ok = (
        30 < turbidity < 70
    )

    temperature_ok = (
        40 <= temperature <= 45
    )

    tds_ok = (
        1000 <= tds < 1500
    )

    return {
        "ph": ph_ok,
        "turbidity": turbidity_ok,
        "temperature": temperature_ok,
        "tds": tds_ok,
    }


# ============================================================
# COUNT SATISFIED CONDITIONS
# ============================================================

def count_satisfied_conditions(
    conditions: dict[str, bool],
) -> int:

    return sum(
        1
        for condition in conditions.values()
        if condition
    )


# ============================================================
# S3 — PURIFIED TANK DECISION
# ============================================================

def evaluate_s3(
    ph: float,
    turbidity: float,
    tds: float,
    temperature: float,
) -> dict[str, Any]:

    conditions = check_s3_conditions(
        ph=ph,
        turbidity=turbidity,
        tds=tds,
        temperature=temperature,
    )

    satisfied_count = (
        count_satisfied_conditions(
            conditions
        )
    )

    should_open = (
        satisfied_count >= 3
    )

    return {
        "tank": "S3",
        "tank_name": "Purified Tank",
        "should_open": should_open,
        "satisfied_conditions": satisfied_count,
        "required_conditions": 3,
        "total_conditions": 4,
        "conditions": conditions,
    }


# ============================================================
# S2 — RECYCLE TANK DECISION
# ============================================================

def evaluate_s2(
    ph: float,
    turbidity: float,
    tds: float,
    temperature: float,
) -> dict[str, Any]:

    conditions = check_s2_conditions(
        ph=ph,
        turbidity=turbidity,
        tds=tds,
        temperature=temperature,
    )

    satisfied_count = (
        count_satisfied_conditions(
            conditions
        )
    )

    should_open = (
        satisfied_count >= 3
    )

    return {
        "tank": "S2",
        "tank_name": "Recycle Tank",
        "should_open": should_open,
        "satisfied_conditions": satisfied_count,
        "required_conditions": 3,
        "total_conditions": 4,
        "conditions": conditions,
    }


# ============================================================
# COMPLETE TANK DECISION
# ============================================================

def evaluate_tank_control(
    ph: float,
    turbidity: float,
    tds: float,
    temperature: float,
) -> dict[str, Any]:

    s2 = evaluate_s2(
        ph=ph,
        turbidity=turbidity,
        tds=tds,
        temperature=temperature,
    )

    s3 = evaluate_s3(
        ph=ph,
        turbidity=turbidity,
        tds=tds,
        temperature=temperature,
    )

    # --------------------------------------------------------
    # Determine final tank action
    # --------------------------------------------------------

    if s3["should_open"]:

        selected_tank = "S3"

        action = "OPEN_S3"

    elif s2["should_open"]:

        selected_tank = "S2"

        action = "OPEN_S2"

    else:

        selected_tank = None

        action = "HOLD"

    return {

        "action": action,

        "selected_tank": selected_tank,

        "s2": s2,

        "s3": s3,
    }