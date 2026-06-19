'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import { FeatureImportance, BootstrapCI } from '@/lib/types';
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE } from '@/lib/constants';

interface ModelRow {
  Model: string;
  [key: string]: string | number;
}

const CustomFeatureTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name = data.name;
    const importance = data.importance;
    
    let description = '';
    switch (name.toLowerCase()) {
      case 'dist to cbd km':
        description = 'Jarak dari tempat kejadian perkara ke pusat kota (Central Business District) Los Angeles dalam kilometer.';
        break;
      case 'crime cat encoded':
        description = 'Kategori jenis kejahatan (seperti Violent, Property, dsb.) yang telah dikodekan.';
        break;
      case 'area':
        description = 'Kode area wilayah administratif kepolisian LAPD tempat terjadinya kejahatan.';
        break;
      case 'vict age':
        description = 'Usia korban kejahatan dalam tahun.';
        break;
      case 'report delay days':
        description = 'Selisih hari antara waktu kejadian kejahatan dengan waktu pelaporan resmi ke kepolisian.';
        break;
      case 'premis_cat_encoded':
      case 'premis cat encoded':
        description = 'Kategori jenis lokasi kejadian kejahatan (seperti Outdoor, Residential, Commercial).';
        break;
      case 'n mocodes':
        description = 'Jumlah Modus Operandi (pola perilaku unik pelaku kejahatan) yang teridentifikasi.';
        break;
      case 'hour cos':
        description = 'Representasi siklus jam kejadian menggunakan nilai Cosine untuk menangkap pola temporal harian.';
        break;
      case 'vict sex encoded':
        description = 'Jenis kelamin korban kejahatan (Laki-laki, Perempuan, atau Tidak Diketahui) yang dikodekan.';
        break;
      case 'n crime codes':
        description = 'Jumlah kode pelanggaran hukum yang dikenakan pada kejadian kejahatan tersebut.';
        break;
      default:
        description = 'Variabel prediktor yang digunakan oleh model klasifikasi LightGBM.';
    }

    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        padding: '10px 12px',
        borderRadius: 8,
        boxShadow: 'var(--shadow-lg)',
        maxWidth: 260,
        fontSize: 11.5,
        lineHeight: 1.45
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{name}</div>
        <div style={{ color: 'var(--accent-gold)', fontWeight: 600, marginBottom: 6 }}>Importance: {importance.toFixed(1)}</div>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{description}</div>
      </div>
    );
  }
  return null;
};

