import type * as fhir4 from 'fhir/r4';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/fhir';

// Helper to rewrite FHIR absolute URLs returned in pagination links
function rewriteNextLink(nextLink: string, resourceType: string) {
  const idx = nextLink.indexOf(`/${resourceType}`);
  if (idx !== -1) {
    return `${API_BASE_URL}${nextLink.substring(idx)}`;
  }
  return nextLink;
}

// Generic function to fetch all pages of a FHIR Bundle
async function fetchAllPages<T extends fhir4.Resource>(
  initialUrl: string, 
  resourceType: string
): Promise<T[]> {
  const response = await fetch(initialUrl, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${resourceType}`);
  }

  const initialBundle: fhir4.Bundle = await response.json();
  let resources: T[] = (initialBundle.entry || []).map(e => e.resource as T);
  
  let nextLink = initialBundle.link?.find(l => l.relation === 'next')?.url;

  while (nextLink) {
    const rewrittenUrl = rewriteNextLink(nextLink, resourceType);
    const nextResponse = await fetch(rewrittenUrl, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!nextResponse.ok) break;
    
    const nextBundle: fhir4.Bundle = await nextResponse.json();
    resources = resources.concat((nextBundle.entry || []).map(e => e.resource as T));
    nextLink = nextBundle.link?.find(l => l.relation === 'next')?.url;
  }

  return resources.filter(Boolean);
}

export async function fetchPatients(nameQuery?: string): Promise<fhir4.Patient[]> {
  const url = new URL(`${API_BASE_URL}/Patient`);
  if (nameQuery) {
    url.searchParams.append('name', nameQuery);
  }
  return fetchAllPages<fhir4.Patient>(url.toString(), 'Patient');
}

export async function createPatient(patient: fhir4.Patient): Promise<fhir4.Patient> {
  const response = await fetch(`${API_BASE_URL}/Patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient),
  });
  if (!response.ok) throw new Error('Failed to create patient');
  return response.json();
}

export async function updatePatient(id: string, patient: fhir4.Patient): Promise<fhir4.Patient> {
  const response = await fetch(`${API_BASE_URL}/Patient/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient),
  });
  if (!response.ok) throw new Error('Failed to update patient');
  return response.json();
}

export async function fetchPatientById(id: string): Promise<fhir4.Patient> {
  const response = await fetch(`${API_BASE_URL}/Patient/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch patient');
  return response.json();
}

export async function fetchPatientVitals(patientId: string): Promise<fhir4.Observation[]> {
  const codes = ['8867-4', '8310-5', '9279-1', '59408-5', '8302-2', '29463-7', '39156-5', '55284-4'].join(',');
  const url = `${API_BASE_URL}/Observation?subject=Patient/${patientId}&code=${codes}&_sort=-date`;
  return fetchAllPages<fhir4.Observation>(url, 'Observation');
}

export async function fetchPatientConditions(patientId: string): Promise<fhir4.Condition[]> {
  const url = `${API_BASE_URL}/Condition?patient=${patientId}`;
  return fetchAllPages<fhir4.Condition>(url, 'Condition');
}

export async function fetchPatientMedications(patientId: string): Promise<{ requests: fhir4.MedicationRequest[], medications: fhir4.Medication[] }> {
  const url = `${API_BASE_URL}/MedicationRequest?patient=${patientId}&_include=MedicationRequest:medication`;
  
  // Custom loop for Meds because it includes two resource types
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) throw new Error('Failed to fetch medications');
  
  const initialBundle: fhir4.Bundle = await response.json();
  let allEntries = initialBundle.entry || [];
  
  let nextLink = initialBundle.link?.find(l => l.relation === 'next')?.url;
  while (nextLink) {
    const rewrittenUrl = rewriteNextLink(nextLink, 'MedicationRequest');
    const nextResponse = await fetch(rewrittenUrl, { headers: { 'Content-Type': 'application/json' } });
    if (!nextResponse.ok) break;
    const nextBundle: fhir4.Bundle = await nextResponse.json();
    allEntries = allEntries.concat(nextBundle.entry || []);
    nextLink = nextBundle.link?.find(l => l.relation === 'next')?.url;
  }

  const requests = allEntries.map(e => e.resource).filter(r => (r as any)?.resourceType === 'MedicationRequest') as fhir4.MedicationRequest[];
  const medications = allEntries.map(e => e.resource).filter(r => (r as any)?.resourceType === 'Medication') as fhir4.Medication[];

  return { requests, medications };
}
