"""
Smart Career Advisor - ML Model Training Script
Trains SVM and Random Forest classifiers on normalized job dataset
Normalizes 44 job titles to 8 fixed required roles
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.svm import LinearSVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import joblib
import json
import os
from datetime import datetime

# ===== LABEL NORMALIZATION MAPPING =====
# Map all 44 raw roles to 8 fixed required roles
ROLE_MAPPING = {
    # Full Stack Developer
    'Full Stack Developer': 'Full Stack Developer',
    'Software Engineer': 'Full Stack Developer',
    'Web Developer': 'Full Stack Developer',

    # DevOps Engineer
    'DevOps Engineer': 'DevOps Engineer',
    'DevSecOps Engineer': 'DevOps Engineer',
    'Site Reliability Engineer': 'DevOps Engineer',
    'Systems Administrator': 'DevOps Engineer',
    'Infrastructure Engineer': 'DevOps Engineer',

    # Data Scientist
    'Data Scientist': 'Data Scientist',
    'Machine Learning Engineer': 'Data Scientist',
    'NLP Engineer': 'Data Scientist',
    'Data Engineer': 'Data Scientist',
    'Data Analyst': 'Data Scientist',

    # Cloud Engineer
    'Cloud Architect': 'Cloud Engineer',
    'Platform Engineer': 'Cloud Engineer',
    'Solutions Architect': 'Cloud Engineer',

    # AI/ML Engineer
    'Research Engineer': 'AI/ML Engineer',
    'Robotics Engineer': 'AI/ML Engineer',
    'Computer Vision Engineer': 'AI/ML Engineer',

    # Network Engineer
    'Network Engineer': 'Network Engineer',
    'Security Engineer': 'Network Engineer',

    # RF Engineer (FPGA, Hardware, Embedded Systems)
    'FPGA Engineer': 'RF Engineer',
    'Hardware Engineer': 'RF Engineer',
    'Embedded Systems Engineer': 'RF Engineer',
    'Firmware Engineer': 'RF Engineer',

    # Field Engineer (bridge roles - Systems, Technical, Project)
    'Systems Engineer': 'Field Engineer',
    'Technical Lead': 'Field Engineer',
    'Project Manager': 'Field Engineer',
    'Technical Writer': 'Field Engineer',
    'Engineering Manager': 'Field Engineer',

    # Other roles - map to closest match
    'API Developer': 'Full Stack Developer',
    'Backend Developer': 'Full Stack Developer',
    'Frontend Developer': 'Full Stack Developer',
    'Android Developer': 'Full Stack Developer',
    'iOS Developer': 'Full Stack Developer',
    'Mobile Developer': 'Full Stack Developer',
    'Database Administrator': 'Data Scientist',
    'BI Developer': 'Data Scientist',
    'Business Analyst': 'Field Engineer',
    'Product Manager': 'Field Engineer',
    'QA Engineer': 'Field Engineer',
    'Game Developer': 'Full Stack Developer',
    'Graphic Designer': 'Field Engineer',
    'UI/UX Designer': 'Field Engineer',
}

def normalize_roles(df):
    """Normalize all roles to the 8 fixed required roles"""
    print("\n" + "="*60)
    print("NORMALIZING ROLE LABELS")
    print("="*60)

    original_roles = df['role'].unique()
    print(f"\n[+] Original dataset: {len(original_roles)} unique roles")

    # Apply mapping
    df['role'] = df['role'].map(ROLE_MAPPING)

    # Handle any unmapped roles (shouldn't happen, but safe fallback)
    unmapped = df[df['role'].isna()]
    if len(unmapped) > 0:
        print(f"[!] Warning: {len(unmapped)} unmapped roles found, removing...")
        df = df[df['role'].notna()].copy()

    normalized_roles = df['role'].unique()
    print(f"\n[+] After normalization: {len(normalized_roles)} unique roles")
    print(f"\n[+] Final 8 Required Roles Distribution:")
    role_counts = df['role'].value_counts()
    for role in sorted(df['role'].unique()):
        count = role_counts[role]
        pct = (count / len(df)) * 100
        print(f"    {role:<25} {count:5d} records ({pct:5.1f}%)")

    print(f"\n[+] Total records after normalization: {len(df)}")

    return df

def load_data(filepath):
    """Load and display dataset info"""
    print("="*60)
    print("LOADING DATASET")
    print("="*60)
    df = pd.read_csv(filepath)
    print(f"[+] Loaded {len(df)} records from {filepath}")
    print(f"[+] Columns: {list(df.columns)}")
    print(f"[+] Data shape: {df.shape}")

    # Data quality checks
    print(f"\n[+] Data Quality Checks (BEFORE normalization):")
    missing_values = df.isnull().sum()
    print(f"    Missing values: {dict(missing_values[missing_values > 0]) if missing_values.any() else 'None'}")
    duplicates = df.duplicated().sum()
    print(f"    Duplicate rows: {duplicates}")
    print(f"    Unique roles (raw): {df['role'].nunique()}")
    print(f"    Role distribution: Min {df['role'].value_counts().min()} - Max {df['role'].value_counts().max()} records per role")

    return df

def prepare_data(df):
    """Prepare data: normalize roles, combine text features and encode labels"""
    print("\n" + "="*60)
    print("PREPARING DATA")
    print("="*60)

    # Normalize roles to 8 required roles
    df = normalize_roles(df)

    # Combine text features
    df['combined_text'] = df['skills'].fillna('') + ' ' + df['job_description'].fillna('')
    X = df['combined_text']
    y = df['role']

    print(f"\n[+] Combined 'skills' and 'job_description' into single text feature")
    print(f"[+] Sample combined text (first record):")
    print(f"  {X.iloc[0][:150]}...")

    # Encode labels using ONLY the 8 required roles
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    print(f"\n[+] Encoded {len(le.classes_)} unique roles using LabelEncoder")
    print(f"\n[+] Final Encoded Roles:")
    for i, role in enumerate(le.classes_):
        print(f"    {i}: {role}")

    return X, y_encoded, le, df

def vectorize_text(X_train, X_test):
    """Apply TF-IDF vectorization"""
    print("\n" + "="*60)
    print("TEXT VECTORIZATION (TF-IDF)")
    print("="*60)

    vectorizer = TfidfVectorizer(
        max_features=5000,
        stop_words='english',
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.8,
        sublinear_tf=True
    )

    print("[+] Fitting TF-IDF vectorizer with parameters:")
    print(f"  - max_features: 5000")
    print(f"  - stop_words: english")
    print(f"  - ngram_range: (1, 2)")
    print(f"  - min_df: 2, max_df: 0.8")
    print(f"  - sublinear_tf: True")

    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    print(f"\n[+] Vectorization complete!")
    print(f"  - Training set shape: {X_train_tfidf.shape}")
    print(f"  - Test set shape: {X_test_tfidf.shape}")
    print(f"  - Vocabulary size: {len(vectorizer.get_feature_names_out())}")

    return vectorizer, X_train_tfidf, X_test_tfidf

def train_svm(X_train, y_train, X_test, y_test):
    """Train LinearSVC (SVM) classifier"""
    print("\n" + "="*60)
    print("TRAINING: SUPPORT VECTOR MACHINE (SVM)")
    print("="*60)

    print("Training LinearSVC classifier...")
    svm_model = LinearSVC(
        C=1.0,
        max_iter=2000,
        random_state=42,
        verbose=0,
        dual=False
    )

    svm_model.fit(X_train, y_train)
    print("[+] SVM training completed!")

    # Predictions and metrics
    y_pred_svm = svm_model.predict(X_test)
    acc_svm = accuracy_score(y_test, y_pred_svm)
    prec_svm = precision_score(y_test, y_pred_svm, average='weighted', zero_division=0)
    rec_svm = recall_score(y_test, y_pred_svm, average='weighted', zero_division=0)
    f1_svm = f1_score(y_test, y_pred_svm, average='weighted', zero_division=0)

    print(f"\n[+] SVM Performance Metrics:")
    print(f"    Accuracy:  {acc_svm:.4f} (Correct predictions: {int(acc_svm * len(y_test))}/{len(y_test)})")
    print(f"    Precision: {prec_svm:.4f} (How accurate positive predictions are)")
    print(f"    Recall:    {rec_svm:.4f} (How many actual positives found)")
    print(f"    F1-Score:  {f1_svm:.4f} (Harmonic mean of Precision & Recall)")

    return svm_model, {
        'model': 'LinearSVC (SVM)',
        'accuracy': acc_svm,
        'precision': prec_svm,
        'recall': rec_svm,
        'f1_score': f1_svm
    }

def train_random_forest(X_train, y_train, X_test, y_test):
    """Train RandomForestClassifier"""
    print("\n" + "="*60)
    print("TRAINING: RANDOM FOREST CLASSIFIER")
    print("="*60)

    print("Training RandomForestClassifier...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        n_jobs=-1,
        random_state=42,
        verbose=0
    )

    rf_model.fit(X_train, y_train)
    print("[+] Random Forest training completed!")

    # Predictions and metrics
    y_pred_rf = rf_model.predict(X_test)
    acc_rf = accuracy_score(y_test, y_pred_rf)
    prec_rf = precision_score(y_test, y_pred_rf, average='weighted', zero_division=0)
    rec_rf = recall_score(y_test, y_pred_rf, average='weighted', zero_division=0)
    f1_rf = f1_score(y_test, y_pred_rf, average='weighted', zero_division=0)

    print(f"\n[+] Random Forest Performance Metrics:")
    print(f"    Accuracy:  {acc_rf:.4f} (Correct predictions: {int(acc_rf * len(y_test))}/{len(y_test)})")
    print(f"    Precision: {prec_rf:.4f} (How accurate positive predictions are)")
    print(f"    Recall:    {rec_rf:.4f} (How many actual positives found)")
    print(f"    F1-Score:  {f1_rf:.4f} (Harmonic mean of Precision & Recall)")

    return rf_model, {
        'model': 'RandomForestClassifier',
        'accuracy': acc_rf,
        'precision': prec_rf,
        'recall': rec_rf,
        'f1_score': f1_rf
    }

def select_best_model(svm_metrics, rf_metrics):
    """Compare and select the best model"""
    print("\n" + "="*60)
    print("MODEL COMPARISON & SELECTION")
    print("="*60)

    print("\n[+] DETAILED METRICS COMPARISON:")
    print("-" * 60)
    print(f"{'Metric':<15} {'SVM':<20} {'Random Forest':<20}")
    print("-" * 60)
    print(f"{'Accuracy':<15} {svm_metrics['accuracy']:<20.4f} {rf_metrics['accuracy']:<20.4f}")
    print(f"{'Precision':<15} {svm_metrics['precision']:<20.4f} {rf_metrics['precision']:<20.4f}")
    print(f"{'Recall':<15} {svm_metrics['recall']:<20.4f} {rf_metrics['recall']:<20.4f}")
    print(f"{'F1-Score':<15} {svm_metrics['f1_score']:<20.4f} {rf_metrics['f1_score']:<20.4f}")
    print("-" * 60)

    # Select based on accuracy (primary metric)
    if svm_metrics['accuracy'] >= rf_metrics['accuracy']:
        best_model_name = 'SVM'
        best_metrics = svm_metrics
    else:
        best_model_name = 'Random Forest'
        best_metrics = rf_metrics

    print(f"\n[+] BEST MODEL SELECTED: {best_model_name}")
    print(f"    Accuracy:  {best_metrics['accuracy']:.4f}")
    print(f"    Precision: {best_metrics['precision']:.4f}")
    print(f"    Recall:    {best_metrics['recall']:.4f}")
    print(f"    F1-Score:  {best_metrics['f1_score']:.4f}")

    return best_model_name, best_metrics

def save_models(svm_model, rf_model, vectorizer, label_encoder, best_model_name, svm_metrics, rf_metrics):
    """Save trained models and artifacts"""
    print("\n" + "="*60)
    print("SAVING MODELS & ARTIFACTS")
    print("="*60)

    os.makedirs('models', exist_ok=True)

    # Save vectorizer
    joblib.dump(vectorizer, 'models/vectorizer.joblib')
    print("[+] Saved: models/vectorizer.joblib")

    # Save both SVM and RandomForest models (for ensemble predictions)
    joblib.dump(svm_model, 'models/svm_model.joblib')
    print("[+] Saved: models/svm_model.joblib (LinearSVC)")

    joblib.dump(rf_model, 'models/rf_model.joblib')
    print("[+] Saved: models/rf_model.joblib (RandomForestClassifier)")

    # Save best model reference for backward compatibility
    best_model = svm_model if best_model_name == 'SVM' else rf_model
    joblib.dump(best_model, 'models/best_model.joblib')
    print(f"[+] Saved: models/best_model.joblib (reference to {best_model_name})")

    # Save label encoder
    joblib.dump(label_encoder, 'models/label_encoder.joblib')
    print("[+] Saved: models/label_encoder.joblib")

    # Save comprehensive metrics report as JSON
    report = {
        'timestamp': datetime.now().isoformat(),
        'best_model': best_model_name,
        'normalized_roles': list(label_encoder.classes_),
        'svm_metrics': {
            'accuracy': float(svm_metrics['accuracy']),
            'precision': float(svm_metrics['precision']),
            'recall': float(svm_metrics['recall']),
            'f1_score': float(svm_metrics['f1_score'])
        },
        'rf_metrics': {
            'accuracy': float(rf_metrics['accuracy']),
            'precision': float(rf_metrics['precision']),
            'recall': float(rf_metrics['recall']),
            'f1_score': float(rf_metrics['f1_score'])
        },
        'vectorizer_config': {
            'max_features': 5000,
            'stop_words': 'english',
            'ngram_range': [1, 2]
        },
        'training_info': {
            'total_records_after_normalization': 50000,
            'test_split': 0.2,
            'models_saved': ['svm_model.joblib', 'rf_model.joblib', 'best_model.joblib'],
            'ensemble_enabled': True,
            'label_normalization': 'Normalized 44 raw roles to 8 required roles',
            'vectorization_note': 'TF-IDF: max_features=5000, ngram_range=(1,2), min_df=2, max_df=0.8, sublinear_tf=True'
        }
    }

    with open('models/training_report.json', 'w') as f:
        json.dump(report, f, indent=2)

    print("[+] Saved: models/training_report.json")

    print("\n" + "="*60)
    print("TRAINING COMPLETE!")
    print("="*60)
    print("\nAll artifacts saved to 'models/' directory:")
    print("  - svm_model.joblib: Linear SVC classifier")
    print("  - rf_model.joblib: Random Forest classifier")
    print("  - best_model.joblib: Reference to best performing model")
    print("  - vectorizer.joblib: TF-IDF vectorizer")
    print("  - label_encoder.joblib: Role label encoding (8 fixed roles)")
    print("\nThe prediction endpoint will use ENSEMBLE PREDICTIONS from both models!")
    print("All predictions will ONLY return one of the 8 required roles!")
    print("Ready to use in Flask application!")

def main():
    """Main training pipeline"""
    print("\n")
    print("=" * 60)
    print(" SMART CAREER ADVISOR - MODEL TRAINING PIPELINE ".center(60))
    print("=" * 60)

    # Step 1: Load data
    df = load_data('data/jobs_dataset.csv')

    # Step 2: Prepare data (includes role normalization)
    X, y, label_encoder, df = prepare_data(df)

    # Step 3: Train-test split
    print("\n" + "="*60)
    print("TRAIN-TEST SPLIT")
    print("="*60)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"[+] Training set: {len(X_train)} records (80%)")
    print(f"[+] Test set: {len(X_test)} records (20%)")

    # Step 4: Vectorize text
    vectorizer, X_train_tfidf, X_test_tfidf = vectorize_text(X_train, X_test)

    # Step 5: Train models
    svm_model, svm_metrics = train_svm(X_train_tfidf, y_train, X_test_tfidf, y_test)
    rf_model, rf_metrics = train_random_forest(X_train_tfidf, y_train, X_test_tfidf, y_test)

    # Step 6: Select best model
    best_model_name, best_metrics = select_best_model(svm_metrics, rf_metrics)

    # Step 7: Save artifacts (both SVM and RF models for ensemble predictions)
    save_models(svm_model, rf_model, vectorizer, label_encoder, best_model_name, svm_metrics, rf_metrics)

if __name__ == '__main__':
    main()
