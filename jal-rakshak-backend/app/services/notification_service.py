import base64
import importlib
import json
import os
from typing import Any
from urllib import parse, request
from urllib.error import HTTPError, URLError


try:
    load_dotenv = importlib.import_module("dotenv").load_dotenv
except ImportError:

    def load_dotenv(*args, **kwargs):
        return False


load_dotenv()


# ============================================================
# ENVIRONMENT HELPERS
# ============================================================

def _env(
    name: str,
    default: str = "",
) -> str:
    return os.getenv(
        name,
        default,
    ).strip()


def notifications_enabled() -> bool:
    return _env(
        "ALERT_NOTIFICATIONS_ENABLED",
        "false",
    ).lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def telegram_configured() -> bool:
    return bool(
        _env("TELEGRAM_BOT_TOKEN")
        and _env("TELEGRAM_CHAT_ID")
    )


def twilio_configured() -> bool:
    return bool(
        _env("TWILIO_ACCOUNT_SID")
        and _env("TWILIO_AUTH_TOKEN")
        and _env("TWILIO_FROM_NUMBER")
        and _env("ALERT_SMS_TO")
    )


# ============================================================
# NOTIFICATION STATUS
# ============================================================

def get_notification_status() -> dict[str, Any]:

    return {
        "enabled": notifications_enabled(),

        "telegram": {
            "configured": telegram_configured(),
            "chat_id_present": bool(
                _env("TELEGRAM_CHAT_ID")
            ),
        },

        "twilio": {
            "configured": twilio_configured(),
            "recipient_present": bool(
                _env("ALERT_SMS_TO")
            ),
        },
    }


# ============================================================
# TELEGRAM
# ============================================================

def send_telegram_message(
    message: str,
) -> dict[str, Any]:

    if not telegram_configured():

        return {
            "success": False,
            "channel": "telegram",
            "status": "NOT_CONFIGURED",
            "message": (
                "Telegram credentials are not configured."
            ),
        }

    token = _env(
        "TELEGRAM_BOT_TOKEN"
    )

    chat_id = _env(
        "TELEGRAM_CHAT_ID"
    )

    url = (
        "https://api.telegram.org/"
        f"bot{token}/sendMessage"
    )

    payload = json.dumps(
        {
            "chat_id": chat_id,
            "text": message,
        }
    ).encode("utf-8")

    req = request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:

        with request.urlopen(
            req,
            timeout=10,
        ) as response:

            body = json.loads(
                response.read().decode("utf-8")
            )

        return {
            "success": bool(
                body.get("ok")
            ),
            "channel": "telegram",
            "status": (
                "SENT"
                if body.get("ok")
                else "FAILED"
            ),
            "response": body,
        }

    except (
        HTTPError,
        URLError,
        TimeoutError,
        ValueError,
    ) as exc:

        return {
            "success": False,
            "channel": "telegram",
            "status": "FAILED",
            "message": str(exc),
        }


# ============================================================
# TWILIO SMS
# ============================================================

def send_twilio_sms(
    message: str,
) -> dict[str, Any]:

    if not twilio_configured():

        return {
            "success": False,
            "channel": "twilio",
            "status": "NOT_CONFIGURED",
            "message": (
                "Twilio credentials are not configured."
            ),
        }

    account_sid = _env(
        "TWILIO_ACCOUNT_SID"
    )

    auth_token = _env(
        "TWILIO_AUTH_TOKEN"
    )

    from_number = _env(
        "TWILIO_FROM_NUMBER"
    )

    to_number = _env(
        "ALERT_SMS_TO"
    )

    url = (
        "https://api.twilio.com/"
        "2010-04-01/"
        f"Accounts/{account_sid}/Messages.json"
    )

    # --------------------------------------------------------
    # TWILIO TRIAL MODE
    #
    # Trial accounts only accept predefined SMS templates.
    # "sms_internal_alerts" is the approved template.
    #
    # After upgrading Twilio, replace this with the actual
    # JAL-RAKSHAK alert message.
    # --------------------------------------------------------

    sms_body = "sms_internal_alerts"

    body = parse.urlencode(
        {
            "To": to_number,
            "From": from_number,
            "Body": sms_body,
        }
    ).encode("utf-8")

    credentials = base64.b64encode(
        f"{account_sid}:{auth_token}".encode(
            "utf-8"
        )
    ).decode("ascii")

    req = request.Request(
        url,
        data=body,
        headers={
            "Content-Type": (
                "application/x-www-form-urlencoded"
            ),
            "Authorization": (
                f"Basic {credentials}"
            ),
        },
        method="POST",
    )

    try:

        with request.urlopen(
            req,
            timeout=10,
        ) as response:

            raw = response.read().decode(
                "utf-8"
            )

            response_body = (
                json.loads(raw)
                if raw
                else {}
            )

        return {
            "success": True,
            "channel": "twilio",
            "status": "SENT",
            "sid": response_body.get("sid"),
            "response": response_body,
        }

    except HTTPError as exc:

        error_body = ""

        try:
            error_body = exc.read().decode(
                "utf-8"
            )
        except Exception:
            pass

        return {
            "success": False,
            "channel": "twilio",
            "status": "FAILED",
            "message": (
                f"HTTP Error {exc.code}: "
                f"{error_body or str(exc)}"
            ),
        }

    except (
        URLError,
        TimeoutError,
        ValueError,
    ) as exc:

        return {
            "success": False,
            "channel": "twilio",
            "status": "FAILED",
            "message": str(exc),
        }


