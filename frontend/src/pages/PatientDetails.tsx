import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import type * as fhir4 from 'fhir/r4';
import { ArrowLeft, User, Calendar, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { 
  fetchPatientById, 
  fetchPatientVitals, 
  fetchPatientConditions, 
  fetchPatientMedications 
} from '../api/fhir';

import { VitalsSection } from '../components/VitalsSection';
import { ConditionsTable } from '../components/ConditionsTable';
import { MedicationsTable } from '../components/MedicationsTable';

export function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const results = useQueries({
    queries: [
      { queryKey: ['patient', id], queryFn: () => fetchPatientById(id!), enabled: !!id },
      { queryKey: ['vitals', id], queryFn: () => fetchPatientVitals(id!), enabled: !!id },
      { queryKey: ['conditions', id], queryFn: () => fetchPatientConditions(id!), enabled: !!id },
      { queryKey: ['medications', id], queryFn: () => fetchPatientMedications(id!), enabled: !!id },
    ]
  });

  const isLoading = results.some(r => r.isLoading);
  const error = results.find(r => r.error)?.error;

  const patient = results[0].data as fhir4.Patient | undefined;
  const vitals = (results[1].data as fhir4.Observation[]) || [];
  const conditions = (results[2].data as fhir4.Condition[]) || [];
  const medsData = results[3].data as { requests: fhir4.MedicationRequest[], medications: fhir4.Medication[] } | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-surface-200 rounded w-24 mb-6"></div>
        <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 flex items-center space-x-6">
          <div className="w-20 h-20 bg-surface-200 rounded-full"></div>
          <div className="space-y-3 flex-1">
            <div className="h-8 bg-surface-200 rounded w-1/3"></div>
            <div className="flex gap-4">
              <div className="h-4 bg-surface-200 rounded w-24"></div>
              <div className="h-4 bg-surface-200 rounded w-32"></div>
              <div className="h-4 bg-surface-200 rounded w-16"></div>
            </div>
          </div>
        </div>
        <div className="h-64 bg-white rounded-2xl border border-surface-200"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-white rounded-2xl border border-surface-200"></div>
          <div className="h-48 bg-white rounded-2xl border border-surface-200"></div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-100 mt-6 text-center">
        <p className="font-medium">{error instanceof Error ? error.message : 'Patient not found'}</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-white text-red-700 rounded-lg shadow-sm border border-red-200 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  const formatName = (name?: fhir4.HumanName[]) => {
    if (!name || name.length === 0) return 'Unknown';
    const officialName = name.find((n) => n.use === 'official') || name[0];
    const given = officialName.given?.join(' ') || '';
    const family = officialName.family || '';
    return `${given} ${family}`.trim() || 'Unknown';
  };

  const formatDOB = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    try {
      return format(parseISO(dateStr), 'MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm font-medium text-surface-500 hover:text-surface-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Directory
        </button>
      </div>

      {/* Demographics Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0 h-20 w-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-bold text-3xl border border-primary-100">
            {formatName(patient.name).charAt(0)}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-surface-900 tracking-tight">
              {formatName(patient.name)}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-surface-600">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1.5 text-surface-400" />
                <span className="capitalize">{patient.gender || 'Unknown gender'}</span>
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-surface-400" />
                Born {formatDOB(patient.birthDate)}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-700">
                ID: {patient.id}
              </span>
            </div>
            {patient.address?.[0] && (
              <div className="mt-2 text-sm text-surface-500">
                {patient.address[0].line?.join(', ')}, {patient.address[0].city}, {patient.address[0].state}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vitals Section */}
      <VitalsSection observations={vitals} />

      {/* Conditions and Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConditionsTable conditions={conditions} />
        <MedicationsTable 
          medicationRequests={medsData?.requests || []} 
          includedMedications={medsData?.medications || []} 
        />
      </div>
    </div>
  );
}
