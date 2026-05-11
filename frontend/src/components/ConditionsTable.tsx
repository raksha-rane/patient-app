import React from 'react';
import type * as fhir4 from 'fhir/r4';
import { format, parseISO } from 'date-fns';
import { Stethoscope } from 'lucide-react';

interface ConditionsTableProps {
  conditions: fhir4.Condition[];
}

export function ConditionsTable({ conditions }: ConditionsTableProps) {
  if (conditions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-8 flex flex-col items-center justify-center text-center">
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
    if (!condition.onsetDateTime) return 'Unknown';
    try {
      return format(parseISO(condition.onsetDateTime), 'MMM d, yyyy');
    } catch {
      return condition.onsetDateTime;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
        <h3 className="text-lg font-semibold text-surface-900 flex items-center">
          <Stethoscope className="w-5 h-5 mr-2 text-primary-500" />
          Conditions
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-surface-100">
              <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Condition</th>
              <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Onset Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {conditions.map((condition) => (
              <tr key={condition.id} className="hover:bg-surface-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900">
                  {getConditionName(condition)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">
                  {getOnsetDate(condition)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
