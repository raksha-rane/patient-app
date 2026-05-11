import type * as fhir4 from 'fhir/r4';
import { X, UserPlus, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface PatientFormProps {
  initialData?: fhir4.Patient;
  onSubmit: (patient: fhir4.Patient) => Promise<void>;
  onClose: () => void;
}

const patientSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  gender: z.enum(['male', 'female', 'other', 'unknown']),
  birthDate: z.string()
    .min(1, 'Birth date is required')
    .refine((dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && date <= new Date();
    }, 'Birth date cannot be in the future'),
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientForm({ initialData, onSubmit, onClose }: PatientFormProps) {

  const defaultFirstName = initialData?.name?.[0]?.given?.[0] || '';
  const defaultLastName = initialData?.name?.[0]?.family || '';
  const defaultGender = (initialData?.gender as any) || 'unknown';
  const defaultBirthDate = initialData?.birthDate || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      gender: defaultGender,
      birthDate: defaultBirthDate,
    },
  });

  const handleFormSubmit = async (data: PatientFormData) => {
    const patientResource: fhir4.Patient = {
      resourceType: 'Patient',
      id: initialData?.id,
      name: [
        {
          use: 'official',
          family: data.lastName,
          given: [data.firstName],
        },
      ],
      gender: data.gender,
      birthDate: data.birthDate,
      active: true,
    };

    await onSubmit(patientResource);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center bg-surface-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
              {initialData ? <Save size={18} /> : <UserPlus size={18} />}
            </div>
            <h2 className="text-xl font-bold text-surface-900">
              {initialData ? 'Edit Patient' : 'Register Patient'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-surface-600 hover:bg-surface-100 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-surface-700 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName')}
                className={`w-full px-4 py-2.5 bg-surface-50 border ${errors.firstName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-surface-200 focus:ring-primary-500 focus:border-primary-500'} rounded-xl text-surface-900 text-sm focus:outline-none focus:ring-2 transition-all`}
                placeholder="e.g. John"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-surface-700 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName')}
                className={`w-full px-4 py-2.5 bg-surface-50 border ${errors.lastName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-surface-200 focus:ring-primary-500 focus:border-primary-500'} rounded-xl text-surface-900 text-sm focus:outline-none focus:ring-2 transition-all`}
                placeholder="e.g. Doe"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-semibold text-surface-700 mb-1">
              Gender
            </label>
            <select
              id="gender"
              {...register('gender')}
              className={`w-full px-4 py-2.5 bg-surface-50 border ${errors.gender ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-surface-200 focus:ring-primary-500 focus:border-primary-500'} rounded-xl text-surface-900 text-sm focus:outline-none focus:ring-2 transition-all`}
            >
              <option value="unknown">Unknown / Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>}
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-semibold text-surface-700 mb-1">
              Date of Birth
            </label>
            <input
              id="birthDate"
              type="date"
              {...register('birthDate')}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2.5 bg-surface-50 border ${errors.birthDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-surface-200 focus:ring-primary-500 focus:border-primary-500'} rounded-xl text-surface-900 text-sm focus:outline-none focus:ring-2 transition-all`}
            />
            {errors.birthDate && <p className="mt-1 text-xs text-red-500">{errors.birthDate.message}</p>}
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-surface-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-surface-700 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-surface-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Patient'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
