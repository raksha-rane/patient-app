import { useState, useMemo } from 'react';
import type * as fhir4 from 'fhir/r4';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Activity, Table as TableIcon, LineChart as ChartIcon } from 'lucide-react';

interface VitalsSectionProps {
  observations: fhir4.Observation[];
}

const VITAL_CONFIGS: Record<string, { name: string; color: string }> = {
  '8867-4': { name: 'Heart Rate', color: '#ef4444' },
  '8310-5': { name: 'Temperature', color: '#f59e0b' },
  '9279-1': { name: 'Respiratory Rate', color: '#10b981' },
  '59408-5': { name: 'Oxygen Saturation', color: '#3b82f6' },
  '8302-2': { name: 'Height', color: '#8b5cf6' },
  '29463-7': { name: 'Weight', color: '#ec4899' },
  '39156-5': { name: 'BMI', color: '#6366f1' },
  '55284-4': { name: 'Blood Pressure', color: '#ef4444' } // BP is special
};

export function VitalsSection({ observations }: VitalsSectionProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Process observations into a structured format
  const { chartData, tableData } = useMemo(() => {
    const charts: Record<string, any[]> = {};
    const table: any[] = [];

    // Initialize chart arrays
    Object.keys(VITAL_CONFIGS).forEach(code => {
      charts[code] = [];
    });

    observations.forEach(obs => {
      const dateStr = obs.effectiveDateTime || obs.issued;
      if (!dateStr) return;

      const code = obs.code?.coding?.[0]?.code;
      if (!code || !VITAL_CONFIGS[code]) return;

      const formattedDate = format(parseISO(dateStr), 'MMM d, yy HH:mm');

      if (code === '55284-4' && obs.component) {
        // Blood Pressure
        const systolicComp = obs.component.find(c => c.code.coding?.[0]?.code === '8480-6');
        const diastolicComp = obs.component.find(c => c.code.coding?.[0]?.code === '8462-4');

        if (systolicComp?.valueQuantity?.value && diastolicComp?.valueQuantity?.value) {
          const sys = systolicComp.valueQuantity.value;
          const dia = diastolicComp.valueQuantity.value;
          const unit = systolicComp.valueQuantity.unit || 'mmHg';

          charts[code].push({
            date: formattedDate,
            rawDate: new Date(dateStr).getTime(),
            systolic: sys,
            diastolic: dia,
            unit
          });

          table.push({
            id: obs.id,
            date: formattedDate,
            rawDate: new Date(dateStr).getTime(),
            type: VITAL_CONFIGS[code].name,
            value: `${sys}/${dia}`,
            unit,
            isAbnormal: sys > 130 || dia > 80 || sys < 90 || dia < 60
          });
        }
      } else if (obs.valueQuantity?.value) {
        // Standard single-value observation
        const val = obs.valueQuantity.value;
        const unit = obs.valueQuantity.unit || '';

        charts[code].push({
          date: formattedDate,
          rawDate: new Date(dateStr).getTime(),
          value: val,
          unit
        });

        table.push({
          id: obs.id,
          date: formattedDate,
          rawDate: new Date(dateStr).getTime(),
          type: VITAL_CONFIGS[code].name,
          value: val,
          unit,
          isAbnormal: (code === '8867-4' && (val < 60 || val > 100)) ||
            (code === '8310-5' && (val < 36.1 || val > 37.2)) ||
            (code === '9279-1' && (val < 12 || val > 20)) ||
            (code === '59408-5' && val < 95)
        });
      }
    });

    // Sort chart arrays chronologically
    Object.keys(charts).forEach(code => {
      charts[code].sort((a, b) => a.rawDate - b.rawDate);
    });

    // Sort table reverse chronologically
    table.sort((a, b) => b.rawDate - a.rawDate);

    return { chartData: charts, tableData: table };
  }, [observations]);

  const renderCharts = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {Object.entries(chartData).map(([code, data]) => {
          if (data.length === 0) return null;
          const config = VITAL_CONFIGS[code];

          return (
            <div key={code} className="bg-white border border-surface-200 rounded-xl p-4 shadow-sm" style={{ minHeight: '250px' }}>
              <h4 className="text-sm font-semibold text-surface-700 mb-4">{config.name}</h4>
              <div style={{ height: '200px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {code === '55284-4' ? (
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Systolic" isAnimationActive={false} />
                      <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Diastolic" isAnimationActive={false} />
                    </LineChart>
                  ) : (
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name={config.name} isAnimationActive={false} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTable = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200">
              <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Vital Sign</th>
              <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {tableData.map((row) => (
              <tr key={row.id + row.type} className={`transition-colors ${row.isAbnormal ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-surface-50/50'}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">{row.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900">{row.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right flex justify-end items-center">
                  <span className={`${row.isAbnormal ? 'text-red-700 font-bold' : 'text-primary-700'}`}>
                    {row.value}
                  </span>
                  <span className={`ml-1 text-xs ${row.isAbnormal ? 'text-red-500' : 'text-surface-400 font-normal'}`}>{row.unit}</span>
                  {row.isAbnormal && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Out of Range
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (observations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-8 flex flex-col items-center justify-center text-center">
        <Activity className="w-12 h-12 text-surface-300 mb-3" />
        <h3 className="text-surface-900 font-medium">No vitals found</h3>
        <p className="text-surface-500 text-sm mt-1">No vital sign observations recorded for this patient.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-100 bg-surface-50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-surface-900 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-primary-500" />
          Vital Signs
        </h3>

        <div className="flex bg-surface-200 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('chart')}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'chart'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
              }`}
          >
            <ChartIcon className="w-4 h-4 mr-1.5" />
            Charts
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'table'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
              }`}
          >
            <TableIcon className="w-4 h-4 mr-1.5" />
            Table
          </button>
        </div>
      </div>

      {viewMode === 'chart' ? renderCharts() : renderTable()}
    </div>
  );
}
