from sqlalchemy.orm import Session

from app.models.command import DeviceCommand


# ============================================================
# VALID TANK COMMANDS
# ============================================================

VALID_TANK_COMMANDS = {
    "OPEN_S2",
    "OPEN_S3",
}


# ============================================================
# GET EXISTING COMMAND
# ============================================================

def get_existing_command(
    db: Session,
    device_id: str,
    command: str,
    cycle_number: int | None,
) -> DeviceCommand | None:

    query = (
        db.query(DeviceCommand)
        .filter(
            DeviceCommand.device_id == device_id,
            DeviceCommand.command == command,
        )
    )

    if cycle_number is not None:

        query = query.filter(
            DeviceCommand.cycle_number
            == cycle_number
        )

    return (
        query
        .order_by(
            DeviceCommand.id.desc()
        )
        .first()
    )


# ============================================================
# CREATE TANK COMMAND
# ============================================================

def create_tank_command(
    db: Session,
    device_id: str,
    action: str,
    cycle_number: int | None,
) -> DeviceCommand | None:

    # --------------------------------------------------------
    # Only actual tank-opening commands are created.
    # HOLD remains a backend decision for now.
    # --------------------------------------------------------

    if action not in VALID_TANK_COMMANDS:
        return None

    # --------------------------------------------------------
    # Prevent duplicate command for the same
    # device + cycle + action.
    # --------------------------------------------------------

    existing_command = get_existing_command(
        db=db,
        device_id=device_id,
        command=action,
        cycle_number=cycle_number,
    )

    if existing_command is not None:

        return existing_command

    # --------------------------------------------------------
    # Create new pending command.
    # --------------------------------------------------------

    command = DeviceCommand(
        device_id=device_id,
        command=action,
        status="PENDING",
        cycle_number=cycle_number,
    )

    db.add(command)

    db.flush()

    return command


# ============================================================
# GET NEXT PENDING COMMAND
# ============================================================

def get_next_pending_command(
    db: Session,
    device_id: str,
) -> DeviceCommand | None:

    return (
        db.query(DeviceCommand)
        .filter(
            DeviceCommand.device_id == device_id,
            DeviceCommand.status == "PENDING",
        )
        .order_by(
            DeviceCommand.id.asc()
        )
        .first()
    )


# ============================================================
# ACKNOWLEDGE COMMAND
# ============================================================

def acknowledge_command(
    db: Session,
    command: DeviceCommand,
    status: str,
) -> DeviceCommand:

    command.status = status

    if status == "EXECUTED":
        from datetime import datetime

        command.executed_at = datetime.utcnow()

    db.flush()

    return command