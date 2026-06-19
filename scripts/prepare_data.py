"""
prepare_data.py - Convert CSV results to JSON for dashboard consumption.
Run once: python scripts/prepare_data.py
"""
import csv
import json
import os
import urllib.request

RESULTS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'EXPLORE_AH_DataMining_Results')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')

os.makedirs(OUTPUT_DIR, exist_ok=True)


def csv_to_json(csv_path):
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            clean = {}
            for k, v in row.items():
                if k is None or k.strip() == '':
                    continue
                try:
                    if '.' in v:
                        clean[k.strip()] = float(v)
                    else:
                        clean[k.strip()] = int(v)
                except (ValueError, TypeError):
                    clean[k.strip()] = v.strip() if isinstance(v, str) else v
            if clean:
                rows.append(clean)
    return rows


def main():
    # 1. Spatial analysis results
    data = csv_to_json(os.path.join(RESULTS_DIR, 'spatial', 'spatial_analysis_results.csv'))
    with open(os.path.join(OUTPUT_DIR, 'spatial_analysis_results.json'), 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  spatial_analysis_results.json ({len(data)} areas)")

    # 2. Cluster profiles
    data = csv_to_json(os.path.join(RESULTS_DIR, 'clustering', 'cluster_profiles.csv'))
    with open(os.path.join(OUTPUT_DIR, 'cluster_profiles.json'), 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  cluster_profiles.json ({len(data)} clusters)")

    # 3. Clustering comparison
    data = csv_to_json(os.path.join(RESULTS_DIR, 'clustering', 'clustering_comparison.csv'))
    with open(os.path.join(OUTPUT_DIR, 'clustering_comparison.json'), 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  clustering_comparison.json ({len(data)} rows)")

    # 4. Association rules
    rules = []
    with open(os.path.join(RESULTS_DIR, 'association', 'association_rules.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rules.append({
                'antecedents': row['antecedents'],
                'consequents': row['consequents'],
                'support': round(float(row['support']), 4),
                'confidence': round(float(row['confidence']), 4),
                'lift': round(float(row['lift']), 4),
            })
    with open(os.path.join(OUTPUT_DIR, 'association_rules.json'), 'w') as f:
        json.dump(rules, f, indent=2)
    print(f"  association_rules.json ({len(rules)} rules)")

    # 5. Feature importance
    data = csv_to_json(os.path.join(RESULTS_DIR, 'classification', 'feature_importance.csv'))
    with open(os.path.join(OUTPUT_DIR, 'feature_importance.json'), 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  feature_importance.json ({len(data)} features)")

    # 6. Classification comparison
    data = csv_to_json(os.path.join(RESULTS_DIR, 'classification', 'classification_comparison.csv'))
    with open(os.path.join(OUTPUT_DIR, 'classification_comparison.json'), 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  classification_comparison.json ({len(data)} models)")

    # 7. Cox PH summary
    cox_data = []
    with open(os.path.join(RESULTS_DIR, 'survival_analysis', 'cox_ph_summary.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cox_data.append({
                'covariate': row['covariate'],
                'coef': round(float(row['coef']), 4),
                'hazard_ratio': round(float(row['exp(coef)']), 4),
                'p_value': float(row['p']),
                'ci_lower': round(float(row['exp(coef) lower 95%']), 4),
                'ci_upper': round(float(row['exp(coef) upper 95%']), 4),
            })
    with open(os.path.join(OUTPUT_DIR, 'cox_ph_summary.json'), 'w') as f:
        json.dump(cox_data, f, indent=2)
    print(f"  cox_ph_summary.json ({len(cox_data)} covariates)")

    # 8. Fairness gender
    data = csv_to_json(os.path.join(RESULTS_DIR, 'fairness_audit', 'fairness_gender.csv'))
    with open(os.path.join(OUTPUT_DIR, 'fairness_gender.json'), 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  fairness_gender.json ({len(data)} groups)")

    # 9. Fairness ethnicity
    data = csv_to_json(os.path.join(RESULTS_DIR, 'fairness_audit', 'fairness_ethnicity.csv'))
    with open(os.path.join(OUTPUT_DIR, 'fairness_ethnicity.json'), 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  fairness_ethnicity.json ({len(data)} groups)")

    # 10. EDA summary stats (already JSON, just copy)
    src = os.path.join(RESULTS_DIR, 'eda', 'eda_summary_stats.json')
    with open(src, 'r') as f:
        eda = json.load(f)
    with open(os.path.join(OUTPUT_DIR, 'eda_summary_stats.json'), 'w') as f:
        json.dump(eda, f, indent=2)
    print("  eda_summary_stats.json (copied)")

    # 11. Analysis summary (already JSON, just copy)
    src = os.path.join(RESULTS_DIR, 'analysis_summary.json')
    with open(src, 'r') as f:
        summary = json.load(f)
    with open(os.path.join(OUTPUT_DIR, 'analysis_summary.json'), 'w') as f:
        json.dump(summary, f, indent=2)
    print("  analysis_summary.json (copied)")

    # 12. Forecasting comparison
    data = csv_to_json(os.path.join(RESULTS_DIR, 'forecasting', 'forecasting_comparison.csv'))
    with open(os.path.join(OUTPUT_DIR, 'forecasting_comparison.json'), 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  forecasting_comparison.json ({len(data)} models)")

    # 13. DiD results
    data = csv_to_json(os.path.join(RESULTS_DIR, 'causal_inference', 'did_results.csv'))
    with open(os.path.join(OUTPUT_DIR, 'did_results.json'), 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  did_results.json ({len(data)} rows)")

    # 14. Bootstrap CI
    data = csv_to_json(os.path.join(RESULTS_DIR, 'classification', 'bootstrap_confidence_intervals.csv'))
    with open(os.path.join(OUTPUT_DIR, 'bootstrap_ci.json'), 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  bootstrap_ci.json ({len(data)} rows)")

    # 15. Monthly trend from processed data
    print("\n  Generating monthly_trend.json from Crime_Data CSV...")
    monthly = {}
    crime_csv = os.path.join(os.path.dirname(__file__), '..', '..', 'Crime_Data_from_2020_to_Present.csv')
    with open(crime_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            date_str = row.get('DATE OCC', '')
            if not date_str:
                continue
            parts = date_str.split('/')
            if len(parts) >= 2:
                month_key = f"{parts[2].split()[0]}-{int(parts[0]):02d}"
                monthly[month_key] = monthly.get(month_key, 0) + 1
    trend = [{'month': k, 'count': v} for k, v in sorted(monthly.items())]
    with open(os.path.join(OUTPUT_DIR, 'monthly_trend.json'), 'w') as f:
        json.dump(trend, f, indent=2)
    print(f"  monthly_trend.json ({len(trend)} months)")

    # 16. Download LAPD GeoJSON
    geojson_path = os.path.join(OUTPUT_DIR, 'lapd_divisions.geojson')
    if not os.path.exists(geojson_path):
        print("\n  Downloading LAPD divisions GeoJSON...")
        url = "https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LAPD_Division/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson"
        urllib.request.urlretrieve(url, geojson_path)
        print("  lapd_divisions.geojson (downloaded)")
    else:
        print("  lapd_divisions.geojson (already exists)")

    print("\nAll data prepared successfully!")


if __name__ == '__main__':
    main()
