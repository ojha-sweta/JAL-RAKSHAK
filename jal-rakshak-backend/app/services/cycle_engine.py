from datetime import datetime

from sqlalchemy.orm import Session

from app.models.telemetry import Telemetry
from app.models.cycle import TreatmentCycle

from app.services.efficiency_engine import (
    calculate_cycle_efficiency,
)

from app.services.improvement_engine import (
    calculate_cycle_improvement,
    evaluate_improvement_condition,
)

from app.services.filter_health_engine import (
    calculate_cycle_filter_health,
)

from app.services.decision_engine import (
    generate_decision,
)

from app.services.notification_service import (
    send_cycle_alert,
)

from app.services.alert_state_service import (
    should_notify_alert,
    mark_alert_notified,
)

from app.services.ml_service import (
    predict_jal_rakshak,
)


# ============================================================
# GET ACTIVE CYCLE
# ============================================================

def get_active_cycle(
    db: Session,
    device_id: str,
) -> TreatmentCycle | None:

    return (
        db.query(TreatmentCycle)
        .filter(
            TreatmentCycle.device_id == device_id,
            TreatmentCycle.status == "ACTIVE",
        )
        .order_by(
            TreatmentCycle.id.desc()
        )
        .first()
    )


# ============================================================
# GET NEXT CYCLE NUMBER
# ============================================================

def get_next_cycle_number(
    db: Session,
    device_id: str,
) -> int:

    latest_cycle = (
        db.query(TreatmentCycle)
        .filter(
            TreatmentCycle.device_id == device_id
        )
        .order_by(
            TreatmentCycle.cycle_number.desc()
        )
        .first()
    )

    if latest_cycle is None:
        return 1

    return latest_cycle.cycle_number + 1


# ============================================================
# CREATE NEW CYCLE
# ============================================================

def create_cycle(
    db: Session,
    telemetry: Telemetry,
) -> TreatmentCycle:

    cycle = TreatmentCycle(

        device_id=telemetry.device_id,

        cycle_number=get_next_cycle_number(
            db,
            telemetry.device_id,
        ),

        start_time=telemetry.timestamp,

        status="ACTIVE",

        reading_count=0,

        backend_action="NO_ACTION",

        improvement_condition=False,
    )

    db.add(cycle)

    db.flush()

    return cycle


# ============================================================
# UPDATE CYCLE STATISTICS
# ============================================================

def update_cycle_statistics(
    db: Session,
    cycle: TreatmentCycle,
    end_time: datetime | None = None,
) -> TreatmentCycle:

    query = (
        db.query(Telemetry)
        .filter(
            Telemetry.cycle_id == cycle.id,
            Telemetry.pump_status == True,
        )
    )

    # --------------------------------------------------------
    # When closing a cycle, exclude the pump-OFF reading.
    # --------------------------------------------------------

    if end_time is not None:

        query = query.filter(
            Telemetry.timestamp < end_time
        )

    telemetry_rows = (
        query
        .order_by(
            Telemetry.timestamp.asc()
        )
        .all()
    )

    # --------------------------------------------------------
    # No readings
    # --------------------------------------------------------

    if not telemetry_rows:

        cycle.reading_count = 0

        cycle.avg_flow_rate_l_min = None

        return cycle

    # --------------------------------------------------------
    # Reading count
    # --------------------------------------------------------

    cycle.reading_count = len(
        telemetry_rows
    )

    # ========================================================
    # POINT A AVERAGES
    # ========================================================

    cycle.avg_point_a_tds = (
        sum(
            row.point_a_tds
            for row in telemetry_rows
        )
        / len(telemetry_rows)
    )

    cycle.avg_point_a_turbidity = (
        sum(
            row.point_a_turbidity
            for row in telemetry_rows
        )
        / len(telemetry_rows)
    )

    cycle.avg_point_a_temperature = (
        sum(
            row.point_a_temperature
            for row in telemetry_rows
        )
        / len(telemetry_rows)
    )

    # ========================================================
    # POINT B AVERAGES
    # ========================================================

    cycle.avg_point_b_ph = (
        sum(
            row.point_b_ph
            for row in telemetry_rows
        )
        / len(telemetry_rows)
    )

    cycle.avg_point_b_tds = (
        sum(
            row.point_b_tds
            for row in telemetry_rows
        )
        / len(telemetry_rows)
    )

    cycle.avg_point_b_turbidity = (
        sum(
            row.point_b_turbidity
            for row in telemetry_rows
        )
        / len(telemetry_rows)
    )

    cycle.avg_point_b_temperature = (
        sum(
            row.point_b_temperature
            for row in telemetry_rows
        )
        / len(telemetry_rows)
    )

    # ========================================================
    # FLOW RATE AVERAGE
    # ========================================================

    valid_flow_readings = [
        row.flow_rate_l_min
        for row in telemetry_rows
        if row.flow_rate_l_min is not None
        and row.flow_rate_l_min > 0
    ]

    if valid_flow_readings:

        cycle.avg_flow_rate_l_min = (
            sum(valid_flow_readings)
            / len(valid_flow_readings)
        )

    else:

        cycle.avg_flow_rate_l_min = None

    return cycle


