import { useState } from 'react';
import { ArrowLeft, ExternalLink, Music, Save } from 'lucide-react';
import { ReleaseSubmission, ReleaseStatus, Track, Collaborator } from '../types';
import { updateSubmissionStatus, updateSubmissionNotes } from '../store';
import { StatusBadge, ReleaseTypeBadge } from './ui/Badge';

interface Props {
  release: ReleaseSubmission;
  onBack: () => void;
}

export default function ReleaseDetail({ release, onBack }: Props) {
  const [notes, setNotes] = useState(release.labelNotes || '');
  const [status, setStatus] = useState<ReleaseStatus>(release.status);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSubmissionStatus(release.id, status);
    updateSubmissionNotes(release.id, notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const renderLink = (url: string | undefined, label: string) => {
    if (!url) return null;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-sm">
        <ExternalLink className="w-3 h-3" /> {label}
      </a>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <StatusBadge status={release.status} />
          <ReleaseTypeBadge type={release.releaseType} />
        </div>
      </div>

      {/* Title */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Music className="w-7 h-7 text-violet-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{release.releaseTitle}</h2>
            <p className="text-zinc-400">by {release.mainArtist}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-500">
              <span>ID: <span className="font-mono text-zinc-400">{release.id}</span></span>
              <span>Genre: {release.genre}</span>
              <span>Release Date: {release.releaseDate}</span>
              <span>Explicit: {release.explicitContent ? 'Yes' : 'No'}</span>
              <span>Submitted: {new Date(release.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Artist Info */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-4">Artist Info</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-zinc-500">Main Artist</span>
                <p className="font-medium">{release.mainArtist}</p>
              </div>

              {release.collaborations.length > 0 && (
                <div>
                  <span className="text-xs text-zinc-500">Collaborations</span>
                  {release.collaborations.map((c: Collaborator, i: number) => (
                    <div key={i} className="bg-zinc-900/50 rounded-lg p-3 mt-2">
                      <p className="font-medium text-sm">{c.name}</p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {renderLink(c.platformLinks.spotify, 'Spotify')}
                        {renderLink(c.platformLinks.appleMusic, 'Apple Music')}
                        {renderLink(c.platformLinks.anghami, 'Anghami')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {release.features.length > 0 && (
                <div>
                  <span className="text-xs text-zinc-500">Features</span>
                  {release.features.map((f: Collaborator, i: number) => (
                    <div key={i} className="bg-zinc-900/50 rounded-lg p-3 mt-2">
                      <p className="font-medium text-sm">{f.name}</p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {renderLink(f.platformLinks.spotify, 'Spotify')}
                        {renderLink(f.platformLinks.appleMusic, 'Apple Music')}
                        {renderLink(f.platformLinks.anghami, 'Anghami')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tracklist */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-4">Tracklist ({release.tracks.length} tracks)</h3>
            <div className="space-y-3">
              {release.tracks.map((track: Track, i: number) => (
                <div key={i} className="bg-zinc-900/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-600 w-6">{String(i + 1).padStart(2, '0')}</span>
                      <span className="font-medium text-sm">{track.title}</span>
                      {track.explicit && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded font-bold">E</span>}
                    </div>
                    <span className="text-xs text-zinc-500">{track.previewStart} - {track.previewEnd}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 mt-2">
                    {track.producedBy && <span>Produced: {track.producedBy}</span>}
                    {track.lyricsBy && <span>Lyrics: {track.lyricsBy}</span>}
                    {track.mixedBy && <span>Mixed: {track.mixedBy}</span>}
                    {track.masteredBy && <span>Mastered: {track.masteredBy}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {renderLink(track.wavDriveLink, 'WAV File')}
                    {renderLink(track.lyricsDriveLink, 'Lyrics File')}
                    {renderLink(track.lyricsGoogleDocsLink, 'Lyrics Doc')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Files & Links */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-4">Files & Links</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4">
                {renderLink(release.coverArtDriveLink, 'Cover Art (3000×3000)')}
                {renderLink(release.promoDriveLink, 'Promo Materials')}
                {renderLink(release.driveFolderLink, 'Drive Folder')}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Sidebar */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-4">Admin Controls</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as ReleaseStatus)}
                  className="input-dark w-full px-3 py-2.5 rounded-lg text-sm"
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="approved">✅ Approved</option>
                  <option value="scheduled">📅 Scheduled</option>
                  <option value="released">🎵 Released</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Label Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Internal notes about this release..."
                  className="input-dark w-full px-3 py-2.5 rounded-lg text-sm resize-none"
                />
              </div>
              <button
                onClick={handleSave}
                className="btn-primary w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold mb-3 text-sm">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Type</span>
                <span className="uppercase font-medium">{release.releaseType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tracks</span>
                <span className="font-medium">{release.tracks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Genre</span>
                <span className="font-medium">{release.genre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Release</span>
                <span className="font-medium">{release.releaseDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Rights</span>
                <span className={`font-medium ${release.rightsConfirmed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {release.rightsConfirmed ? 'Confirmed' : 'Not confirmed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
