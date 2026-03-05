import { useState, useMemo } from 'react';
import { Search, Download, Trash2, Eye, Filter, Music2, Clock, CheckCircle, Calendar, XCircle, BarChart3 } from 'lucide-react';
import { ReleaseSubmission, ReleaseStatus } from '../types';
import { getSubmissions, updateSubmissionStatus, deleteSubmission, exportToCSV } from '../store';
import { ReleaseTypeBadge } from './ui/Badge';

interface Props {
  onViewRelease: (release: ReleaseSubmission) => void;
  refreshKey: number;
}

export default function Dashboard({ onViewRelease, refreshKey }: Props) {
  const [statusFilter, setStatusFilter] = useState<ReleaseStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  const submissions = useMemo(() => getSubmissions(), [refreshKey]);

  const stats = useMemo(() => {
    const s = { total: submissions.length, pending: 0, approved: 0, scheduled: 0, released: 0, rejected: 0 };
    submissions.forEach((r: ReleaseSubmission) => { s[r.status]++; });
    return s;
  }, [submissions]);

  const filtered = useMemo(() => {
    let result = [...submissions];
    if (statusFilter !== 'all') result = result.filter((r: ReleaseSubmission) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r: ReleaseSubmission) =>
        r.releaseTitle.toLowerCase().includes(q) ||
        r.mainArtist.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else result.sort((a, b) => a.releaseTitle.localeCompare(b.releaseTitle));
    return result;
  }, [submissions, statusFilter, search, sortBy]);

  const handleExport = () => {
    const csv = exportToCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `releases-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this submission?')) {
      deleteSubmission(id);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleStatusChange = (id: string, status: ReleaseStatus) => {
    updateSubmissionStatus(id, status);
    window.dispatchEvent(new Event('storage'));
  };

  const statCards = [
    { label: 'Total', value: stats.total, icon: BarChart3, color: 'text-white', bg: 'bg-zinc-800/50' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Scheduled', value: stats.scheduled, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Released', value: stats.released, icon: Music2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(s => (
          <div key={s.label} className={`glass-card rounded-xl p-4 ${s.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-zinc-500">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, artist, or ID..."
            className="input-dark w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as ReleaseStatus | 'all')}
              className="input-dark pl-10 pr-8 py-2.5 rounded-xl text-sm appearance-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="released">Released</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
            className="input-dark px-4 py-2.5 rounded-xl text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title A-Z</option>
          </select>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-sm transition-all">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Music2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-lg">No releases found</p>
          <p className="text-zinc-600 text-sm mt-1">Submissions will appear here when artists submit releases</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Release</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden sm:table-cell">Artist</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden md:table-cell">Type</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-zinc-500 px-4 py-3 hidden lg:table-cell">Date</th>
                  <th className="text-right text-xs font-medium text-zinc-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((release: ReleaseSubmission) => (
                  <tr key={release.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{release.releaseTitle}</p>
                        <p className="text-xs text-zinc-500 font-mono">{release.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-zinc-300">{release.mainArtist}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <ReleaseTypeBadge type={release.releaseType} />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={release.status}
                        onChange={e => handleStatusChange(release.id, e.target.value as ReleaseStatus)}
                        className="bg-transparent border-0 text-sm cursor-pointer focus:outline-none"
                        style={{ color: release.status === 'pending' ? '#fbbf24' : release.status === 'approved' ? '#34d399' : release.status === 'scheduled' ? '#60a5fa' : release.status === 'released' ? '#a78bfa' : '#f87171' }}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="approved">✅ Approved</option>
                        <option value="scheduled">📅 Scheduled</option>
                        <option value="released">🎵 Released</option>
                        <option value="rejected">❌ Rejected</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-zinc-500">{new Date(release.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onViewRelease(release)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-violet-400 transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(release.id)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-red-400 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
