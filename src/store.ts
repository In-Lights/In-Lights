import { ReleaseSubmission, AdminSettings, DEFAULT_ADMIN_SETTINGS } from './types';

const RELEASES_KEY = 'inlights_releases';
const SETTINGS_KEY = 'inlights_admin_settings';
const AUTH_KEY = 'inlights_auth';
const PUBLIC_BRAND_KEY = 'inlights_public_brand';

// ============================================================
// Generate Release ID: IL-2025-06-001
// ============================================================
function generateReleaseId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `IL-${year}-${month}`;

  const releases = getSubmissions();
  const monthReleases = releases.filter(r => r.id.startsWith(prefix));
  const nextNum = monthReleases.length + 1;

  return `${prefix}-${String(nextNum).padStart(3, '0')}`;
}

// ============================================================
// Settings (Admin - stored in localStorage)
// ============================================================
export function getAdminSettings(): AdminSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(data) };
    }
  } catch {}
  return { ...DEFAULT_ADMIN_SETTINGS };
}

export function saveAdminSettings(settings: AdminSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

  // Also save public branding to localStorage (works same browser)
  const branding = {
    companyName: settings.companyName,
    companyLogo: settings.companyLogo,
    formWelcomeText: settings.formWelcomeText,
    formDescription: settings.formDescription,
  };
  localStorage.setItem(PUBLIC_BRAND_KEY, JSON.stringify(branding));

  // Push branding to Google Sheets for public access (cross-device)
  pushSettingsToSheet(settings);
}

// ============================================================
// Public Branding (for all visitors)
// ============================================================
export function getPublicBranding(): {
  companyName: string;
  companyLogo: string;
  formWelcomeText: string;
  formDescription: string;
} {
  try {
    const data = localStorage.getItem(PUBLIC_BRAND_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.companyName) return parsed;
    }
    // Fallback: try admin settings
    const admin = localStorage.getItem(SETTINGS_KEY);
    if (admin) {
      const parsed = JSON.parse(admin);
      return {
        companyName: parsed.companyName || DEFAULT_ADMIN_SETTINGS.companyName,
        companyLogo: parsed.companyLogo || DEFAULT_ADMIN_SETTINGS.companyLogo,
        formWelcomeText: parsed.formWelcomeText || DEFAULT_ADMIN_SETTINGS.formWelcomeText,
        formDescription: parsed.formDescription || DEFAULT_ADMIN_SETTINGS.formDescription,
      };
    }
  } catch {}
  return {
    companyName: DEFAULT_ADMIN_SETTINGS.companyName,
    companyLogo: DEFAULT_ADMIN_SETTINGS.companyLogo,
    formWelcomeText: DEFAULT_ADMIN_SETTINGS.formWelcomeText,
    formDescription: DEFAULT_ADMIN_SETTINGS.formDescription,
  };
}

// Fetch public branding from Google Sheets (for visitors on OTHER devices)
export async function fetchPublicBranding(): Promise<{
  companyName: string;
  companyLogo: string;
  formWelcomeText: string;
  formDescription: string;
} | null> {
  try {
    // First try Google Sheets
    const settings = getAdminSettings();
    const url = settings.googleSheetsWebhook;
    if (url) {
      const response = await fetch(url + '?action=getSettings', { redirect: 'follow' });
      if (response.ok) {
        const data = await response.json();
        if (data && data.companyName) {
          // Cache locally for faster future loads
          localStorage.setItem(PUBLIC_BRAND_KEY, JSON.stringify(data));
          return data;
        }
      }
    }
  } catch {}

  // Fallback to localStorage
  const local = getPublicBranding();
  if (local.companyName !== DEFAULT_ADMIN_SETTINGS.companyName ||
      local.companyLogo !== DEFAULT_ADMIN_SETTINGS.companyLogo) {
    return local;
  }

  return null;
}

async function pushSettingsToSheet(settings: AdminSettings): Promise<void> {
  if (!settings.googleSheetsWebhook) return;
  try {
    await fetch(settings.googleSheetsWebhook, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveSettings',
        companyName: settings.companyName,
        companyLogo: settings.companyLogo,
        formWelcomeText: settings.formWelcomeText,
        formDescription: settings.formDescription,
      }),
    });
  } catch {}
}

