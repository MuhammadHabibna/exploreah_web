'use client';

import { useEffect, useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList, Sankey
} from 'recharts';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import { AssociationRule } from '@/lib/types';
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE } from '@/lib/constants';

const translationMap: { [key: string]: string } = {
  'crime_VIOLENT': 'Kejahatan Kekerasan',
  'has_weapon': 'Membawa Senjata',
  'victim_Young_Adult': 'Korban Dewasa Muda',
  'premis_OUTDOOR': 'Lokasi Terbuka (Outdoor)',
  'time_Night': 'Malam Hari',
  'weekend': 'Akhir Pekan (Weekend)',
  'victim_Adult': 'Korban Dewasa',
  'time_Afternoon': 'Sore Hari',
  'premis_RESIDENTIAL': 'Area Pemukiman (Residential)',
  'time_Evening': 'Petang Hari (Evening)',
  'time_Morning': 'Pagi Hari',
  'arrested': 'Pelaku Ditangkap'
};

const formatTranslation = (raw: string): string => {
  return raw.split(', ')
    .map(part => translationMap[part.trim()] || part.trim())
    .join(' + ');
};

const CustomNode = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload || x === undefined || isNaN(x)) return null;
  const isLeft = payload.name.endsWith(' (Sebab)');
  const cleanName = payload.name.replace(' (Sebab)', '').replace(' (Akibat)', '');
  
  const fill = isLeft ? 'var(--accent-purple, #8b5cf6)' : 'var(--accent-pink, #ec4899)';
  const stroke = isLeft ? 'var(--accent-purple-dark, #7c3aed)' : 'var(--accent-pink-dark, #db2777)';

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity="0.8"
        stroke={stroke}
        strokeWidth="1.5"
        rx={2}
      />
      <text
        x={isLeft ? x + width + 8 : x - 8}
        y={y + height / 2}
        dy="0.35em"
        textAnchor={isLeft ? 'start' : 'end'}
        fontSize="11"
        fill="var(--text-main, #334155)"
        fontWeight="600"
      >
        {cleanName}
      </text>
    </g>
  );
};

const CustomLink = (props: any) => {
  const {
    sourceX, sourceY, targetX, targetY,
    sourceControlX, targetControlX, linkWidth, index, path
  } = props;

  if (sourceX === undefined || isNaN(sourceX)) return null;

  const calculatedWidth = linkWidth !== undefined ? linkWidth : 2;
  const d = path || `M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`;

  return (
    <path
      d={d}
      fill="none"
      stroke={index % 2 === 0 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)'}
      strokeWidth={Math.max(calculatedWidth, 2)}
      style={{ transition: 'stroke-opacity 0.2s, stroke 0.2s' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.strokeOpacity = '0.6';
        e.currentTarget.style.stroke = index % 2 === 0 ? 'rgba(139, 92, 246, 0.5)' : 'rgba(59, 130, 246, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.strokeOpacity = '0.2';
        e.currentTarget.style.stroke = index % 2 === 0 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)';
      }}
    />
  );
};

const CustomSankeyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isLink = data.source !== undefined && data.target !== undefined;
    
    if (isLink) {
      const sourceName = data.source.name.replace(' (Sebab)', '');
      const targetName = data.target.name.replace(' (Akibat)', '');
      
      const sourceIndo = formatTranslation(sourceName);
      const targetIndo = formatTranslation(targetName);
      
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          color: '#fff',
          fontSize: '12px',
          maxWidth: '320px',
          backdropFilter: 'blur(8px)',
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#a78bfa', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            Aliran Hubungan (Rules)
          </p>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Sebab:</span> <code style={{ color: '#fb923c' }}>{sourceName}</code>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>
              ({sourceIndo})
            </div>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Akibat:</span> <code style={{ color: '#fb923c' }}>{targetName}</code>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>
              ({targetIndo})
            </div>
          </div>
          <div style={{ marginTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Support:</span> <strong>{(data.value / 100).toFixed(4)}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Confidence:</span> <strong>{(data.confidence * 100).toFixed(1)}%</strong>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#94a3b8' }}>Lift:</span> <strong style={{ color: '#4ade80' }}>{data.lift.toFixed(3)}</strong>
            </div>
          </div>
        </div>
      );
    } else {
      const nodeName = data.name.replace(' (Sebab)', '').replace(' (Akibat)', '');
      const nodeIndo = formatTranslation(nodeName);
      const isSebab = data.name.endsWith(' (Sebab)');
      
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px 14px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          color: '#fff',
          fontSize: '12px',
          backdropFilter: 'blur(8px)',
        }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: isSebab ? '#a78bfa' : '#f472b6' }}>
            {isSebab ? 'Kondisi Penyebab (Antecedent)' : 'Kejadian Akibat (Consequent)'}
          </p>
          <code style={{ fontSize: '13px', color: '#fb923c', display: 'block', margin: '4px 0' }}>{nodeName}</code>
          <div style={{ fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>
            Arti: {nodeIndo}
          </div>
        </div>
      );
    }
  }
  return null;
};

