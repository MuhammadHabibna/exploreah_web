export interface AreaData {
  'AREA NAME': string;
  crime_count: number;
  arrest_rate: number;
  weapon_rate: number;
  avg_lat: number;
  avg_lon: number;
  avg_victim_age: number;
  violent_pct: number;
  property_pct: number;
  avg_dist_cbd: number;
  lisa_q: number;
  lisa_p: number;
  lisa_I: number;
  lisa_sig: boolean;
  lisa_label: string;
  gi_zscore: number;
  gi_pvalue: number;
  hotspot_class: string;
}

export interface ClusterProfile {
  cluster_hdbscan: number;
  count: number;
  avg_lat: number;
  avg_lon: number;
  avg_hour: number;
  arrest_rate: number;
  weapon_rate: number;
  avg_age: number;
  avg_dist_cbd: number;
  top_crime: string;
  top_area: string;
}

export interface AreaYearlyProfile {
  area: string;
  year: number;
  crime_count: number;
  arrest_rate: number;
  weapon_rate: number;
  violent_pct: number;
  property_pct: number;
  avg_dist_cbd: number;
  avg_report_delay: number;
  dominant_type: string;
}

export interface ClusterMetaCluster {
  id: number;
  count: number;
  top_crime: string;
  top_area: string;
  arrest_rate: number;
  weapon_rate: number;
  avg_dist_cbd: number;
  avg_age: number;
}

export interface ClusterMetaGroup {
  key: string;
  label: string;
  interpretation: string;
  cluster_count: number;
  total_crimes: number;
  avg_arrest_rate: number;
  avg_weapon_rate: number;
  avg_dist_cbd: number;
  avg_age: number;
  clusters: ClusterMetaCluster[];
}


export interface AssociationRule {
  antecedents: string;
  consequents: string;
  support: number;
  confidence: number;
  lift: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface ClassificationModel {
  Model: string;
  'F1 (mean +/- std)': string;
  'ROC-AUC (mean +/- std)': string;
  'Accuracy (mean +/- std)': string;
}

export interface CoxCovariate {
  covariate: string;
  coef: number;
  hazard_ratio: number;
  p_value: number;
  ci_lower: number;
  ci_upper: number;
}

export interface FairnessGroup {
  sensitive_feature_0: string;
  accuracy: number;
  selection_rate: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface ClusteringComparison {
  Silhouette: number;
  'Calinski-Harabasz': number;
  'Davies-Bouldin': number;
  N_Clusters: number;
  Noise_Pct: number;
}

export interface EDAStats {
  total_records: number;
  date_range: string;
  total_areas: number;
  total_crime_types: number;
  overall_arrest_rate: number;
  weapon_usage_rate: number;
  avg_victim_age: number;
  median_report_delay_days: number;
  top_crime_category: string;
  top_area: string;
  avg_mocodes_per_incident: number;
}

export interface DiDResult {
  DiD_Coefficient: number;
  P_Value: number;
  R_Squared: number;
  Adj_R_Squared: number;
  N_Observations: number;
}

export interface BootstrapCI {
  F1_mean: number;
  F1_CI_lower: number;
  F1_CI_upper: number;
  AUC_mean: number;
  AUC_CI_lower: number;
  AUC_CI_upper: number;
}

export type TabId = 'overview' | 'clustering' | 'association' | 'classification' | 'spatial' | 'forecasting' | 'advanced';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}