# ============================================================
# COMMON NOTIFICATION DISPATCHER
# ============================================================

def dispatch_notification(
    title: str,
    message: str,
    severity: str = "WARNING",
) -> dict[str, Any]:

    formatted_message = (
        "JAL-RAKSHAK ALERT\n"
        f"[{severity}] {title}\n\n"
        f"{message}"
    )

    # --------------------------------------------------------
    # NOTIFICATIONS DISABLED
    # --------------------------------------------------------

    if not notifications_enabled():

        return {
            "enabled": False,

            "telegram": {
                "success": False,
                "status": "DISABLED",
            },

            "twilio": {
                "success": False,
                "status": "DISABLED",
            },
        }

    # --------------------------------------------------------
    # SEND THROUGH BOTH CHANNELS
    # --------------------------------------------------------

    telegram_result = (
        send_telegram_message(
            formatted_message
        )
    )

    twilio_result = (
        send_twilio_sms(
            formatted_message
        )
    )

    return {
        "enabled": True,
        "telegram": telegram_result,
        "twilio": twilio_result,
    }


# ============================================================
# CYCLE ALERT
# ============================================================

def send_cycle_alert(
    cycle_number: int,
    action: str,
    tds_efficiency: float | None,
    improvement: float | None,
) -> dict[str, Any] | None:

    # Only these decisions require an alert.
    if action not in {
        "OPTIMIZE",
        "HOLD",
    }:
        return None

    # --------------------------------------------------------
    # HOLD
    # --------------------------------------------------------

    if action == "HOLD":

        severity = "CRITICAL"

        title = (
            f"Cycle {cycle_number}: "
            "Treatment HOLD"
        )

        reason = (
            "TDS removal efficiency decreased "
            "compared with the previous "
            "completed cycle."
        )

    # --------------------------------------------------------
    # OPTIMIZE
    # --------------------------------------------------------

    else:

        severity = "WARNING"

        title = (
            f"Cycle {cycle_number}: "
            "Treatment OPTIMIZE"
        )

        reason = (
            "Efficiency improvement is at or "
            "below the backend optimization "
            "threshold."
        )

    # --------------------------------------------------------
    # ALERT DETAILS
    # --------------------------------------------------------

    if (
        tds_efficiency is not None
        and improvement is not None
    ):

        details = (
            f"{reason}\n"
            f"TDS removal efficiency: "
            f"{tds_efficiency:.2f}%\n"
            f"Cycle-to-cycle improvement: "
            f"{improvement:.2f} "
            "percentage points."
        )

    else:

        details = reason

    return dispatch_notification(
        title=title,
        message=details,
        severity=severity,
    )


# ============================================================
# WATER QUALITY ALERT
# ============================================================

def send_quality_alert(
    device_id: str,
    ph: float,
    tds: float,
    turbidity: float,
) -> dict[str, Any] | None:

    critical_reasons: list[str] = []

    # --------------------------------------------------------
    # pH
    # --------------------------------------------------------

    if ph < 5.5 or ph > 9.0:

        critical_reasons.append(
            f"pH={ph:.2f}"
        )

    # --------------------------------------------------------
    # TDS
    # --------------------------------------------------------

    if tds > 1000:

        critical_reasons.append(
            f"TDS={tds:.0f} ppm"
        )

    # --------------------------------------------------------
    # TURBIDITY
    # --------------------------------------------------------

    if turbidity > 10:

        critical_reasons.append(
            f"Turbidity={turbidity:.2f} NTU"
        )

    # --------------------------------------------------------
    # NO CRITICAL CONDITION
    # --------------------------------------------------------

    if not critical_reasons:

        return None

    # --------------------------------------------------------
    # CRITICAL QUALITY ALERT
    # --------------------------------------------------------

    return dispatch_notification(
        title="Critical treated-water quality",

        message=(
            f"Device: {device_id}\n"
            "Point B exceeded a prototype "
            "critical limit: "
            f"{', '.join(critical_reasons)}.\n"
            "Keep the output isolated until "
            "the condition is verified."
        ),

        severity="CRITICAL",
    )


# ============================================================
# TEST NOTIFICATIONS
# ============================================================

def send_test_notifications() -> dict[str, Any]:

    return dispatch_notification(
        title="Notification integration test",

        message=(
            "This is a JAL-RAKSHAK test alert. "
            "If you received this message, the "
            "notification channel is connected "
            "correctly."
        ),

        severity="INFO",
    )