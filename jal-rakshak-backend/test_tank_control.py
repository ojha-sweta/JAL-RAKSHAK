from app.services.tank_control_engine import (
    evaluate_tank_control,
)


def test_case(
    name,
    ph,
    turbidity,
    tds,
    temperature,
):
    result = evaluate_tank_control(
        ph=ph,
        turbidity=turbidity,
        tds=tds,
        temperature=temperature,
    )

    print("\n" + "=" * 60)
    print(name)
    print("=" * 60)

    print(f"pH          : {ph}")
    print(f"Turbidity   : {turbidity} NTU")
    print(f"TDS         : {tds} mg/L")
    print(f"Temperature : {temperature} °C")

    print("\nS2 - Recycle Tank")
    print(
        "Conditions:",
        result["s2"]["conditions"]
    )
    print(
        "Satisfied:",
        result["s2"]["satisfied_conditions"],
        "/ 4"
    )
    print(
        "Should Open:",
        result["s2"]["should_open"]
    )

    print("\nS3 - Purified Tank")
    print(
        "Conditions:",
        result["s3"]["conditions"]
    )
    print(
        "Satisfied:",
        result["s3"]["satisfied_conditions"],
        "/ 4"
    )
    print(
        "Should Open:",
        result["s3"]["should_open"]
    )

    print("\nFINAL ACTION:")
    print(result["action"])

    print("SELECTED TANK:")
    print(result["selected_tank"])


# ============================================================
# TEST 1 — S3: 4/4
# ============================================================

test_case(
    "TEST 1 — S3 should OPEN (4/4)",
    ph=7.2,
    turbidity=3,
    tds=400,
    temperature=25,
)


# ============================================================
# TEST 2 — S3: exactly 3/4
# ============================================================

test_case(
    "TEST 2 — S3 should OPEN (3/4)",
    ph=7.2,
    turbidity=3,
    tds=600,
    temperature=25,
)


# ============================================================
# TEST 3 — S3: only 2/4
# ============================================================

test_case(
    "TEST 3 — S3 should NOT OPEN (2/4)",
    ph=7.2,
    turbidity=8,
    tds=600,
    temperature=25,
)


# ============================================================
# TEST 4 — S2: exactly 3/4
# ============================================================

test_case(
    "TEST 4 — S2 should OPEN (3/4)",
    ph=5.5,
    turbidity=50,
    tds=1200,
    temperature=30,
)