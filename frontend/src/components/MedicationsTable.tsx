import type * as fhir4 from 'fhir/r4';
import { Pill, CheckCircle2, Clock } from 'lucide-react';

interface MedicationsTableProps {
  medicationRequests: fhir4.MedicationRequest[];
  includedMedications: fhir4.Medication[];
}

export function MedicationsTable({ medicationRequests, includedMedications }: MedicationsTableProps) {
  if (medicationRequests.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-8 flex flex-col items-center justify-center text-center h-full">
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
    <div className="bg-white rounded-xl shadow-sm border border-surface-100 flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
        <h3 className="text-lg font-semibold text-surface-900 flex items-center">
          <Pill className="w-5 h-5 mr-2 text-primary-500" />
          Medications
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-3">
          {medicationRequests.map((request) => {
            const status = request.status || 'unknown';
            const isActive = status === 'active';
            const isCompleted = status === 'completed';

            return (
              <div 
                key={request.id} 
                className="p-4 bg-white border border-surface-200 hover:border-primary-300 rounded-lg shadow-sm transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex-1 flex items-start space-x-3">
                  <div className={`mt-0.5 p-1.5 rounded-md ${isActive ? 'bg-green-100 text-green-600' : 'bg-surface-100 text-surface-400'}`}>
                    <Pill className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-surface-900 leading-snug break-words">
                      {getMedicationName(request)}
                    </p>
                    {request.dosageInstruction?.[0]?.text && (
                      <p className="text-xs text-surface-500 mt-1 line-clamp-2">
                        {request.dosageInstruction[0].text}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:text-right flex items-center sm:justify-end ml-10 sm:ml-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                    ${isActive ? 'bg-green-50 text-green-700 border border-green-200' : 
                      isCompleted ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                      'bg-surface-50 text-surface-700 border border-surface-200'}`}>
                    {isActive && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {isCompleted && <Clock className="w-3 h-3 mr-1" />}
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
