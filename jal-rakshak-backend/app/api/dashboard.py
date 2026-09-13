from fastapi import APIRouter, Depends
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.telemetry import get_db
from app.models.telemetry import Telemetry
from app.models.cycle import TreatmentCycle


router = APIRouter()


@router.get("")
async def get_dashboard(
    db: Session = Depends(get_db),
):
    """
    Return the complete JAL-RAKSHAK dashboard state.

    The dashboard receives:
        - latest live telemetry
        - current treatment cycle
        - previous cycle efficiency
        - efficiency improvement
        - improvement condition
        - backend treatment decision
    """

    # ---------------------------------------------------------
    # 1. Latest telemetry
    # ---------------------------------------------------------

    telemetry = (
        db.query(Telemetry)
        .order_by(desc(Telemetry.timestamp))
        .first()
    )

    if telemetry is None:
        return {
            "success": False,
            "message": "No telemetry available",
            "data": None,
        }

    # ---------------------------------------------------------
    # 2. Latest cycle
    # ---------------------------------------------------------

    latest_cycle = (
        db.query(TreatmentCycle)
        .filter(
            TreatmentCycle.device_id
            == telemetry.device_id
        )
        .order_by(
            desc(TreatmentCycle.cycle_number)
        )
        .first()
    )

    # ---------------------------------------------------------
    # 3. Previous completed cycle
    # ---------------------------------------------------------

    previous_cycle = None

    if latest_cycle is not None:

        previous_cycle = (
            db.query(TreatmentCycle)
            .filter(
                TreatmentCycle.device_id
                == telemetry.device_id,

                TreatmentCycle.status
                == "COMPLETED",

                TreatmentCycle.cycle_number
                < latest_cycle.cycle_number,
            )
            .order_by(
                desc(TreatmentCycle.cycle_number)
            )
            .first()
        )

    # ---------------------------------------------------------
    # 4. Completed cycle count
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # 5. Current cycle information
    # ---------------------------------------------------------

    if latest_cycle is None:

        cycle_data = {
            "cycle_number": None,
            "cycle_status": "IDLE",
            "reading_count": 0,

            "current_efficiency": None,
            "previous_cycle_efficiency": None,

            "efficiency_improvement": None,

            "max_cycle": 0,

            "improvement_condition": False,

            "backend_action": "NO_ACTION",
        }

    else:

        cycle_data = {
            "cycle_number":
                latest_cycle.cycle_number,

            "cycle_status":
                latest_cycle.status,

            "reading_count":
                latest_cycle.reading_count,

            # Primary treatment efficiency
            "current_efficiency":
                latest_cycle.tds_removal_efficiency,

            # Previous completed cycle
            "previous_cycle_efficiency":
                (
                    previous_cycle.tds_removal_efficiency
                    if previous_cycle is not None
                    else None
                ),

            # Backend-calculated improvement
            "efficiency_improvement":
                latest_cycle.efficiency_improvement,

            # Latest cycle number
            "max_cycle":
                latest_cycle.cycle_number,

            # Backend condition
            "improvement_condition":
                latest_cycle.improvement_condition,

            # Backend decision
            "backend_action":
                latest_cycle.backend_action,
        }

    # ---------------------------------------------------------
    # 6. System status
    # ---------------------------------------------------------

    pump_running = telemetry.pump_status

    # ---------------------------------------------------------
    # 7. Final dashboard response
    # ---------------------------------------------------------

    return {
        "success": True,

        "data": {

            # =================================================
            # Point A — Raw Water
            # =================================================

            "point_a": {

                "tds": {
                    "value": telemetry.point_a_tds,
                    "unit": "ppm",
                },

                "turbidity": {
                    "value": telemetry.point_a_turbidity,
                    "unit": "NTU",
                },

                "temperature": {
                    "value":
                        telemetry.point_a_temperature,
                    "unit": "°C",
                },
            },

            # =================================================
            # Point B — Treated Water
            # =================================================

            "point_b": {

                "ph": {
                    "value": telemetry.point_b_ph,
                    "unit": "pH",
                },

                "tds": {
                    "value": telemetry.point_b_tds,
                    "unit": "ppm",
                },

                "turbidity": {
                    "value":
                        telemetry.point_b_turbidity,
                    "unit": "NTU",
                },

                "temperature": {
                    "value":
                        telemetry.point_b_temperature,
                    "unit": "°C",
                },
            },

            # =================================================
            # System
            # =================================================

            "system": {

                "system_status": "ONLINE",

                "esp32_connection": "CONNECTED",

                "backend_connection": "CONNECTED",

                "treatment_status":
                    (
                        "RUNNING"
                        if pump_running
                        else "IDLE"
                    ),

                "pump_status": pump_running,

                "last_updated":
                    telemetry.timestamp,
            },

            # =================================================
            # Telemetry metadata
            # =================================================

            "telemetry": {

                "device_id":
                    telemetry.device_id,

                "timestamp":
                    telemetry.timestamp,
            },

            # =================================================
            # Cycle intelligence
            # =================================================

            "cycle": cycle_data,

            # =================================================
            # Additional summary
            # =================================================

            "summary": {

                "completed_cycles":
                    completed_cycle_count,

                "latest_cycle":
                    (
                        latest_cycle.cycle_number
                        if latest_cycle is not None
                        else None
                    ),

                "treatment_efficiency":
                    (
                        latest_cycle.tds_removal_efficiency
                        if latest_cycle is not None
                        else None
                    ),

                "backend_action":
                    (
                        latest_cycle.backend_action
                        if latest_cycle is not None
                        else "NO_ACTION"
                    ),
            },
        },
    }