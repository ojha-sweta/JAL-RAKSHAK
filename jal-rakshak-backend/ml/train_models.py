from pathlib import Path
import json

import joblib
import pandas as pd

from catboost import CatBoostClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = Path(r"C:\Users\user\OneDrive\Desktop\JAL-RAKSHAK\JAL_RAKSHAK_8000_Final_FilterHealth_WaterQuality_Dataset_60_40.csv")
MODEL_DIR = BASE_DIR / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# FEATURES
# ============================================================

FILTER_HEALTH_FEATURES = [
    "Raw_TDS_ppm",
    "Raw_Turbidity_NTU",
    "Raw_Temperature_C",
    "Treated_TDS_ppm",
    "Treated_Turbidity_NTU",
    "Treated_pH",
    "Treated_Temperature_C",
    "Flow_Rate_L_min",
    "TDS_Removal_Efficiency_pct",
    "Turbidity_Removal_Efficiency_pct",
    "Temperature_Difference_C",
    "Previous_TDS_Efficiency_pct",
    "Efficiency_Improvement_pp",
    "Rolling_3Cycle_Avg_Efficiency_pct",
    "Efficiency_Trend_pct",
    "Previous_Turbidity_Efficiency_pct",
    "Rolling_3Cycle_Avg_Turbidity_Efficiency_pct",
    "Cycle_Number",
]


WATER_QUALITY_FEATURES = [
    "Raw_TDS_ppm",
    "Raw_Turbidity_NTU",
    "Raw_Temperature_C",
    "Treated_TDS_ppm",
    "Treated_Turbidity_NTU",
    "Treated_pH",
    "Treated_Temperature_C",
    "TDS_Removal_Efficiency_pct",
    "Turbidity_Removal_Efficiency_pct",
    "Temperature_Difference_C",
]


# ============================================================
# LOAD DATASET
# ============================================================

print("=" * 70)
print("JAL-RAKSHAK ML MODEL TRAINING")
print("=" * 70)

print("\nLoading dataset...")

df = pd.read_csv(DATASET_PATH)

print(f"Dataset shape: {df.shape}")
print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = (
    FILTER_HEALTH_FEATURES
    + WATER_QUALITY_FEATURES
    + [
        "Filter_Health",
        "Water_Quality_Class",
        "ML_Split",
    ]
)

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Missing columns in dataset:\n{missing_columns}"
    )

print("\nAll required columns found.")


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

train_df = df[df["ML_Split"] == "TRAIN"].copy()
test_df = df[df["ML_Split"] == "TEST"].copy()

print("\nDataset split:")
print(f"Training rows: {len(train_df)}")
print(f"Testing rows : {len(test_df)}")


# ============================================================
# FILTER HEALTH MODEL
# ============================================================

print("\n" + "=" * 70)
print("TRAINING FILTER HEALTH MODEL")
print("=" * 70)

X_train_filter = train_df[FILTER_HEALTH_FEATURES]
y_train_filter = train_df["Filter_Health"]

X_test_filter = test_df[FILTER_HEALTH_FEATURES]
y_test_filter = test_df["Filter_Health"]


print("\nFilter Health class distribution:")
print(y_train_filter.value_counts())


filter_model = CatBoostClassifier(
    iterations=500,
    depth=6,
    learning_rate=0.05,
    loss_function="MultiClass",
    eval_metric="Accuracy",
    random_seed=42,
    verbose=100,
)


filter_model.fit(
    X_train_filter,
    y_train_filter,
    eval_set=(X_test_filter, y_test_filter),
    use_best_model=True,
)


filter_predictions = filter_model.predict(X_test_filter)
filter_predictions = filter_predictions.ravel()

filter_accuracy = accuracy_score(
    y_test_filter,
    filter_predictions,
)

print("\nFilter Health Accuracy:")
print(f"{filter_accuracy * 100:.2f}%")

print("\nFilter Health Classification Report:")
print(
    classification_report(
        y_test_filter,
        filter_predictions,
        digits=4,
    )
)

print("\nFilter Health Confusion Matrix:")
print(
    confusion_matrix(
        y_test_filter,
        filter_predictions,
    )
)


# ============================================================
# WATER QUALITY MODEL
# ============================================================

print("\n" + "=" * 70)
print("TRAINING WATER QUALITY MODEL")
print("=" * 70)

