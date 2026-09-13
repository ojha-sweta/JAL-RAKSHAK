from fastapi import APIRouter, Depends
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database.database import SessionLocal

from app.models.telemetry import Telemetry
from app.models.device import Device

from app.schemas.telemetry import TelemetryPayload

from app.services.cycle_engine import (
    process_telemetry_cycle,
)

from app.services.notification_service import (
    send_quality_alert,
)

from app.services.alert_state_service import (
    should_notify_alert,
    mark_alert_notified,
    clear_alert,
)

from app.services.tank_control_engine import (
    evaluate_tank_control,
)

from app.services.command_engine import (
    create_tank_command,
)


router = APIRouter()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# RECEIVE TELEMETRY
# ============================================================

@router.post("")
async def receive_telemetry(
    payload: TelemetryPayload,
    db: Session = Depends(get_db),
):

    # ========================================================
    # CREATE TELEMETRY OBJECT
    # ========================================================

    telemetry = Telemetry(

        device_id=payload.device_id,

        timestamp=payload.timestamp,

        # ----------------------------------------------------
        # POINT A
        # ----------------------------------------------------

        point_a_tds=payload.point_a.tds,

        point_a_turbidity=(
            payload.point_a.turbidity
        ),

        point_a_temperature=(
            payload.point_a.temperature
        ),

        # ----------------------------------------------------
        # POINT B
        # ----------------------------------------------------

        point_b_ph=payload.point_b.ph,

        point_b_tds=payload.point_b.tds,

        point_b_turbidity=(
            payload.point_b.turbidity
        ),

        point_b_temperature=(
            payload.point_b.temperature
        ),

        # ----------------------------------------------------
        # FLOW
        # ----------------------------------------------------

        flow_rate_l_min=payload.flow_rate,

        # ----------------------------------------------------
        # PUMP
        # ----------------------------------------------------

        pump_status=payload.pump_status,
    )

    db.add(telemetry)

    db.flush()


    # ========================================================
    # DEVICE REGISTRATION / UPDATE
    # ========================================================

    device = (
        db.query(Device)
        .filter(
            Device.device_id
            == payload.device_id
        )
        .first()
    )


    if device is None:

        device = Device(

            device_id=payload.device_id,

            status="ONLINE",

            wifi_connected=True,

            last_telemetry=payload.timestamp,
        )

        db.add(device)

    else:

        device.status = "ONLINE"

        device.wifi_connected = True

        device.last_telemetry = (
            payload.timestamp
        )


    # ========================================================
    # CYCLE ENGINE
    # ========================================================

    cycle = process_telemetry_cycle(
        db,
        telemetry,
    )


    # ========================================================
    # TANK CONTROL ENGINE
    #
    # Uses Point-B treated-water measurements.
    #
    # S3:
    #   3 out of 4 conditions → OPEN_S3
    #
    # S2:
    #   3 out of 4 conditions → OPEN_S2
    #
    # Otherwise → HOLD
    # ========================================================

    tank_control = evaluate_tank_control(

        ph=telemetry.point_b_ph,

        turbidity=telemetry.point_b_turbidity,

        tds=telemetry.point_b_tds,

        temperature=telemetry.point_b_temperature,
    )


    # ========================================================
    # CREATE TANK DEVICE COMMAND
    #
    # Only OPEN_S2 and OPEN_S3 create physical commands.
    #
    # HOLD does not create a command.
    #
    # Duplicate commands are prevented by command_engine.
    # ========================================================

    tank_command = create_tank_command(

        db=db,

        device_id=telemetry.device_id,

        action=tank_control["action"],

        cycle_number=cycle.cycle_number,
    )


    # ========================================================
    # WATER QUALITY ALERT
    # WITH ALERT DEDUPLICATION
    # ========================================================

    critical_quality = (

        telemetry.point_b_ph < 5.5

        or telemetry.point_b_ph > 9.0

        or telemetry.point_b_tds > 1000

        or telemetry.point_b_turbidity > 10

    )


    quality_alert = None


    # ========================================================
    # CRITICAL CONDITION DETECTED
    # ========================================================

    if critical_quality:

        alert_state, should_send = (
            should_notify_alert(

                db=db,

                device_id=(
                    telemetry.device_id
                ),

                alert_key=(
                    "QUALITY_CRITICAL"
                ),
            )
        )


        # ----------------------------------------------------
        # SEND ONLY FOR A NEW ALERT STATE
        # ----------------------------------------------------

        if should_send:

            quality_alert = (
                send_quality_alert(

                    device_id=(
                        telemetry.device_id
                    ),

                    ph=(
                        telemetry.point_b_ph
                    ),

                    tds=(
                        telemetry.point_b_tds
                    ),

                    turbidity=(
                        telemetry.point_b_turbidity
                    ),
                )
            )


            # ------------------------------------------------
            # CHECK NOTIFICATION DELIVERY
            # ------------------------------------------------

            if quality_alert:

                telegram_success = (

                    quality_alert
                    .get("telegram", {})
                    .get("success", False)
                )

                twilio_success = (

                    quality_alert
                    .get("twilio", {})
                    .get("success", False)
                )


                # --------------------------------------------
                # MARK AS NOTIFIED ONLY AFTER SUCCESS
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
    # QUALITY RETURNED TO NORMAL
    # ========================================================

    else:

        clear_alert(

            db=db,

            device_id=(
                telemetry.device_id
            ),

            alert_key=(
                "QUALITY_CRITICAL"
            ),
        )


    # ========================================================
    # COMMIT DATABASE
    # ========================================================

    db.commit()


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "success": True,

        "message": (
            "Telemetry stored successfully"
        ),

        "telemetry_id": telemetry.id,

        "device_id": (
            telemetry.device_id
        ),

        "timestamp": (
            telemetry.timestamp
        ),


        # ====================================================
        # DEVICE
        # ====================================================

        "device": {

            "status": (
                device.status
            ),

            "last_telemetry": (
                device.last_telemetry
            ),
        },


        # ====================================================
        # FLOW
        # ====================================================

        "flow_rate_l_min": (
            telemetry.flow_rate_l_min
        ),


        # ====================================================
        # WATER QUALITY ALERT
        # ====================================================

        "quality_alert": quality_alert,


        # ====================================================
        # TANK CONTROL
        # ====================================================

        "tank_control": {

            "action": (
                tank_control["action"]
            ),

            "selected_tank": (
                tank_control["selected_tank"]
            ),

            # ----------------------------------------------
            # S2
            # ----------------------------------------------

            "s2": {

                "tank": (
                    tank_control["s2"]["tank"]
                ),

                "tank_name": (
                    tank_control["s2"]["tank_name"]
                ),

                "should_open": (
                    tank_control["s2"]["should_open"]
                ),

                "satisfied_conditions": (
                    tank_control["s2"][
                        "satisfied_conditions"
                    ]
                ),

                "required_conditions": (
                    tank_control["s2"][
                        "required_conditions"
                    ]
                ),

                "total_conditions": (
                    tank_control["s2"][
                        "total_conditions"
                    ]
                ),

                "conditions": (
                    tank_control["s2"]["conditions"]
                ),
            },


            # ----------------------------------------------
            # S3
            # ----------------------------------------------

            "s3": {

                "tank": (
                    tank_control["s3"]["tank"]
                ),

                "tank_name": (
                    tank_control["s3"]["tank_name"]
                ),

                "should_open": (
                    tank_control["s3"]["should_open"]
                ),

                "satisfied_conditions": (
                    tank_control["s3"][
                        "satisfied_conditions"
                    ]
                ),

                "required_conditions": (
                    tank_control["s3"][
                        "required_conditions"
                    ]
                ),

                "total_conditions": (
                    tank_control["s3"][
                        "total_conditions"
                    ]
                ),

                "conditions": (
                    tank_control["s3"]["conditions"]
                ),
            },
        },


        # ====================================================
        # TANK DEVICE COMMAND
        # ====================================================

        "tank_command": (

            {

                "id": tank_command.id,

                "command": tank_command.command,

                "status": tank_command.status,

                "cycle_number": (
                    tank_command.cycle_number
                ),

            }

            if tank_command is not None

            else None
        ),


        # ====================================================
        # CYCLE
        # ====================================================

        "cycle": {

            "cycle_number": (
                cycle.cycle_number
            ),

            "status": (
                cycle.status
            ),

            "reading_count": (
                cycle.reading_count
            ),

            "tds_removal_efficiency": (
                cycle.tds_removal_efficiency
            ),

            "turbidity_removal_efficiency": (
                cycle.turbidity_removal_efficiency
            ),

            "filter_health_score_pct": (
                cycle.filter_health_score_pct
            ),

            "efficiency_improvement": (
                cycle.efficiency_improvement
            ),

            "improvement_condition": (
                cycle.improvement_condition
            ),

            "backend_action": (
                cycle.backend_action
            ),
        },
    }


