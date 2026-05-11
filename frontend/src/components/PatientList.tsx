import type * as fhir4 from 'fhir/r4';
import { User, Edit2, Calendar, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface PatientListProps {
  patients: fhir4.Patient[];
  isLoading: boolean;
  error: string | null;
  onEdit: (patient: fhir4.Patient) => void;
}

export function PatientList({ patients, isLoading, error, onEdit }: PatientListProps) {
  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 flex flex-col items-center justify-center text-center">
        <Activity className="w-12 h-12 mb-2 text-red-400" />
        <h3 className="text-lg font-semibold mb-1">Failed to load patients</h3>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-6 border-b border-surface-50">
              <div className="w-12 h-12 bg-surface-200 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-surface-200 rounded w-1/4"></div>
                <div className="h-3 bg-surface-200 rounded w-1/3"></div>
              </div>
              <div className="w-20 h-8 bg-surface-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-surface-100 text-surface-400 rounded-full flex items-center justify-center mb-4">
          <User size={32} />
        </div>
        <h3 className="text-lg font-medium text-surface-900 mb-1">No patients found</h3>
        <p className="text-surface-500 max-w-sm">
          Get started by creating a new patient or try adjusting your search terms.
        </p>
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
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-50/50 border-b border-surface-100">
              <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Patient Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Gender</th>
              <th className="px-6 py-4 text-xs font-semibold text-surface-500 uppercase tracking-wider">Date of Birth</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {patients.map((patient) => (
              <tr
                key={patient.id}
                onClick={() => navigate(`/patient/${patient.id}`)}
                className="hover:bg-surface-50/50 transition-colors group cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="shrink-0 h-10 w-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm border border-primary-100">
                      {formatName(patient.name).charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-surface-900">{formatName(patient.name)}</div>
                      <div className="text-xs text-surface-500">ID: {patient.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${patient.gender === 'male' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      patient.gender === 'female' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                        'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                    {patient.gender || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-surface-600">
                    <Calendar className="mr-2 h-4 w-4 text-surface-400" />
                    {formatDOB(patient.birthDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(patient);
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-surface-200 rounded-lg text-sm font-medium text-surface-700 bg-white hover:bg-surface-50 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="h-4 w-4 mr-1.5" />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
