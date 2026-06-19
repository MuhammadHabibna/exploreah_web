'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine,
} from 'recharts';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE } from '@/lib/constants';

interface ForecastModel {
  Model: string;
  'MAPE (%)': number;
  RMSE: number;
}

interface ForecastRecord {
  month: string;
  actual: number | null;
  prophet: number;
  prophet_lower: number;
  prophet_upper: number;
  sarima: number;
}

interface SeasonalityRecord {
  name: string;
  offset: number;
  desc: string;
}

const CustomForecastTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const parts = label.split('-');
    const year = parts[0] ? '20' + parts[0] : '';
    const month = parts[1] ? parseInt(parts[1]) : 0;
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[month - 1] || '';
    const dateFormatted = `${monthName} ${year}`;

    const actualItem = payload.find((p: any) => p.dataKey === 'actual');
    const prophetItem = payload.find((p: any) => p.dataKey === 'prophet');
    const sarimaItem = payload.find((p: any) => p.dataKey === 'sarima');
    const boundsItem = payload.find((p: any) => p.dataKey === 'bounds');

    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        padding: '12px 14px',
        borderRadius: 12,
        boxShadow: 'var(--shadow-lg)',
        fontSize: 12.5,
        lineHeight: 1.6
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
          {dateFormatted}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {actualItem && actualItem.value !== undefined && actualItem.value !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>● Data Aktual:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{actualItem.value.toLocaleString()} Kasus</strong>
            </div>
          )}
          {prophetItem && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
              <span style={{ color: '#2563eb', fontWeight: 500 }}>-- Prediksi Prophet:</span>
              <strong style={{ color: '#2563eb' }}>{Math.round(prophetItem.value).toLocaleString()} Kasus</strong>
            </div>
          )}
          {sarimaItem && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
              <span style={{ color: '#ea580c', fontWeight: 500 }}>-- Prediksi SARIMA:</span>
              <strong style={{ color: '#ea580c' }}>{Math.round(sarimaItem.value).toLocaleString()} Kasus</strong>
            </div>
          )}
          {boundsItem && boundsItem.payload && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
              Margin Error: {Math.round(boundsItem.payload.prophet_lower).toLocaleString()} - {Math.round(boundsItem.payload.prophet_upper).toLocaleString()} kasus
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function ForecastingTab() {
  const [models, setModels] = useState<ForecastModel[]>([]);
  const [forecastData, setForecastData] = useState<ForecastRecord[]>([]);
  const [seasonalityData, setSeasonalityData] = useState<SeasonalityRecord[]>([]);

  // Visibilities
  const [showActual, setShowActual] = useState(true);
  const [showProphet, setShowProphet] = useState(true);
  const [showSarima, setShowSarima] = useState(true);

  // Intervention Simulator
  const [patrolLevel, setPatrolLevel] = useState(0); // 0% to 25% reduction
  const [economyFactor, setEconomyFactor] = useState(0); // -10% to +15% change

  useEffect(() => {
    fetch('/data/forecasting_comparison.json').then(r => r.json()).then(setModels);
    fetch('/data/forecast_data.json').then(r => r.json()).then(data => {
      setForecastData(data.forecast);
      setSeasonalityData(data.seasonality);
    });
  }, []);

  // Calculations for dinamis What-If
  const adjustedData = useMemo(() => {
    if (forecastData.length === 0) return [];
    return forecastData.map(r => {
      const isFuture = r.month > '2024-09';
      if (isFuture) {
        const patrolMultiplier = 1 - (patrolLevel / 100);
        const economyMultiplier = 1 + (economyFactor / 100);
        const totalMultiplier = patrolMultiplier * economyMultiplier;

        const adjProphet = Math.round(r.prophet * totalMultiplier);
        const adjSarima = Math.round(r.sarima * totalMultiplier);
        const adjLower = Math.round(r.prophet_lower * totalMultiplier);
        const adjUpper = Math.round(r.prophet_upper * totalMultiplier);

        return {
          ...r,
          label: r.month.substring(2),
          prophet: adjProphet,
          prophet_lower: adjLower,
          prophet_upper: adjUpper,
          sarima: adjSarima,
          bounds: [adjLower, adjUpper]
        };
      } else {
        return {
          ...r,
          label: r.month.substring(2),
          bounds: [r.prophet_lower, r.prophet_upper]
        };
      }
    });
  }, [forecastData, patrolLevel, economyFactor]);

  const crimesAverted = useMemo(() => {
    if (forecastData.length === 0) return 0;
    let originalSum = 0;
    let adjustedSum = 0;
    forecastData.forEach(r => {
      if (r.month > '2024-09') {
        originalSum += r.prophet;
        const patrolMultiplier = 1 - (patrolLevel / 100);
        const economyMultiplier = 1 + (economyFactor / 100);
        adjustedSum += r.prophet * patrolMultiplier * economyMultiplier;
      }
    });
    const diff = originalSum - adjustedSum;
    return diff > 0 ? Math.round(diff) : 0;
  }, [forecastData, patrolLevel, economyFactor]);

  if (models.length === 0 || forecastData.length === 0) return (
    <div className="tab-content" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Memuat data...</div>
  );

  return (
    <div className="tab-content">
      <div className="kpi-grid">
        <KpiCard label="Model Terbaik (Prophet)" value="50.71% Error" color="blue" sub="Rata-rata error bulanan (MAPE)" />
        <KpiCard label="Model Baseline (SARIMA)" value="63.53% Error" color="orange" sub="Sebagai pembanding akurasi" />
        <KpiCard 
          label={crimesAverted > 0 ? "Kejahatan Dicegah (6 bln)" : "Target Intervensi"} 
          value={crimesAverted > 0 ? `${crimesAverted.toLocaleString()} Kasus` : "Sesuaikan Slider"} 
          color={crimesAverted > 0 ? "green" : "gold"} 
          sub={crimesAverted > 0 ? "Hasil simulasi kebijakan" : "Gunakan What-If Simulator"} 
        />
        <KpiCard label="Periode Data Historis" value="57 Bulan" color="purple" sub="Rentang Jan 2020 - Sep 2024" />
      </div>

      {/* Main Forecast Chart */}
      <div className="full-width">
        <ChartCard 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, flexWrap: 'wrap', gap: 12 }}>
              <span>Tren Historis & Proyeksi Prediksi (Aktual vs Model)</span>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 600 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={showActual} onChange={e => setShowActual(e.target.checked)} style={{ cursor: 'pointer' }} />
                  Aktual
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#2563eb' }}>
                  <input type="checkbox" checked={showProphet} onChange={e => setShowProphet(e.target.checked)} style={{ cursor: 'pointer' }} />
                  Prophet
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#ea580c' }}>
                  <input type="checkbox" checked={showSarima} onChange={e => setShowSarima(e.target.checked)} style={{ cursor: 'pointer' }} />
                  SARIMA
                </label>
              </div>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={adjustedData} margin={{ left: 10, right: 24, top: 8, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 10 }}
                interval={2}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                label={{ value: 'Periode Waktu (Tahun-Bulan)', position: 'bottom', fill: '#94a3b8', fontSize: 11, offset: 5 }}
              />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={v => v.toLocaleString()} />
              <Tooltip content={<CustomForecastTooltip />} />
              
              {/* Confidence Interval Shaded Area */}
              {showProphet && (
                <Area
                  type="monotone"
                  dataKey="bounds"
                  fill="#3b82f6"
                  stroke="none"
                  fillOpacity={0.1}
                  name="Margin Error (Prophet)"
                />
              )}

              {/* COVID Lockdown Reference Line */}
              <ReferenceLine
                x="20-03"
                stroke="#dc2626"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: 'COVID Lockdown', fill: '#dc2626', fontSize: 10, position: 'top' }}
              />

              {/* Prediction boundary */}
              <ReferenceLine
                x="24-09"
                stroke="#16a34a"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{ value: 'Mulai Prediksi', fill: '#16a34a', fontSize: 10, position: 'top' }}
              />

              {showActual && (
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#0f172a" 
                  strokeWidth={2.5} 
                  dot={false} 
                  activeDot={{ r: 4, fill: '#0f172a' }} 
                  name="Data Aktual" 
                />
              )}

              {showProphet && (
                <Line 
                  type="monotone" 
                  dataKey="prophet" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={false} 
                  activeDot={{ r: 4, fill: '#2563eb' }} 
                  name="Prediksi Prophet" 
                />
              )}

              {showSarima && (
                <Line 
                  type="monotone" 
                  dataKey="sarima" 
                  stroke="#ea580c" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={false} 
                  activeDot={{ r: 4, fill: '#ea580c' }} 
                  name="Prediksi SARIMA" 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Simulator Card */}
        <ChartCard title="Simulator Kebijakan & Dampak ('What-If' Planner)" dotColor="var(--accent-green)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Ubah parameter kebijakan di bawah untuk mensimulasikan bagaimana upaya preventif polisi atau kondisi sosial ekonomi dapat mempengaruhi total kejahatan LAPD selama 6 bulan ke depan.
            </p>

            {/* Slider 1: Patrol */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600 }}>
                <span>Intensitas Patroli & Pengamanan Polisi</span>
                <span style={{ color: 'var(--accent-green)', fontFamily: 'monospace' }}>+{patrolLevel}% Efektivitas</span>
              </div>
              <input 
                type="range" min="0" max="25" step="1"
                value={patrolLevel}
                onChange={e => setPatrolLevel(+e.target.value)}
                style={{
                  accentColor: 'var(--accent-green)',
                  background: '#e2e8f0',
                  height: 6,
                  borderRadius: 3,
                  outline: 'none',
                  cursor: 'pointer',
                  width: '100%'
                }}
              />
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                Meningkatkan kehadiran fisik petugas di jalan raya dapat menurunkan kejahatan jalanan.
              </span>
            </div>

            {/* Slider 2: Economy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600 }}>
                <span>Faktor Kesejahteraan Ekonomi & Sosial</span>
                <span style={{ color: economyFactor < 0 ? 'var(--accent-green)' : (economyFactor > 0 ? 'var(--accent-red)' : 'var(--text-secondary)'), fontFamily: 'monospace' }}>
                  {economyFactor >= 0 ? `+${economyFactor}%` : `${economyFactor}%`} Dampak
                </span>
              </div>
              <input 
                type="range" min="-10" max="15" step="1"
                value={economyFactor}
                onChange={e => setEconomyFactor(+e.target.value)}
                style={{
                  accentColor: economyFactor > 0 ? 'var(--accent-red)' : 'var(--accent-blue)',
                  background: '#e2e8f0',
                  height: 6,
                  borderRadius: 3,
                  outline: 'none',
                  cursor: 'pointer',
                  width: '100%'
                }}
              />
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                Kondisi inflasi atau tingkat pengangguran tinggi cenderung mendorong peningkatan kejahatan properti.
              </span>
            </div>

            {/* Dynamic Results Box */}
            <div style={{
              background: crimesAverted > 0 ? 'rgba(22,163,74,0.06)' : '#f8fafc',
              border: crimesAverted > 0 ? '1px dashed rgba(22,163,74,0.3)' : '1px solid var(--border)',
              borderRadius: 8,
              padding: '12px 16px',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              {crimesAverted > 0 ? (
                <div style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 600 }}>
                  🎉 Berhasil mencegah estimasi <strong>{crimesAverted.toLocaleString()} kasus kejahatan</strong> di Los Angeles!
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Geser slider di atas untuk melihat estimasi kasus yang dapat dicegah.
                </div>
              )}
            </div>
          </div>
        </ChartCard>

        {/* Seasonality Component Card */}
        <ChartCard title="Faktor Musiman: Kapan Kejahatan Meningkat?" dotColor="var(--accent-purple)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Model Prophet mendeteksi adanya <strong>pola tahunan (*yearly seasonality*)</strong> yang kuat. Berikut adalah deviasi rata-rata kejahatan bulanan LAPD:
            </p>

            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={seasonalityData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${v}%`} tickLine={false} axisLine={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <Tooltip 
                  contentStyle={TOOLTIP_STYLE} 
                  formatter={(v: any, name: any, props: any) => [`${v > 0 ? '+' : ''}${v}%`, 'Efek Musiman', `${props.payload.desc}`]} 
                />
                <Bar dataKey="offset" radius={[4, 4, 0, 0]}>
                  {seasonalityData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.offset >= 0 ? 'var(--accent-red)' : 'var(--accent-blue)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div style={{
              background: 'linear-gradient(135deg, #ede9fe 0%, #ffffff 100%)',
              border: '1px solid #ddd6fe',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--text-secondary)'
            }}>
              💡 <strong>Insight untuk Pemula:</strong> Kriminalitas cenderung melonjak hingga <strong>+5% di musim panas (Mei - Agustus)</strong> karena aktivitas luar ruangan meningkat, dan mencapai titik terendah <strong>(-5%) di musim dingin (Februari)</strong>.
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Accuracy Comparison Card */}
        <ChartCard title="Akurasi Model Prediksi (MAPE & RMSE)" dotColor="var(--accent-gold)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Kami membandingkan dua algoritma peramalan untuk melihat mana yang lebih mendekati kebenaran:
            </p>

            <div className="data-table-wrapper" style={{ maxHeight: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Model Algoritma</th>
                    <th>Tingkat Error (MAPE) ℹ️</th>
                    <th>Simpangan Kasus (RMSE) ℹ️</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m, idx) => (
                    <tr key={m.Model}>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: idx === 0 ? '#2563eb' : '#ea580c', marginRight: 8 }} />
                        {m.Model}
                      </td>
                      <td style={{ color: idx === 0 ? 'var(--accent-green)' : 'var(--text-primary)', fontWeight: 600 }}>
                        {m['MAPE (%)']}%
                      </td>
                      <td>
                        {Math.round(m.RMSE).toLocaleString()} Kasus
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>
              * <strong>MAPE (Mean Absolute Percentage Error)</strong>: Persentase rata-rata kesalahan prediksi. Lebih kecil = lebih akurat.<br />
              * <strong>RMSE (Root Mean Squared Error)</strong>: Selisih rata-rata prediksi dalam jumlah kasus nyata. Lebih kecil = lebih akurat.
            </div>
          </div>
        </ChartCard>

        {/* Explain Error Card */}
        <div className="info-card warning" style={{ margin: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="info-card-title">Penjelasan: Mengapa Tingkat Error Cukup Tinggi?</div>
          <div className="info-card-text" style={{ fontSize: 12.5 }}>
            Tingkat error model berkisar antara 50% - 63%. Hal ini disebabkan oleh <strong>Guncangan Struktural Pandemi COVID-19 (Maret 2020)</strong>. 
            <br /><br />
            Saat lockdown, tingkat kejahatan di Los Angeles anjlok drastis ke tingkat yang tidak biasa, dan kemudian meningkat secara berangsur-angsur. Perubahan pola ekstrem ini membingungkan model statistik linier. 
            <br /><br />
            <strong>Prophet (Meta)</strong> memiliki akurasi lebih baik dibandingkan SARIMA karena model ini dilengkapi kemampuan bawaan untuk mendeteksi tren non-stasioner dan pola musiman tahunan secara otomatis.
          </div>
        </div>
      </div>
    </div>
  );
}
