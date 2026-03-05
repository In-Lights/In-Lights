import { v4 as uuidv4 } from 'uuid';
import { ReleaseSubmission, ReleaseStatus, AdminSettings, DEFAULT_ADMIN_SETTINGS } from './types';

const STORAGE_KEY = 'inlights_releases';
const ADMIN_KEY = 'inlights_admin_settings';
const AUTH_KEY = 'inlights_auth';

// Admin Settings
export function getAdminSettings(): AdminSettings {
  try {
    const data = localStorage.getItem(ADMIN_KEY);
    if (data) return { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(data) };
  } catch {}
  return { ...DEFAULT_ADMIN_SETTINGS };
}

export function saveAdminSettings(settings: AdminSettings): void {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(settings));
}

// Auth
export function isAdminLoggedIn(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

export function loginAdmin(username: string, password: string): boolean {
  const settings = getAdminSettings();
  if (username === settings.adminUsername && password === settings.adminPassword) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

// Releases
export function getSubmissions(): ReleaseSubmission[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

export function saveSubmissions(submissions: ReleaseSubmission[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

export function addSubmission(data: Omit<ReleaseSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status'>): ReleaseSubmission {
  const submissions = getSubmissions();
  const now = new Date().toISOString();
  const submission: ReleaseSubmission = {
    ...data,
    id: `IL-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    status: 'pending',
  };
  submissions.unshift(submission);
  saveSubmissions(submissions);
  return submission;
}

export function updateSubmissionStatus(id: string, status: ReleaseStatus): void {
  const submissions = getSubmissions();
  const idx = submissions.findIndex(s => s.id === id);
  if (idx !== -1) {
    submissions[idx].status = status;
    submissions[idx].updatedAt = new Date().toISOString();
    saveSubmissions(submissions);
  }
}

export function updateSubmissionNotes(id: string, notes: string): void {
  const submissions = getSubmissions();
  const idx = submissions.findIndex(s => s.id === id);
  if (idx !== -1) {
    submissions[idx].labelNotes = notes;
    submissions[idx].updatedAt = new Date().toISOString();
    saveSubmissions(submissions);
  }
}

export function deleteSubmission(id: string): void {
  const submissions = getSubmissions().filter(s => s.id !== id);
  saveSubmissions(submissions);
}

export function updateSubmission(id: string, data: Partial<ReleaseSubmission>): void {
  const submissions = getSubmissions();
  const idx = submissions.findIndex(s => s.id === id);
  if (idx !== -1) {
    submissions[idx] = { ...submissions[idx], ...data, updatedAt: new Date().toISOString() };
    saveSubmissions(submissions);
  }
}

export function exportToCSV(submissions: ReleaseSubmission[]): string {
  const headers = [
    'ID', 'Status', 'Release Type', 'Title', 'Main Artist', 'Genre',
    'Release Date', 'Explicit', 'Tracks', 'Created', 'Updated'
  ];
  const rows = submissions.map(s => [
    s.id, s.status, s.releaseType, s.releaseTitle, s.mainArtist, s.genre,
    s.releaseDate, s.explicitContent ? 'Yes' : 'No',
    s.tracks.length.toString(), s.createdAt, s.updatedAt
  ]);
  return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}
