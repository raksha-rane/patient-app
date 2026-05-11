import React from 'react';
import type * as fhir4 from 'fhir/r4';
import { Pill } from 'lucide-react';

interface MedicationsTableProps {
  medicationRequests: fhir4.MedicationRequest[];
  includedMedications: fhir4.Medication[];
}

export function MedicationsTable({ medicationRequests, includedMedications }: MedicationsTableProps) {
  if (medicationRequests.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-8 flex flex-col items-center justify-center text-center">
        <Pill className="w-12 h-12 text-surface-300 mb-3" />
        <h3 className="text-surface-900 font-medium">No medications found</h3>
        <p className="text-surface-500 text-sm mt-1">No active medication requests for this patient.</p>
      </div>
    );
  }

  const getMedicationName = (request: fhir4.MedicationRequest) => {
    if (request.medicationCodeableConcept) {
      return request.medicationCodeableConcept.coding?.[0]?.display || request.medicationCodeableConcept.text || 'Unknown Medication';
    }
    
    if (request.medicationReference?.reference) {
      const refId = request.medicationReference.reference.replace('Medication/', '');
      const includedMed = includedMedications.find(m => m.id === refId);
      if (includedMed?.code) {
        return includedMed.code.coding?.[0]?.display || includedMed.code.text || request.medicationReference.display || 'Unknown Medication';
      }
      return request.medicationReference.display || `Medication (${refId})`;
    }
    
    return 'Unknown Medication';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
        <h3 className="text-lg font-semibold text-surface-900 flex items-center">
          <Pill className="w-5 h-5 mr-2 text-primary-500" />
          Medications
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-surface-100">
              <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Medication Name</th>
              <th className="px-6 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {medicationRequests.map((request) => (
              <tr key={request.id} className="hover:bg-surface-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900">
                  {getMedicationName(request)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${request.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 
                      request.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                      'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                    {request.status || 'Unknown'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