// ============================================================
// Releases
// ============================================================
export function getSubmissions(): ReleaseSubmission[] {
  try {
    const data = localStorage.getItem(RELEASES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addSubmission(submission: Omit<ReleaseSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status'>): ReleaseSubmission {
  const releases = getSubmissions();
  const now = new Date().toISOString();
  const newRelease: ReleaseSubmission = {
    ...submission,
    id: generateReleaseId(),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  releases.unshift(newRelease);
  localStorage.setItem(RELEASES_KEY, JSON.stringify(releases));

  // Send to Google Sheets
  sendToGoogleSheets(newRelease);
  // Send Discord notification
  sendDiscordNotification(newRelease);

  return newRelease;
}

export function updateSubmission(id: string, updates: Partial<ReleaseSubmission>): void {
  const releases = getSubmissions();
  const index = releases.findIndex(r => r.id === id);
  if (index !== -1) {
    releases[index] = { ...releases[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(RELEASES_KEY, JSON.stringify(releases));
  }
}

export function updateSubmissionStatus(id: string, status: ReleaseSubmission['status']): void {
  updateSubmission(id, { status });
}

export function deleteSubmission(id: string): void {
  const releases = getSubmissions().filter(r => r.id !== id);
  localStorage.setItem(RELEASES_KEY, JSON.stringify(releases));
}

// ============================================================
// Auth
// ============================================================
export function isAdminLoggedIn(): boolean {
  try {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return false;
    const { expiry } = JSON.parse(data);
    return new Date().getTime() < expiry;
  } catch {
    return false;
  }
}

export function loginAdmin(username: string, password: string): boolean {
  const settings = getAdminSettings();
  if (username === settings.adminUsername && password === settings.adminPassword) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({
      user: username,
      expiry: new Date().getTime() + 24 * 60 * 60 * 1000,
    }));
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  localStorage.removeItem(AUTH_KEY);
}

// ============================================================
// Google Sheets Integration
// ============================================================
async function sendToGoogleSheets(release: ReleaseSubmission): Promise<void> {
  const settings = getAdminSettings();
  if (!settings.googleSheetsWebhook) return;

  try {
    const trackNames = release.tracks.map((t: { title: string }) => t.title).join(', ');
    const collabNames = release.collaborations?.map((c: { name: string }) => c.name).join(', ') || '';
    const featureNames = release.features?.map((f: { name: string }) => f.name).join(', ') || '';

    await fetch(settings.googleSheetsWebhook, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'newRelease',
        id: release.id,
        mainArtist: release.mainArtist,
        releaseTitle: release.releaseTitle,
        releaseType: release.releaseType,
        genre: release.genre,
        releaseDate: release.releaseDate,
        explicit: release.explicitContent ? 'Yes' : 'No',
        tracks: trackNames,
        trackCount: release.tracks.length,
        collaborations: collabNames,
        features: featureNames,
        coverArtLink: release.coverArtDriveLink || '',
        driveFolderLink: release.driveFolderLink || '',
        promoLink: release.promoDriveLink || '',
        status: release.status,
        submittedAt: release.createdAt,
      }),
    });
  } catch {}
}

// ============================================================
// Discord Webhook (Fixed - proper format)
// ============================================================
async function sendDiscordNotification(release: ReleaseSubmission): Promise<void> {
  const settings = getAdminSettings();
  if (!settings.discordWebhook) return;

  try {
    const trackList = release.tracks
      .map((t: { title: string; explicit: boolean }, i: number) =>
        `${i + 1}. ${t.title}${t.explicit ? ' 🔞' : ''}`
      )
      .join('\n');

    const fields: Array<{ name: string; value: string; inline: boolean }> = [
      { name: '🆔 Release ID', value: release.id, inline: true },
      { name: '🎤 Main Artist', value: release.mainArtist, inline: true },
      { name: '💿 Title', value: release.releaseTitle, inline: true },
      { name: '📀 Type', value: release.releaseType.toUpperCase(), inline: true },
      { name: '🎸 Genre', value: release.genre || 'N/A', inline: true },
      { name: '📅 Release Date', value: release.releaseDate || 'TBD', inline: true },
      { name: '🔞 Explicit', value: release.explicitContent ? 'Yes' : 'No', inline: true },
      { name: `🎵 Tracks (${release.tracks.length})`, value: trackList || 'None', inline: false },
    ];

    if (release.collaborations && release.collaborations.length > 0) {
      fields.push({
        name: '🤝 Collaborations',
        value: release.collaborations.map((c: { name: string }) => c.name).join(', '),
        inline: true,
      });
    }

    if (release.features && release.features.length > 0) {
      fields.push({
        name: '⭐ Features',
        value: release.features.map((f: { name: string }) => f.name).join(', '),
        inline: true,
      });
    }

    if (release.coverArtDriveLink) {
      fields.push({
        name: '🖼️ Cover Art',
        value: `[View on Drive](${release.coverArtDriveLink})`,
        inline: true,
      });
    }

    if (release.driveFolderLink) {
      fields.push({
        name: '📁 Drive Folder',
        value: `[Open Folder](${release.driveFolderLink})`,
        inline: true,
      });
    }

    const payload = {
      username: settings.companyName || 'In Lights',
      avatar_url: settings.companyLogo || '',
      embeds: [
        {
          title: '🎵 New Release Submission',
          description: `**${release.mainArtist}** just submitted a new **${release.releaseType.toUpperCase()}**: **${release.releaseTitle}**`,
          color: 0x8B5CF6,
          fields,
          footer: {
            text: `${settings.companyName || 'In Lights'} • Release Management`,
            icon_url: settings.companyLogo || undefined,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(settings.discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Discord notification failed:', err);
  }
}

// Test Discord webhook
export async function testDiscordWebhook(webhookUrl: string): Promise<boolean> {
  try {
    const settings = getAdminSettings();
    const payload = {
      username: settings.companyName || 'In Lights',
      avatar_url: settings.companyLogo || '',
      embeds: [
        {
          title: '✅ Webhook Connected!',
          description: 'Discord notifications are working. You will receive a notification here every time someone submits a new release.',
          color: 0x10B981,
          footer: {
            text: `${settings.companyName || 'In Lights'} • Release Management`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

// ============================================================
// CSV Export
// ============================================================
export function exportToCSV(releases: ReleaseSubmission[]): string {
  const headers = ['ID', 'Main Artist', 'Title', 'Type', 'Genre', 'Release Date', 'Explicit', 'Tracks', 'Status', 'Submitted'];
  const rows = releases.map(r => [
    r.id,
    r.mainArtist,
    r.releaseTitle,
    r.releaseType,
    r.genre,
    r.releaseDate,
    r.explicitContent ? 'Yes' : 'No',
    r.tracks.map((t: { title: string }) => t.title).join(' | '),
    r.status,
    new Date(r.createdAt).toLocaleDateString(),
  ]);

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `releases-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return csv;
}