# ============================================================
# BUILD HISTORICAL ML FEATURES
# ============================================================

def build_ml_features(
    db: Session,
    cycle: TreatmentCycle,
) -> tuple[dict, dict]:

    # --------------------------------------------------------
    # Get previous completed cycles
    # --------------------------------------------------------

    previous_cycles = (
        db.query(TreatmentCycle)
        .filter(
            TreatmentCycle.device_id == cycle.device_id,
            TreatmentCycle.status == "COMPLETED",
            TreatmentCycle.id != cycle.id,
        )
        .order_by(
            TreatmentCycle.cycle_number.desc()
        )
        .limit(3)
        .all()
    )

    # --------------------------------------------------------
    # Most recent previous cycle
    # --------------------------------------------------------

    if previous_cycles:

        previous_cycle = previous_cycles[0]

        previous_tds_efficiency = (
            previous_cycle.tds_removal_efficiency
            if previous_cycle.tds_removal_efficiency is not None
            else 0.0
        )

        previous_turbidity_efficiency = (
            previous_cycle.turbidity_removal_efficiency
            if previous_cycle.turbidity_removal_efficiency is not None
            else 0.0
        )

    else:

        previous_tds_efficiency = 0.0
        previous_turbidity_efficiency = 0.0

    # --------------------------------------------------------
    # Historical TDS efficiencies
    # --------------------------------------------------------

    tds_efficiencies = [
        c.tds_removal_efficiency
        for c in previous_cycles
        if c.tds_removal_efficiency is not None
    ]

    # Include current cycle
    if cycle.tds_removal_efficiency is not None:
        tds_efficiencies.insert(
            0,
            cycle.tds_removal_efficiency,
        )

    # --------------------------------------------------------
    # Historical turbidity efficiencies
    # --------------------------------------------------------

    turbidity_efficiencies = [
        c.turbidity_removal_efficiency
        for c in previous_cycles
        if c.turbidity_removal_efficiency is not None
    ]

    # Include current cycle
    if cycle.turbidity_removal_efficiency is not None:
        turbidity_efficiencies.insert(
            0,
            cycle.turbidity_removal_efficiency,
        )

    # --------------------------------------------------------
    # Rolling 3-cycle TDS average
    # --------------------------------------------------------

    if tds_efficiencies:

        rolling_3cycle_avg_efficiency = (
            sum(tds_efficiencies[:3])
            / len(tds_efficiencies[:3])
        )

    else:

        rolling_3cycle_avg_efficiency = 0.0

    # --------------------------------------------------------
    # Rolling 3-cycle turbidity average
    # --------------------------------------------------------

    if turbidity_efficiencies:

        rolling_3cycle_avg_turbidity = (
            sum(turbidity_efficiencies[:3])
            / len(turbidity_efficiencies[:3])
        )

    else:

        rolling_3cycle_avg_turbidity = 0.0

    # --------------------------------------------------------
    # Efficiency improvement
    # --------------------------------------------------------

    if (
        cycle.tds_removal_efficiency is not None
        and previous_tds_efficiency is not None
    ):

        efficiency_improvement = (
            cycle.tds_removal_efficiency
            - previous_tds_efficiency
        )

    else:

        efficiency_improvement = 0.0

    # --------------------------------------------------------
    # Efficiency trend
    #
    # For deployment, use the latest cycle-to-previous
    # efficiency change as the trend signal.
    # --------------------------------------------------------

    efficiency_trend = efficiency_improvement

    # ========================================================
    # TEMPERATURE DIFFERENCE
    # ========================================================

    if (
        cycle.avg_point_a_temperature is not None
        and cycle.avg_point_b_temperature is not None
    ):

        temperature_difference = (
            cycle.avg_point_a_temperature
            - cycle.avg_point_b_temperature
        )

    else:

        temperature_difference = 0.0

    # ========================================================
    # COMMON FEATURES
    # ========================================================

    common_features = {

        "Raw_TDS_ppm": cycle.avg_point_a_tds,

        "Raw_Turbidity_NTU":
            cycle.avg_point_a_turbidity,

        "Raw_Temperature_C":
            cycle.avg_point_a_temperature,

        "Treated_TDS_ppm":
            cycle.avg_point_b_tds,

        "Treated_Turbidity_NTU":
            cycle.avg_point_b_turbidity,

        "Treated_pH":
            cycle.avg_point_b_ph,

        "Treated_Temperature_C":
            cycle.avg_point_b_temperature,

        "Flow_Rate_L_min":
            cycle.avg_flow_rate_l_min,

        "TDS_Removal_Efficiency_pct":
            cycle.tds_removal_efficiency,

        "Turbidity_Removal_Efficiency_pct":
            cycle.turbidity_removal_efficiency,

        "Temperature_Difference_C":
            temperature_difference,
    }

    # ========================================================
    # FILTER HEALTH FEATURES
    # ========================================================

    filter_features = {

        **common_features,

        "Previous_TDS_Efficiency_pct":
            previous_tds_efficiency,

        "Efficiency_Improvement_pp":
            efficiency_improvement,

        "Rolling_3Cycle_Avg_Efficiency_pct":
            rolling_3cycle_avg_efficiency,

        "Efficiency_Trend_pct":
            efficiency_trend,

        "Previous_Turbidity_Efficiency_pct":
            previous_turbidity_efficiency,

        "Rolling_3Cycle_Avg_Turbidity_Efficiency_pct":
            rolling_3cycle_avg_turbidity,

        "Cycle_Number":
            cycle.cycle_number,
    }

    # ========================================================
    # WATER QUALITY FEATURES
    # ========================================================

    water_features = common_features.copy()

    return filter_features, water_features