export default function ClassificationTab() {
  const [models, setModels] = useState<ModelRow[]>([]);
  const [features, setFeatures] = useState<FeatureImportance[]>([]);
  const [ci, setCi] = useState<BootstrapCI | null>(null);
  const [showTargetTooltip, setShowTargetTooltip] = useState(false);

  // Simulator state variables
  const [simCrimeCat, setSimCrimeCat] = useState<'VIOLENT' | 'PROPERTY' | 'OTHER'>('PROPERTY');
  const [simDistCbd, setSimDistCbd] = useState<number>(15);
  const [simHasWeapon, setSimHasWeapon] = useState<boolean>(false);
  const [simTimeOfDay, setSimTimeOfDay] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night'>('Afternoon');
  const [simReportDelay, setSimReportDelay] = useState<number>(0);
  const [simVictAge, setSimVictAge] = useState<number>(35);

  useEffect(() => {
    fetch('/data/classification_comparison.json').then(r => r.json()).then(setModels);
    fetch('/data/feature_importance.json').then(r => r.json()).then(setFeatures);
    fetch('/data/bootstrap_ci.json').then(r => r.json()).then((d: BootstrapCI[]) => setCi(d[0]));
  }, []);

  // Math logic for probability simulation
  const calculateProbability = () => {
    let logOdds = -2.31; // Base rate: log(0.09 / 0.91) = -2.31 (~9.0%)

    // 1. Kategori Kejahatan
    if (simCrimeCat === 'VIOLENT') {
      logOdds += 0.85;
    } else if (simCrimeCat === 'PROPERTY') {
      logOdds -= 0.60;
    }

    // 2. Senjata
    if (simHasWeapon) {
      logOdds += 0.50;
    }

    // 3. Jarak ke CBD
    const distDiff = 15 - simDistCbd;
    logOdds += distDiff * 0.04;

    // 4. Delay Laporan
    if (simReportDelay === 0) {
      logOdds += 0.40;
    } else if (simReportDelay > 3) {
      logOdds -= 0.50;
    }

    // 5. Usia Korban
    if (simVictAge > 0 && simVictAge < 18) {
      logOdds += 0.20;
    } else if (simVictAge >= 65) {
      logOdds += 0.15;
    }

    // 6. Waktu Kejadian
    if (simTimeOfDay === 'Morning' || simTimeOfDay === 'Afternoon') {
      logOdds += 0.15;
    } else if (simTimeOfDay === 'Night') {
      logOdds -= 0.10;
    }

    const prob = 1 / (1 + Math.exp(-logOdds));
    return prob * 100;
  };

  const simProb = calculateProbability();

  const getBadgeDetails = (prob: number) => {
    if (prob < 5) return { text: 'Sangat Rendah (< 5%)', color: 'var(--accent-red)', bg: 'var(--accent-red-light)' };
    if (prob < 15) return { text: 'Rendah (5% - 15%)', color: 'var(--accent-orange)', bg: 'var(--accent-orange-light)' };
    if (prob < 30) return { text: 'Sedang (15% - 30%)', color: 'var(--accent-gold)', bg: 'var(--accent-gold-light)' };
    return { text: 'Tinggi (> 30%)', color: 'var(--accent-green)', bg: 'var(--accent-green-light)' };
  };

  const badge = getBadgeDetails(simProb);

  const getSimExplanation = () => {
    let parts: string[] = [];
    if (simCrimeCat === 'VIOLENT') {
      parts.push("Kejahatan kekerasan mendapat atensi dan prioritas penyelidikan LAPD yang tinggi");
    } else if (simCrimeCat === 'PROPERTY') {
      parts.push("Kasus pencurian/properti tanpa kekerasan memiliki tingkat tindak lanjut arrest yang rendah");
    }

    if (simHasWeapon) {
      parts.push("keterlibatan senjata memperberat status kasus dan mempercepat pengerahan personel");
    }

    if (simDistCbd < 5) {
      parts.push("lokasi di pusat kota (CBD) didukung oleh tingginya kamera pengawas dan patroli polisi aktif");
    } else if (simDistCbd > 25) {
      parts.push("lokasi pinggiran kota memiliki respon patroli yang lebih renggang");
    }

    if (simReportDelay === 0) {
      parts.push("pelaporan langsung pada hari kejadian mempermudah pencarian bukti fisik");
    } else if (simReportDelay > 3) {
      parts.push("penundaan pelaporan yang lama secara signifikan menghambat identifikasi pelaku");
    }

    if (parts.length === 0) {
      return "Skenario berada dalam batas rata-rata karakteristik kasus LAPD.";
    }
    return parts.join(", serta ") + ".";
  };

  if (models.length === 0) return (
    <div className="tab-content" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Memuat data...</div>
  );

  const parseMetric = (val: string | number | undefined): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const match = String(val).match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const comparisonData = models.map(m => ({
    name: m.Model === 'Stacking Ensemble' ? 'Stacking' : m.Model,
    F1: parseMetric(m['F1 (mean +/- std)']),
    'ROC-AUC': parseMetric(m['ROC-AUC (mean +/- std)']),
    Accuracy: parseMetric(m['Accuracy (mean +/- std)']),
  }));

  const featureData = [...features]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10)
    .map(f => ({ name: f.feature.replace(/_/g, ' '), importance: f.importance }));

  return (
    <div className="tab-content">
      <div className="kpi-grid">
        <KpiCard label="Best ROC-AUC" value="0.8219" color="blue" sub="Stacking Ensemble" />
        <KpiCard label="Best F1 Score (CV)" value="0.3177" color="green" sub="LightGBM" />
        <KpiCard label="Imbalance Ratio" value="~9%" color="red" sub="Arrest rate sangat rendah" />
        <KpiCard label="AUC 95% CI" value={ci ? `[${ci.AUC_CI_lower.toFixed(3)}, ${ci.AUC_CI_upper.toFixed(3)}]` : '...'} color="purple" sub="Bootstrap interval" />
      </div>

      <div className="grid-2">
        <ChartCard title="Perbandingan Performa 3 Model">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={comparisonData} margin={{ bottom: 5, left: 5, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={AXIS_TICK} domain={[0, 1]} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(1)} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => parseFloat(v).toFixed(4)} />
              <Legend wrapperStyle={{ fontSize: 13, color: '#475569', paddingTop: 12 }} />
              <Bar dataKey="F1" fill="#dc2626" radius={[4, 4, 0, 0]} name="F1 Score" />
              <Bar dataKey="ROC-AUC" fill="#2563eb" radius={[4, 4, 0, 0]} name="ROC-AUC" />
              <Bar dataKey="Accuracy" fill="#16a34a" radius={[4, 4, 0, 0]} name="Accuracy" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
              <span>Feature Importance Top 10 (LightGBM)</span>
              <div 
                style={{ display: 'inline-flex', cursor: 'pointer', color: 'var(--text-muted)', verticalAlign: 'middle' }}
                onMouseEnter={() => setShowTargetTooltip(true)}
                onMouseLeave={() => setShowTargetTooltip(false)}
                onClick={() => setShowTargetTooltip(!showTargetTooltip)}
                title="Target Prediksi: Status_Arrest. Mengukur kontribusi setiap fitur dalam memprediksi kemungkinan penangkapan pelaku kejahatan (Arrested vs Not Arrested)."
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              {showTargetTooltip && (
                <div style={{
                  position: 'absolute',
                  bottom: '125%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1e293b',
                  color: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  width: 280,
                  lineHeight: '1.45',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 50,
                  pointerEvents: 'none',
                  fontWeight: 'normal',
                  whiteSpace: 'normal'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#38bdf8' }}>Target Prediksi: Status_Arrest</div>
                  Mengukur kontribusi setiap fitur dalam memprediksi kemungkinan penangkapan pelaku kejahatan (Arrested (1) vs Not Arrested (0)).
                </div>
              )}
            </div>
          } 
          dotColor="var(--accent-gold)"
        >
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={featureData} layout="vertical" margin={{ left: 110, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={105} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomFeatureTooltip />} />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {featureData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#d97706' : i === 1 ? '#ea580c' : i === 2 ? '#dc2626' : '#2563eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Simulator Section */}
      <ChartCard title="Arrest Probability Simulator (What-If Analysis)" dotColor="var(--accent-purple)">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 32,
          padding: '16px 8px',
          color: 'var(--text-primary)'
        }}>
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: -4 }}>
              Sesuaikan karakteristik kasus kejahatan di bawah untuk menyimulasikan tingkat kemungkinan penangkapan pelaku oleh LAPD:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Kategori Kejahatan */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Kategori Kejahatan</label>
                <select 
                  value={simCrimeCat} 
                  onChange={e => setSimCrimeCat(e.target.value as any)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="PROPERTY">Pencurian / Properti (PROPERTY)</option>
                  <option value="VIOLENT">Kejahatan Kekerasan (VIOLENT)</option>
                  <option value="OTHER">Lainnya / Others (OTHER)</option>
                </select>
              </div>

              {/* Penggunaan Senjata */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Keterlibatan Senjata</label>
                <select 
                  value={simHasWeapon ? 'true' : 'false'} 
                  onChange={e => setSimHasWeapon(e.target.value === 'true')}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="false">Tidak Melibatkan Senjata</option>
                  <option value="true">Melibatkan Senjata (Weapon Present)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Delay Laporan */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Keterlambatan Melapor</label>
                <select 
                  value={simReportDelay} 
                  onChange={e => setSimReportDelay(+e.target.value)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={0}>Hari H Kejadian (Langsung Lapor)</option>
                  <option value={2}>1 - 3 Hari Keterlambatan</option>
                  <option value={5}>Lebih dari 3 Hari</option>
                </select>
              </div>

              {/* Waktu Kejadian */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Waktu Kejadian</label>
                <select 
                  value={simTimeOfDay} 
                  onChange={e => setSimTimeOfDay(e.target.value as any)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Morning">Pagi Hari (06:00 - 12:00)</option>
                  <option value="Afternoon">Siang/Sore (12:00 - 18:00)</option>
                  <option value="Evening">Petang Hari (18:00 - 21:00)</option>
                  <option value="Night">Malam Hari (21:00 - 06:00)</option>
                </select>
              </div>
            </div>

            {/* Jarak ke CBD Slider */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <span>Jarak ke Pusat Kota (CBD)</span>
                <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{simDistCbd.toFixed(1)} km</span>
              </div>
              <input 
                type="range" min="0" max="35" step="0.5"
                value={simDistCbd}
                onChange={e => setSimDistCbd(+e.target.value)}
                style={{
                  accentColor: 'var(--accent-blue)',
                  background: '#e2e8f0',
                  height: 6,
                  borderRadius: 3,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: -2 }}>
                <span>0 km (Downtown LA)</span>
                <span>35 km (Pinggiran Wilayah)</span>
              </div>
            </div>

            {/* Usia Korban Slider */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <span>Usia Korban</span>
                <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{simVictAge} Tahun</span>
              </div>
              <input 
                type="range" min="1" max="95" step="1"
                value={simVictAge}
                onChange={e => setSimVictAge(+e.target.value)}
                style={{
                  accentColor: 'var(--accent-blue)',
                  background: '#e2e8f0',
                  height: 6,
                  borderRadius: 3,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: -2 }}>
                <span>Anak-anak (1 thn)</span>
                <span>Lansia (95 thn)</span>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Estimasi Probabilitas Penangkapan
            </div>

            {/* Massive Circular Metric */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="140" height="140" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.15)"
                  strokeWidth="2.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={badge.color}
                  strokeWidth="2.5"
                  strokeDasharray={`${simProb.toFixed(1)}, 100`}
                  style={{ transition: 'stroke-dasharray 0.3s ease, stroke 0.3s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'monospace'
              }}>
                {simProb.toFixed(1)}%
              </div>
            </div>

            {/* Dynamic Badge */}
            <div style={{
              background: badge.bg,
              color: badge.color,
              border: `1px solid ${badge.color}33`,
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
              transition: 'all 0.3s ease'
            }}>
              {badge.text.toUpperCase()}
            </div>

            {/* Interpretive Explanation */}
            <div style={{
              fontSize: 12.5,
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              borderTop: '1px solid var(--border)',
              paddingTop: 14,
              maxWidth: 320
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Analisis Faktor:</strong> {getSimExplanation()}
            </div>
          </div>
        </div>
      </ChartCard>

      <div className="info-card warning" style={{ marginTop: 24 }}>
        <div className="info-card-title">Analisis: Paradoks F1-Score pada Data Imbalanced</div>
        <div className="info-card-text">
          Stacking Ensemble memiliki <strong>ROC-AUC tertinggi (0.8219)</strong> namun F1 sangat rendah (0.0002) karena threshold default 0.5 
          pada data yang sangat tidak seimbang (arrest rate hanya 9%). Model mampu membedakan probabilitas dengan baik, namun jarang memprediksi kelas positif. 
          <strong> Jarak ke CBD</strong>, <strong>Kategori Kejahatan</strong>, and <strong>Area LAPD</strong> adalah 3 prediktor arrest terkuat.
        </div>
      </div>
    </div>
  );
}
