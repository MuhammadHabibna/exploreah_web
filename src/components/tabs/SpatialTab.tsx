'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import { AreaData } from '@/lib/types';
import { LISA_COLORS, TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE } from '@/lib/constants';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(m => m.GeoJSON), { ssr: false });

type MapMode = 'lisa' | 'crime_count' | 'arrest_rate' | 'violent_pct';

export default function SpatialTab() {
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('lisa');
  const [map, setMap] = useState<any>(null);
  const geojsonLayersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    setMounted(true);
    fetch('/data/spatial_analysis_results.json').then(r => r.json()).then(setAreas);
    fetch('/data/lapd_divisions.geojson').then(r => r.json()).then(setGeojson);
  }, []);

  const areaMap = useMemo(() => {
    const map: Record<string, AreaData> = {};
    areas.forEach(a => {
      map[a['AREA NAME'].toUpperCase()] = a;
      map[a['AREA NAME']] = a;
    });
    return map;
  }, [areas]);

  if (!mounted || areas.length === 0) return (
    <div className="tab-content" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Memuat data...</div>
  );

  const hhAreas = areas.filter(a => a.lisa_label === 'High-High');
  const llAreas = areas.filter(a => a.lisa_label === 'Low-Low');

  const violentBar = [...areas].sort((a, b) => b.violent_pct - a.violent_pct).map(a => ({
    name: a['AREA NAME'],
    'Violent (%)': +(a.violent_pct * 100).toFixed(1),
    'Property (%)': +(a.property_pct * 100).toFixed(1),
  }));

  const getAreaColor = (areaName: string) => {
    const key = areaName?.toUpperCase()?.replace(/\s+/g, ' ').trim();
    let info: AreaData | null = null;
    for (const k in areaMap) {
      if (k.toUpperCase().replace(/\s+/g, ' ').trim() === key) {
        info = areaMap[k];
        break;
      }
    }
    if (!info) return LISA_COLORS['Not Significant'];

    if (mapMode === 'lisa') {
      return LISA_COLORS[info.lisa_label] || LISA_COLORS['Not Significant'];
    } else if (mapMode === 'crime_count') {
      const val = info.crime_count;
      if (val <= 35000) return '#fee8c8';
      if (val <= 42000) return '#fdd49e';
      if (val <= 48000) return '#fdbb84';
      if (val <= 55000) return '#fc8d59';
      return '#d7301f';
    } else if (mapMode === 'arrest_rate') {
      const pct = info.arrest_rate * 100;
      if (pct <= 7.5) return '#edf8e9';
      if (pct <= 9.0) return '#bae4b3';
      if (pct <= 10.5) return '#74c476';
      if (pct <= 12.0) return '#31a354';
      return '#006d2c';
    } else if (mapMode === 'violent_pct') {
      const pct = info.violent_pct * 100;
      if (pct <= 18.0) return '#f2f0f7';
      if (pct <= 22.0) return '#dadaeb';
      if (pct <= 26.0) return '#bcbddc';
      if (pct <= 31.0) return '#9e9ac8';
      return '#6a51a3';
    }
    return LISA_COLORS['Not Significant'];
  };

  const getLegendItems = () => {
    if (mapMode === 'lisa') {
      return Object.entries(LISA_COLORS).map(([label, color]) => ({
        label,
        color,
      }));
    } else if (mapMode === 'crime_count') {
      return [
        { label: '<= 35K Kasus', color: '#fee8c8' },
        { label: '35K - 42K Kasus', color: '#fdd49e' },
        { label: '42K - 48K Kasus', color: '#fdbb84' },
        { label: '48K - 55K Kasus', color: '#fc8d59' },
        { label: '> 55K Kasus', color: '#d7301f' },
      ];
    } else if (mapMode === 'arrest_rate') {
      return [
        { label: '<= 7.5%', color: '#edf8e9' },
        { label: '7.5% - 9.0%', color: '#bae4b3' },
        { label: '9.0% - 10.5%', color: '#74c476' },
        { label: '10.5% - 12.0%', color: '#31a354' },
        { label: '> 12.0%', color: '#006d2c' },
      ];
    } else if (mapMode === 'violent_pct') {
      return [
        { label: '<= 18.0%', color: '#f2f0f7' },
        { label: '18.0% - 22.0%', color: '#dadaeb' },
        { label: '22.0% - 26.0%', color: '#bcbddc' },
        { label: '26.0% - 31.0%', color: '#9e9ac8' },
        { label: '> 31.0%', color: '#6a51a3' },
      ];
    }
    return [];
  };

  const handleAreaClick = (areaName: string) => {
    const key = areaName.toUpperCase().replace(/\s+/g, ' ').trim();
    const layer = geojsonLayersRef.current[key];
    if (layer && map) {
      const bounds = layer.getBounds();
      map.fitBounds(bounds, { maxZoom: 11, animate: true, duration: 0.8 });
      layer.openPopup();
    }
  };

  return (
    <div className="tab-content">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <KpiCard label="Global Moran's I" value="0.1755" color="blue" sub="Positive spatial autocorrelation" />
        <KpiCard label="Z-Score" value="2.2024" color="gold" sub="Statistik signifikan" />
        <KpiCard label="P-Value" value="0.0276" color="green" sub="p < 0.05 (signifikan)" />
      </div>

      <style>{`
        .area-clickable-item {
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }
        .area-clickable-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .hotspot-item:hover {
          background: #fee2e2 !important;
          border-color: #fca5a5 !important;
        }
        .coldspot-item:hover {
          background: #dbeafe !important;
          border-color: #93c5fd !important;
        }
      `}</style>
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <ChartCard
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
              <span>Peta Spasial - Klasifikasi & Metrik Wilayah</span>
              <select
                value={mapMode}
                onChange={(e) => setMapMode(e.target.value as MapMode)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="lisa">LISA Cluster (Korelasi Spasial)</option>
                <option value="crime_count">Kepadatan Kejahatan (Total Kasus)</option>
                <option value="arrest_rate">Tingkat Penangkapan (Arrest Rate)</option>
                <option value="violent_pct">Persentase Kekerasan (% Violent)</option>
              </select>
            </div>
          }
        >
          <div className="map-container">
            {geojson && (
              <MapContainer ref={setMap} center={[34.05, -118.35]} zoom={10} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                <TileLayer
                  attribution='&copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <GeoJSON
                  key={mapMode}
                  data={geojson}
                  style={(feature) => ({
                    fillColor: getAreaColor(feature?.properties?.APREC || ''),
                    weight: 1.5,
                    color: '#ffffff',
                    fillOpacity: 0.65,
                  })}
                  onEachFeature={(feature, layer) => {
                    const name = feature.properties?.APREC || '';
                    const key = name.toUpperCase().replace(/\s+/g, ' ').trim();
                    geojsonLayersRef.current[key] = layer;
                    
                    let info: AreaData | null = null;
                    for (const k in areaMap) {
                      if (k.toUpperCase().replace(/\s+/g, ' ').trim() === key) { info = areaMap[k]; break; }
                    }
                    if (info) {
                      const isLisa = mapMode === 'lisa';
                      const isCrime = mapMode === 'crime_count';
                      const isArrest = mapMode === 'arrest_rate';
                      const isViolent = mapMode === 'violent_pct';

                      const highlightStyle = 'background-color:rgba(37,99,235,0.08);padding:2px 6px;border-radius:4px;border:1px dashed rgba(37,99,235,0.2);';

                      layer.bindPopup(`
                        <div style="font-family:Inter,sans-serif;font-size:13px;min-width:190px;line-height:1.7;color:var(--text-primary);">
                          <strong style="font-size:14px;display:block;margin-bottom:4px">${info['AREA NAME']}</strong>
                          <span style="color:#64748b">LISA Label: </span><span style="${isLisa ? 'font-weight:700;color:var(--accent-red);' + highlightStyle : ''}">${info.lisa_label}</span><br/>
                          <span style="color:#64748b">Total Kejahatan: </span><span style="${isCrime ? 'font-weight:700;color:var(--accent-orange);' + highlightStyle : ''}">${info.crime_count.toLocaleString()}</span><br/>
                          <span style="color:#64748b">Violent: </span><span style="${isViolent ? 'font-weight:700;color:var(--accent-purple);' + highlightStyle : ''}">${(info.violent_pct * 100).toFixed(1)}%</span> &nbsp;|&nbsp; <span style="color:#64748b">Property: </span><span>${(info.property_pct * 100).toFixed(1)}%</span><br/>
                          <span style="color:#64748b">Arrest Rate: </span><span style="${isArrest ? 'font-weight:700;color:var(--accent-green);' + highlightStyle : ''}">${(info.arrest_rate * 100).toFixed(1)}%</span><br/>
                          <span style="color:#64748b">Moran's I: </span>${info.lisa_I.toFixed(4)} (p=${info.lisa_p})
                        </div>
                      `);
                    }
                  }}
                />
              </MapContainer>
            )}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
            {getLegendItems().map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
                <span style={{ width: 14, height: 14, background: item.color, borderRadius: 3, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)' }} />
                {item.label}
              </div>
            ))}
          </div>
        </ChartCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ChartCard title="Area High-High (Hotspot Utama)" dotColor="#dc2626">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hhAreas.map(a => (
                <div 
                  key={a['AREA NAME']} 
                  onClick={() => handleAreaClick(a['AREA NAME'])}
                  className="area-clickable-item hotspot-item"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}
                >
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{a['AREA NAME']}</span>
                  <span className="badge hh">{a.crime_count.toLocaleString()} kasus</span>
                </div>
              ))}
            </div>
          </ChartCard>
          <ChartCard title="Area Low-Low (Coldspot)" dotColor="#2563eb">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {llAreas.map(a => (
                <div 
                  key={a['AREA NAME']} 
                  onClick={() => handleAreaClick(a['AREA NAME'])}
                  className="area-clickable-item coldspot-item"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}
                >
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{a['AREA NAME']}</span>
                  <span className="badge ll">{a.crime_count.toLocaleString()} kasus</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      <ChartCard title="Proporsi Kejahatan per Area (Violent vs Property)">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={violentBar} layout="vertical" margin={{ left: 80, right: 24, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
            <XAxis type="number" tick={AXIS_TICK} unit="%" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={78} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 13, color: '#475569' }} />
            <Bar dataKey="Violent (%)" fill="#dc2626" stackId="a" />
            <Bar dataKey="Property (%)" fill="#2563eb" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
