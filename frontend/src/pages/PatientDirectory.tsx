import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type * as fhir4 from 'fhir/r4';
import { Search, Plus, Activity } from 'lucide-react';
import { PatientList } from '../components/PatientList';
import { PatientForm } from '../components/PatientForm';
import { fetchPatients, createPatient, updatePatient } from '../api/fhir';
import { useDebounce } from '../hooks/useDebounce';
import { useState } from 'react';

export function PatientDirectory() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 250);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<fhir4.Patient | undefined>(undefined);

  const { data: patients = [], isLoading, error } = useQuery({
    queryKey: ['patients', debouncedSearchTerm],
    queryFn: () => fetchPatients(debouncedSearchTerm),
  });

  const mutation = useMutation({
    mutationFn: (patientData: fhir4.Patient) => {
      return patientData.id ? updatePatient(patientData.id, patientData) : createPatient(patientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsFormOpen(false);
      setEditingPatient(undefined);
    },
  });

  const handleEditClick = (patient: fhir4.Patient) => {
    setEditingPatient(patient);
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingPatient(undefined);
    setIsFormOpen(true);
  };

  const errorMessage = error instanceof Error ? error.message : (error ? 'Failed to fetch patients' : null);

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Patients Directory</h2>
          <p className="text-surface-500 mt-1">Manage and view all registered patient records.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-surface-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-surface-200 rounded-xl leading-5 bg-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
            />
          </div>

          <button
            onClick={handleAddNewClick}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 bg-surface-100 rounded-full animate-pulse flex items-center justify-center">
              <Activity className="w-6 h-6 text-surface-400" />
            </div>
            <div className="space-y-2 text-center">
              <div className="h-4 bg-surface-200 rounded animate-pulse w-48 mx-auto"></div>
              <div className="h-3 bg-surface-100 rounded animate-pulse w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      ) : (
        <PatientList
          patients={patients}
          isLoading={isLoading}
          error={errorMessage}
          onEdit={handleEditClick}
        />
      )}

      {isFormOpen && (
        <PatientForm
          initialData={editingPatient}
          onSubmit={async (data) => { await mutation.mutateAsync(data); }}
          onClose={() => {
            setIsFormOpen(false);
            setEditingPatient(undefined);
          }}
        />
      )}
    </>
  );
}