# ============================================================
# GET LATEST TELEMETRY
# ============================================================

@router.get("/latest")
async def get_latest_telemetry(
    db: Session = Depends(get_db),
):

    telemetry = (

        db.query(Telemetry)

        .order_by(
            desc(Telemetry.timestamp)
        )

        .first()
    )


    # ========================================================
    # NO DATA
    # ========================================================

    if telemetry is None:

        return {

            "success": False,

            "message": (
                "No telemetry data available"
            ),
        }


    # ========================================================
    # RETURN LATEST DATA
    # ========================================================

    return {

        "success": True,

        "data": {

            "id": telemetry.id,

            "device_id": (
                telemetry.device_id
            ),

            "timestamp": (
                telemetry.timestamp
            ),


            # ------------------------------------------------
            # POINT A
            # ------------------------------------------------

            "point_a": {

                "tds": (
                    telemetry.point_a_tds
                ),

                "turbidity": (
                    telemetry.point_a_turbidity
                ),

                "temperature": (
                    telemetry.point_a_temperature
                ),
            },


            # ------------------------------------------------
            # POINT B
            # ------------------------------------------------

            "point_b": {

                "ph": (
                    telemetry.point_b_ph
                ),

                "tds": (
                    telemetry.point_b_tds
                ),

                "turbidity": (
                    telemetry.point_b_turbidity
                ),

                "temperature": (
                    telemetry.point_b_temperature
                ),
            },


            # ------------------------------------------------
            # FLOW
            # ------------------------------------------------

            "flow_rate_l_min": (
                telemetry.flow_rate_l_min
            ),


            # ------------------------------------------------
            # PUMP
            # ------------------------------------------------

            "pump_status": (
                telemetry.pump_status
            ),
        },
    }