# ============================================================
# RUN ML PREDICTION
# ============================================================

def run_ml_prediction(
    db: Session,
    cycle: TreatmentCycle,
) -> TreatmentCycle:

    try:

        filter_features, water_features = (
            build_ml_features(
                db,
                cycle,
            )
        )

        result = predict_jal_rakshak(
            filter_features=filter_features,
            water_features=water_features,
        )

        # ----------------------------------------------------
        # Filter Health
        # ----------------------------------------------------

        filter_result = result.get(
            "filter_health",
            {}
        )

        cycle.ml_filter_health_prediction = (
            filter_result.get("prediction")
        )

        cycle.ml_filter_health_confidence = (
            filter_result.get("confidence")
        )

        # ----------------------------------------------------
        # Water Quality
        # ----------------------------------------------------

        water_result = result.get(
            "water_quality",
            {}
        )

        cycle.ml_water_quality_prediction = (
            water_result.get("prediction")
        )

        cycle.ml_water_quality_confidence = (
            water_result.get("confidence")
        )

        print(
            f"[ML] Cycle {cycle.cycle_number} | "
            f"Filter Health: "
            f"{cycle.ml_filter_health_prediction} "
            f"({cycle.ml_filter_health_confidence}%) | "
            f"Water Quality: "
            f"{cycle.ml_water_quality_prediction} "
            f"({cycle.ml_water_quality_confidence}%)"
        )

    except Exception as exc:

        # ----------------------------------------------------
        # ML failure must NOT stop the treatment cycle.
        # Deterministic backend control continues normally.
        # ----------------------------------------------------

        print(
            f"[ML ERROR] Cycle "
            f"{cycle.cycle_number}: {exc}"
        )

        cycle.ml_filter_health_prediction = None
        cycle.ml_filter_health_confidence = None

        cycle.ml_water_quality_prediction = None
        cycle.ml_water_quality_confidence = None

    return cycle


# ============================================================
# PROCESS TELEMETRY + CYCLE ENGINE
# ============================================================

