import sqlite3


DB_PATH = "jal_rakshak.db"


columns = [
    (
        "ml_filter_health_prediction",
        "VARCHAR(30)"
    ),
    (
        "ml_filter_health_confidence",
        "FLOAT"
    ),
    (
        "ml_water_quality_prediction",
        "VARCHAR(30)"
    ),
    (
        "ml_water_quality_confidence",
        "FLOAT"
    ),
]


connection = sqlite3.connect(DB_PATH)
cursor = connection.cursor()


print("Checking treatment_cycles table...")


existing_columns = {
    row[1]
    for row in cursor.execute(
        "PRAGMA table_info(treatment_cycles)"
    ).fetchall()
}


for column_name, column_type in columns:

    if column_name in existing_columns:

        print(
            f"[EXISTS] {column_name}"
        )

    else:

        cursor.execute(
            f"""
            ALTER TABLE treatment_cycles
            ADD COLUMN {column_name} {column_type}
            """
        )

        print(
            f"[ADDED] {column_name}"
        )


connection.commit()
connection.close()


print("\nML database migration completed.")