export default function AssociationTab() {
  const [rules, setRules] = useState<AssociationRule[]>([]);

  useEffect(() => {
    fetch('/data/association_rules.json').then(r => r.json()).then(setRules);
  }, []);

  if (rules.length === 0) return (
    <div className="tab-content" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Memuat data...</div>
  );

  const topByLift = [...rules].sort((a, b) => b.lift - a.lift).slice(0, 10).map(r => ({
    name: `${r.antecedents} -> ${r.consequents}`.substring(0, 48),
    lift: +r.lift.toFixed(3),
  }));

  // Transform data for Sankey
  const topRulesForSankey = [...rules]
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 10);

  const sankeyNodes: { name: string }[] = [];
  const sankeyLinks: { source: number; target: number; value: number; lift: number; confidence: number }[] = [];

  const addSankeyNode = (name: string) => {
    let idx = sankeyNodes.findIndex(n => n.name === name);
    if (idx === -1) {
      sankeyNodes.push({ name });
      idx = sankeyNodes.length - 1;
    }
    return idx;
  };

  topRulesForSankey.forEach(rule => {
    const sourceName = rule.antecedents + ' (Sebab)';
    const targetName = rule.consequents + ' (Akibat)';
    const sourceIdx = addSankeyNode(sourceName);
    const targetIdx = addSankeyNode(targetName);
    sankeyLinks.push({
      source: sourceIdx,
      target: targetIdx,
      value: rule.support * 100,
      lift: rule.lift,
      confidence: rule.confidence
    });
  });

  const sankeyData = {
    nodes: sankeyNodes,
    links: sankeyLinks
  };

  return (
    <div className="tab-content">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <KpiCard label="Frequent Itemsets" value="86" color="blue" sub="Min. support 5%" />
        <KpiCard label="Total Rules" value={rules.length} color="gold" sub="Lift >= 1.5" />
        <KpiCard label="Strong Rules" value="20" color="green" sub="Confidence >= 60%" />
      </div>

      <ChartCard title="Semua Association Rules" dotColor="var(--accent-purple)">
        <div className="data-table-wrapper" style={{ maxHeight: 340 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  Antecedent
                  <div className="custom-tooltip-container">
                    <span style={{ color: '#64748b', fontSize: 12 }}>❓</span>
                    <div className="custom-tooltip-text">Kondisi Awal (Penyebab)</div>
                  </div>
                </th>
                <th>
                  Consequent
                  <div className="custom-tooltip-container">
                    <span style={{ color: '#64748b', fontSize: 12 }}>❓</span>
                    <div className="custom-tooltip-text">Kejadian yang Mengikuti (Akibat)</div>
                  </div>
                </th>
                <th>
                  Support
                  <div className="custom-tooltip-container">
                    <span style={{ color: '#64748b', fontSize: 12 }}>❓</span>
                    <div className="custom-tooltip-text">Seberapa sering kondisi ini muncul bersamaan di SELURUH data. Semakin tinggi = makin umum.</div>
                  </div>
                </th>
                <th>
                  Confidence
                  <div className="custom-tooltip-container">
                    <span style={{ color: '#64748b', fontSize: 12 }}>❓</span>
                    <div className="custom-tooltip-text">Tingkat Kepastian/Akurasi (%). Jika Antecedent terjadi, seberapa pasti Consequent akan menyusul.</div>
                  </div>
                </th>
                <th>
                  Lift
                  <div className="custom-tooltip-container align-right">
                    <span style={{ color: '#64748b', fontSize: 12 }}>❓</span>
                    <div className="custom-tooltip-text">Kekuatan hubungan sebab-akibat. Nilai &gt; 1 berarti saling berhubungan kuat (bukan sekadar kebetulan).</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {[...rules].sort((a, b) => b.lift - a.lift).map((r, i) => (
                <tr key={i}>
                  <td>{r.antecedents}</td>
                  <td>{r.consequents}</td>
                  <td>{r.support.toFixed(4)}</td>
                  <td>{(r.confidence * 100).toFixed(1)}%</td>
                  <td style={{ color: r.lift > 3 ? '#16a34a' : 'inherit', fontWeight: r.lift > 3 ? 600 : 400 }}>
                    {r.lift.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <div className="info-card">
        <div className="info-card-title">Temuan Terkuat - Rule #1 (Lift 3.24)</div>
        <div className="info-card-text">
          <code style={{ background: '#eff6ff', padding: '2px 6px', borderRadius: 4, color: '#1d4ed8', fontSize: 12 }}>
            crime_VIOLENT + victim_Young_Adult → has_weapon
          </code>
          &nbsp;— Confidence <strong>80.9%</strong>, Lift <strong>3.24</strong>. 
          Kejahatan kekerasan hampir <strong>selalu melibatkan senjata</strong> (confidence 99.9%), terutama saat korban adalah dewasa muda.
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 24 }}>
        <ChartCard title="Top 10 Rules berdasarkan Lift" dotColor="var(--accent-gold)">
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={topByLift} layout="vertical" margin={{ left: 10, right: 40, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis type="category" dataKey="name" width={0} tick={false} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [parseFloat(v).toFixed(3), 'Lift']} />
              <Bar dataKey="lift" radius={[0, 4, 4, 0]}>
                {topByLift.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#d97706' : i < 3 ? '#ea580c' : '#2563eb'} />
                ))}
                <LabelList dataKey="name" position="insideLeft" fill="#fff" fontSize={11} fontWeight={500} offset={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Aliran Hubungan Sebab-Akibat (Sankey Diagram)" dotColor="var(--accent-purple)">
          <ResponsiveContainer width="100%" height={380}>
            <Sankey
              data={sankeyData}
              node={<CustomNode />}
              link={<CustomLink />}
              nodeWidth={12}
              nodePadding={16}
              margin={{ left: 10, right: 10, top: 15, bottom: 15 }}
            >
              <Tooltip content={<CustomSankeyTooltip />} />
            </Sankey>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