def process_telemetry_cycle(
    db: Session,
    telemetry: Telemetry,
) -> TreatmentCycle:

    active_cycle = get_active_cycle(
        db,
        telemetry.device_id,
    )

    # ========================================================
    # PUMP ON
    # ========================================================

    if telemetry.pump_status:

        # ----------------------------------------------------
        # Start a new cycle if none is active
        # ----------------------------------------------------

        if active_cycle is None:

            active_cycle = create_cycle(
                db,
                telemetry,
            )

        # ----------------------------------------------------
        # Associate telemetry with active cycle
        # ----------------------------------------------------

        telemetry.cycle_id = (
            active_cycle.id
        )

        db.flush()

        # ----------------------------------------------------
        # Update running cycle statistics
        # ----------------------------------------------------

        update_cycle_statistics(
            db,
            active_cycle,
        )

        return active_cycle

    # ========================================================
    # PUMP OFF
    # ========================================================

    if active_cycle is None:

        # ----------------------------------------------------
        # No active cycle.
        # Return latest cycle if one exists.
        # ----------------------------------------------------

        latest_cycle = (
            db.query(TreatmentCycle)
            .filter(
                TreatmentCycle.device_id
                == telemetry.device_id
            )
            .order_by(
                TreatmentCycle.cycle_number.desc()
            )
            .first()
        )

        if latest_cycle is not None:

            return latest_cycle

        # ----------------------------------------------------
        # No cycle exists at all.
        # ----------------------------------------------------

        return create_cycle(
            db,
            telemetry,
        )

    # ========================================================
    # CLOSE ACTIVE CYCLE
    # ========================================================

    active_cycle.end_time = (
        telemetry.timestamp
    )

    active_cycle.status = "COMPLETED"

    # --------------------------------------------------------
    # Calculate final cycle averages.
    #
    # Pump-OFF telemetry itself is NOT included.
    # --------------------------------------------------------

    update_cycle_statistics(
        db,
        active_cycle,
        end_time=telemetry.timestamp,
    )

    # ========================================================
    # EFFICIENCY CALCULATION
    # ========================================================

    calculate_cycle_efficiency(
        active_cycle
    )

    # ========================================================
    # FILTER HEALTH CALCULATION
    # ========================================================

    calculate_cycle_filter_health(
        active_cycle
    )

    # ========================================================
    # CYCLE-TO-CYCLE IMPROVEMENT
    # ========================================================

    calculate_cycle_improvement(
        db,
        active_cycle,
    )

    # ========================================================
    # IMPROVEMENT CONDITION
    # ========================================================

    evaluate_improvement_condition(
        db,
        active_cycle,
    )

    # ========================================================
    # ML PREDICTION
    #
    # IMPORTANT:
    # ML runs AFTER all cycle-level measurements and
    # efficiency calculations are available.
    # ========================================================

    run_ml_prediction(
        db,
        active_cycle,
    )

    # ========================================================
    # COUNT COMPLETED CYCLES
    # ========================================================

    completed_cycle_count = (
        db.query(TreatmentCycle)
        .filter(
            TreatmentCycle.device_id
            == telemetry.device_id,

            TreatmentCycle.status
            == "COMPLETED",
        )
        .count()
    )

    # ========================================================
    # BACKEND DECISION
    # ========================================================

    generate_decision(
        active_cycle,
        completed_cycle_count,
    )

    # ========================================================
    # CYCLE ALERT WITH DEDUPLICATION
    # ========================================================

    if active_cycle.backend_action in {
        "OPTIMIZE",
        "HOLD",
    }:

        # ----------------------------------------------------
        # Unique alert key for this cycle + action
        # ----------------------------------------------------

        alert_key = (
            f"CYCLE_"
            f"{active_cycle.cycle_number}_"
            f"{active_cycle.backend_action}"
        )

        alert_state, should_send = (
            should_notify_alert(

                db=db,

                device_id=(
                    active_cycle.device_id
                ),

                alert_key=alert_key,
            )
        )

        # ----------------------------------------------------
        # Send only if this cycle/action alert
        # has not already been activated.
        # ----------------------------------------------------

        if should_send:

            cycle_alert = send_cycle_alert(

                cycle_number=(
                    active_cycle.cycle_number
                ),

                action=(
                    active_cycle.backend_action
                ),

                tds_efficiency=(
                    active_cycle.tds_removal_efficiency
                ),

                improvement=(
                    active_cycle.efficiency_improvement
                ),
            )

            # ------------------------------------------------
            # Check whether at least one notification channel
            # successfully delivered the alert.
            # ------------------------------------------------

            if cycle_alert:

                telegram_success = (
                    cycle_alert
                    .get("telegram", {})
                    .get("success", False)
                )

                twilio_success = (
                    cycle_alert
                    .get("twilio", {})
                    .get("success", False)
                )

                # --------------------------------------------
                # Mark as notified only after successful
                # delivery through at least one channel.
                # --------------------------------------------

                if (
                    telegram_success
                    or twilio_success
                ):

                    mark_alert_notified(
                        db,
                        alert_state,
                    )

    # ========================================================
    # RETURN COMPLETED CYCLE
    # ========================================================

    return active_cycle