X_train_water = train_df[WATER_QUALITY_FEATURES]
y_train_water = train_df["Water_Quality_Class"]

X_test_water = test_df[WATER_QUALITY_FEATURES]
y_test_water = test_df["Water_Quality_Class"]


print("\nWater Quality class distribution:")
print(y_train_water.value_counts())


water_model = CatBoostClassifier(
    iterations=500,
    depth=6,
    learning_rate=0.05,
    loss_function="MultiClass",
    eval_metric="Accuracy",
    random_seed=42,
    verbose=100,
)


water_model.fit(
    X_train_water,
    y_train_water,
    eval_set=(X_test_water, y_test_water),
    use_best_model=True,
)


water_predictions = water_model.predict(X_test_water)
water_predictions = water_predictions.ravel()

water_accuracy = accuracy_score(
    y_test_water,
    water_predictions,
)

print("\nWater Quality Accuracy:")
print(f"{water_accuracy * 100:.2f}%")

print("\nWater Quality Classification Report:")
print(
    classification_report(
        y_test_water,
        water_predictions,
        digits=4,
    )
)

print("\nWater Quality Confusion Matrix:")
print(
    confusion_matrix(
        y_test_water,
        water_predictions,
    )
)


# ============================================================
# SAVE MODELS
# ============================================================

print("\n" + "=" * 70)
print("SAVING MODELS")
print("=" * 70)


filter_model_path = MODEL_DIR / "filter_health_model.cbm"
water_model_path = MODEL_DIR / "water_quality_model.cbm"


filter_model.save_model(str(filter_model_path))
water_model.save_model(str(water_model_path))


# ============================================================
# SAVE FEATURE LIST
# ============================================================

feature_lists = {
    "filter_health_features": FILTER_HEALTH_FEATURES,
    "water_quality_features": WATER_QUALITY_FEATURES,
}


feature_path = MODEL_DIR / "feature_lists.json"

with open(feature_path, "w", encoding="utf-8") as file:
    json.dump(
        feature_lists,
        file,
        indent=4,
    )


# ============================================================
# SAVE MODEL METADATA
# ============================================================

metadata = {
    "dataset": DATASET_PATH.name,
    "training_rows": len(train_df),
    "testing_rows": len(test_df),
    "filter_health_accuracy": float(filter_accuracy),
    "water_quality_accuracy": float(water_accuracy),
    "filter_health_classes": [
        "HEALTHY",
        "MODERATE",
        "UNHEALTHY",
    ],
    "water_quality_classes": [
        "SAFE",
        "WARNING",
        "CRITICAL",
    ],
    "model": "CatBoostClassifier",
}


metadata_path = MODEL_DIR / "model_metadata.json"

with open(metadata_path, "w", encoding="utf-8") as file:
    json.dump(
        metadata,
        file,
        indent=4,
    )


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

filter_importance = pd.DataFrame(
    {
        "Feature": FILTER_HEALTH_FEATURES,
        "Importance": filter_model.get_feature_importance(),
    }
).sort_values(
    "Importance",
    ascending=False,
)


water_importance = pd.DataFrame(
    {
        "Feature": WATER_QUALITY_FEATURES,
        "Importance": water_model.get_feature_importance(),
    }
).sort_values(
    "Importance",
    ascending=False,
)


filter_importance.to_csv(
    MODEL_DIR / "filter_health_feature_importance.csv",
    index=False,
)

water_importance.to_csv(
    MODEL_DIR / "water_quality_feature_importance.csv",
    index=False,
)


# ============================================================
# FINAL OUTPUT
# ============================================================

print("\n" + "=" * 70)
print("TRAINING COMPLETE")
print("=" * 70)

print("\nModels saved:")

print(f"1. {filter_model_path}")
print(f"2. {water_model_path}")

print("\nSupporting files saved:")

print(f"3. {feature_path}")
print(f"4. {metadata_path}")

print("\nFilter Health Accuracy:")
print(f"{filter_accuracy * 100:.2f}%")

print("\nWater Quality Accuracy:")
print(f"{water_accuracy * 100:.2f}%")

print("\nTop Filter Health Features:")
print(filter_importance.head(10).to_string(index=False))

print("\nTop Water Quality Features:")
print(water_importance.head(10).to_string(index=False))

print("\nML training finished successfully.")