import React, { useState, useEffect } from 'react';
import {
  Shield, Film, Tv, DollarSign, BarChart3, Users, Clock,
  Plus, Check, X, AlertTriangle, Eye, ShieldCheck, Upload,
  Edit, Trash2, Tag, RefreshCw, FileText
} from 'lucide-react';
import { Movie, Series, AdminMetrics, ContentRights, Sponsor, SponsorCampaign, AdminAuditLog } from '../types';

interface AdminViewProps {
  token: string;
  movies: Movie[];
  series: Series[];
  onRefreshData: () => void;
}

export function AdminView({ token, movies, series, onRefreshData }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'movies' | 'series' | 'rights' | 'sponsors' | 'audit'>('metrics');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [rightsList, setRightsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [campaigns, setCampaigns] = useState<SponsorCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Form states
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [newMovieDesc, setNewMovieDesc] = useState('');
  const [newMovieYear, setNewMovieYear] = useState('2025');
  const [newMovieDuration, setNewMovieDuration] = useState('110');
  const [newMovieRightsStatus, setNewMovieRightsStatus] = useState('OWNED');

  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorWebsite, setSponsorWebsite] = useState('');

  const fetchAdminMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.metrics);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRightsData = async () => {
    try {
      const res = await fetch('/api/admin/rights', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setRightsList(data.rights || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSponsorsData = async () => {
    try {
      const res = await fetch('/api/monetization/sponsors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSponsors(data.sponsors || []);
        setCampaigns(data.campaigns || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdminMetrics();
    fetchRightsData();
    fetchSponsorsData();
  }, [token]);

  const handlePublishMovie = async (movieId: string, newState: string) => {
    setStatusMsg('');
    try {
      const res = await fetch(`/api/movies/${movieId}/state`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ state: newState })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(`Error: ${data.error}`);
      } else {
        setStatusMsg(data.message);
        onRefreshData();
      }
    } catch (err: any) {
      setStatusMsg(`Failed to update state: ${err.message}`);
    }
  };

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newMovieTitle,
          description: newMovieDesc,
          releaseYear: newMovieYear,
          durationMinutes: newMovieDuration,
          rightsStatus: newMovieRightsStatus,
          isRwandanContent: true,
        })
      });
      if (res.ok) {
        setShowAddMovieModal(false);
        setNewMovieTitle('');
        setNewMovieDesc('');
        onRefreshData();
        fetchAdminMetrics();
        setStatusMsg('New movie created cleanly in DRAFT mode');
      }
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/monetization/sponsors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: sponsorName, websiteUrl: sponsorWebsite })
      });
      if (res.ok) {
        setShowAddSponsorModal(false);
        setSponsorName('');
        setSponsorWebsite('');
        fetchSponsorsData();
        setStatusMsg('Sponsor registered successfully');
      }
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-red-950/40 p-6 rounded-2xl border border-red-900/60">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-600 text-white shadow-xl shadow-red-950">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">ZIRA Admin Console</h1>
            <p className="text-xs text-red-300">Monetization, Rights Management, Content & Platform Metrics</p>
          </div>
        </div>

        <button
          onClick={() => { fetchAdminMetrics(); onRefreshData(); }}
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 border border-neutral-800"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-800 pb-2">
        {[
          { id: 'metrics', label: 'Metrics & Analytics', icon: BarChart3 },
          { id: 'movies', label: 'Movies Catalog', icon: Film },
          { id: 'series', label: 'Series Catalog', icon: Tv },
          { id: 'rights', label: 'Rights Management', icon: ShieldCheck },
          { id: 'sponsors', label: 'Sponsors & Monetization', icon: DollarSign },
          { id: 'audit', label: 'Audit Logs', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                active ? 'bg-red-600 text-white shadow-lg' : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: METRICS & ANALYTICS */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 text-xs font-medium">Total Registered Users</span>
              <div className="text-2xl font-black text-white">{metrics.totalUsers}</div>
            </div>
            <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 text-xs font-medium">Total Stream Views</span>
              <div className="text-2xl font-black text-white">{metrics.totalViews.toLocaleString()}</div>
            </div>
            <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 text-xs font-medium">Total Watch Hours</span>
              <div className="text-2xl font-black text-white">{metrics.totalWatchHours} hrs</div>
            </div>
            <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 text-xs font-medium">Sponsor Impressions</span>
              <div className="text-2xl font-black text-white">{metrics.totalSponsorImpressions.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 space-y-4">
              <h3 className="font-bold text-white text-sm">Monetization Impressions & Clicks</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Direct Sponsor Ad Impressions</span>
                  <span className="font-bold text-white">{metrics.totalSponsorImpressions}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Direct Sponsor Clicks</span>
                  <span className="font-bold text-emerald-400">{metrics.totalSponsorClicks}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-neutral-400">Affiliate Partner Clicks</span>
                  <span className="font-bold text-yellow-400">{metrics.totalAffiliateClicks}</span>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 space-y-4">
              <h3 className="font-bold text-white text-sm">Storage & Rights Verification</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Cloudflare R2 Storage Service</span>
                  <span className={`font-bold ${metrics.r2Configured ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {metrics.r2Configured ? 'CONFIGURED (R2 Bucket Ready)' : 'DEV MOCK STORAGE (Zero-Config Active)'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-neutral-400">Pending Content Rights Verifications</span>
                  <span className="font-bold text-red-400">{metrics.pendingRightsCount} Items</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOVIES CATALOG */}
      {activeTab === 'movies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Movie Management ({movies.length})</h2>
            <button
              onClick={() => setShowAddMovieModal(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add New Movie
            </button>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Year</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Views</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                {movies.map(m => (
                  <tr key={m.id} className="hover:bg-neutral-800/30">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <img src={m.posterUrl} alt={m.title} className="w-8 h-10 object-cover rounded" />
                      <div>
                        <div>{m.title}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{m.slug}</div>
                      </div>
                    </td>
                    <td className="p-3">{m.releaseYear}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        m.state === 'PUBLISHED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                      }`}>
                        {m.state}
                      </span>
                    </td>
                    <td className="p-3">{m.viewCount}</td>
                    <td className="p-3">{m.averageRating} ★</td>
                    <td className="p-3 flex items-center gap-1.5">
                      {m.state !== 'PUBLISHED' && (
                        <button
                          onClick={() => handlePublishMovie(m.id, 'PUBLISHED')}
                          className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px]"
                        >
                          Publish
                        </button>
                      )}
                      {m.state === 'PUBLISHED' && (
                        <button
                          onClick={() => handlePublishMovie(m.id, 'UNPUBLISHED')}
                          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-[10px]"
                        >
                          Unpublish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RIGHTS MANAGEMENT */}
      {activeTab === 'rights' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-yellow-950/40 border border-yellow-800/60 text-yellow-300 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-yellow-400" /> Content Rights Legal Rule Active
            </div>
            <p className="text-neutral-300">
              ZIRA strictly prevents publishing content when legal rights status is <span className="font-bold text-yellow-400">PENDING VERIFICATION</span> or <span className="font-bold text-red-400">EXPIRED</span>.
            </p>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="p-3">Content Item</th>
                  <th className="p-3">Rights Status</th>
                  <th className="p-3">Rights Holder</th>
                  <th className="p-3">License Ref</th>
                  <th className="p-3">Territories</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                {rightsList.map(r => (
                  <tr key={r.id}>
                    <td className="p-3 font-bold text-white">
                      {r.movie?.title || r.series?.title || 'Unknown Title'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        r.rightsStatus === 'OWNED' || r.rightsStatus === 'LICENSED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {r.rightsStatus}
                      </span>
                    </td>
                    <td className="p-3">{r.rightsHolder}</td>
                    <td className="p-3 font-mono text-[10px]">{r.licenseReference || 'N/A'}</td>
                    <td className="p-3">{r.territories?.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SPONSORS & MONETIZATION */}
      {activeTab === 'sponsors' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Direct Sponsor Campaigns</h2>
            <button
              onClick={() => setShowAddSponsorModal(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add Sponsor Partner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sponsors.map(sp => (
              <div key={sp.id} className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm">{sp.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">Active Partner</span>
                </div>
                <p className="text-xs text-neutral-400 truncate">{sp.websiteUrl}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Admin</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td className="p-3 font-mono text-[10px] text-neutral-400">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3 font-bold text-white">{log.adminName}</td>
                  <td className="p-3 font-bold text-red-400">{log.action}</td>
                  <td className="p-3 text-neutral-400">{log.entityType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD MOVIE MODAL */}
      {showAddMovieModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-lg font-bold text-white">Add New Movie</h3>
            <form onSubmit={handleCreateMovie} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1">Movie Title</label>
                <input required type="text" value={newMovieTitle} onChange={e => setNewMovieTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-neutral-300 block mb-1">Description</label>
                <textarea required value={newMovieDesc} onChange={e => setNewMovieDesc(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white h-20" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-300 block mb-1">Release Year</label>
                  <input type="number" value={newMovieYear} onChange={e => setNewMovieYear(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
                </div>
                <div>
                  <label className="text-neutral-300 block mb-1">Duration (Mins)</label>
                  <input type="number" value={newMovieDuration} onChange={e => setNewMovieDuration(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddMovieModal(false)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold">Create Movie</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SPONSOR MODAL */}
      {showAddSponsorModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Register Sponsor Partner</h3>
            <form onSubmit={handleCreateSponsor} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 block mb-1">Sponsor / Company Name</label>
                <input required type="text" value={sponsorName} onChange={e => setSponsorName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-neutral-300 block mb-1">Website URL</label>
                <input required type="url" value={sponsorWebsite} onChange={e => setSponsorWebsite(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddSponsorModal(false)} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold">Register Sponsor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
