import type * as fhir4 from 'fhir/r4';
import { format, parseISO } from 'date-fns';
import { Stethoscope, AlertCircle, FileSearch, HelpCircle } from 'lucide-react';
import { useMemo } from 'react';

interface ConditionsTableProps {
  conditions: fhir4.Condition[];
}

export function ConditionsTable({ conditions }: ConditionsTableProps) {
  if (conditions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-8 flex flex-col items-center justify-center text-center h-full">
        <Stethoscope className="w-12 h-12 text-surface-300 mb-3" />
        <h3 className="text-surface-900 font-medium">No conditions found</h3>
        <p className="text-surface-500 text-sm mt-1">No active conditions recorded for this patient.</p>
      </div>
    );
  }

  const getConditionName = (condition: fhir4.Condition) => {
    return condition.code?.coding?.[0]?.display || condition.code?.text || 'Unknown Condition';
  };

  const getOnsetDate = (condition: fhir4.Condition) => {
    if (!condition.onsetDateTime) return 'Unknown onset';
    try {
      return format(parseISO(condition.onsetDateTime), 'MMM d, yyyy');
    } catch {
      return condition.onsetDateTime;
    }
  };

  const categorized = useMemo(() => {
    const groups = {
      Disorders: [] as fhir4.Condition[],
      Findings: [] as fhir4.Condition[],
      Situations: [] as fhir4.Condition[],
      Other: [] as fhir4.Condition[],
    };

    conditions.forEach((cond) => {
      const name = getConditionName(cond).toLowerCase();
      if (name.endsWith('(disorder)')) groups.Disorders.push(cond);
      else if (name.endsWith('(finding)')) groups.Findings.push(cond);
      else if (name.endsWith('(situation)')) groups.Situations.push(cond);
      else groups.Other.push(cond);
    });

    return groups;
  }, [conditions]);

  const categoryConfigs = {
    Disorders: { icon: <AlertCircle className="w-4 h-4 text-red-500" />, color: 'bg-red-50', text: 'text-red-700' },
    Findings: { icon: <FileSearch className="w-4 h-4 text-blue-500" />, color: 'bg-blue-50', text: 'text-blue-700' },
    Situations: { icon: <Stethoscope className="w-4 h-4 text-amber-500" />, color: 'bg-amber-50', text: 'text-amber-700' },
    Other: { icon: <HelpCircle className="w-4 h-4 text-surface-500" />, color: 'bg-surface-50', text: 'text-surface-700' },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-surface-100 flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
        <h3 className="text-lg font-semibold text-surface-900 flex items-center">
          <Stethoscope className="w-5 h-5 mr-2 text-primary-500" />
          Conditions
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {(Object.entries(categorized) as [keyof typeof categorized, fhir4.Condition[]][]).map(([category, items]) => {
          if (items.length === 0) return null;
          const config = categoryConfigs[category];

          return (
            <div key={category} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 flex items-center border-b border-surface-100 pb-2">
                <span className={`mr-2 p-1 rounded-md ${config.color}`}>
                  {config.icon}
                </span>
                {category} ({items.length})
              </h4>
              <div className="grid gap-3">
                {items.map((condition) => (
                  <div 
                    key={condition.id} 
                    className="p-3.5 bg-white border border-surface-200 hover:border-primary-300 rounded-lg shadow-sm transition-all flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                  >
                    <div className="flex-1 text-sm font-medium text-surface-900 leading-snug break-words">
                      {getConditionName(condition).replace(/\s*\([^)]*\)$/, '')} 
                      {/* ^ optionally strip the suffix for cleaner display since it's grouped now */}
                    </div>
                    <div className="text-xs text-surface-500 whitespace-nowrap sm:text-right mt-1 sm:mt-0 font-medium bg-surface-50 px-2 py-1 rounded">
                      {getOnsetDate(condition)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
