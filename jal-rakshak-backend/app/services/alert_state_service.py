from datetime import datetime

from sqlalchemy.orm import Session

from app.models.alert import AlertState


# ============================================================
# ALERT STATE
# ============================================================

def get_alert_state(
    db: Session,
    device_id: str,
    alert_key: str,
) -> AlertState | None:

    return (
        db.query(AlertState)
        .filter(
            AlertState.device_id == device_id,
            AlertState.alert_key == alert_key,
        )
        .first()
    )


# ============================================================
# ACTIVATE ALERT
# ============================================================

def activate_alert(
    db: Session,
    device_id: str,
    alert_key: str,
) -> tuple[AlertState, bool]:

    now = datetime.utcnow()

    state = get_alert_state(
        db,
        device_id,
        alert_key,
    )

    # --------------------------------------------------------
    # FIRST TIME THIS ALERT IS DETECTED
    # --------------------------------------------------------

    if state is None:

        state = AlertState(
            device_id=device_id,
            alert_key=alert_key,
            active=True,
            first_detected_at=now,
            last_notified_at=None,
        )

        db.add(state)
        db.flush()

        return state, True

    # --------------------------------------------------------
    # ALERT WAS PREVIOUSLY CLEARED
    # --------------------------------------------------------

    if not state.active:

        state.active = True
        state.first_detected_at = now
        state.last_notified_at = None

        db.flush()

        return state, True

    # --------------------------------------------------------
    # ALERT IS ALREADY ACTIVE
    # --------------------------------------------------------

    return state, False


# ============================================================
# MARK NOTIFIED
# ============================================================

def mark_alert_notified(
    db: Session,
    state: AlertState,
) -> None:

    state.last_notified_at = datetime.utcnow()

    db.flush()


# ============================================================
# CLEAR ALERT
# ============================================================

def clear_alert(
    db: Session,
    device_id: str,
    alert_key: str,
) -> None:

    state = get_alert_state(
        db,
        device_id,
        alert_key,
    )

    if state is None:
        return

    if state.active:

        state.active = False

        db.flush()


# ============================================================
# CHECK WHETHER ALERT SHOULD BE NOTIFIED
# ============================================================

def should_notify_alert(
    db: Session,
    device_id: str,
    alert_key: str,
) -> tuple[AlertState, bool]:

    return activate_alert(
        db,
        device_id,
        alert_key,
    )