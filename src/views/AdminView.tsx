import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import {
  Shield, Film, Tv, DollarSign, BarChart3, Users, Clock,
  Plus, Check, X, AlertTriangle, Eye, ShieldCheck, Upload,
  Edit, Trash2, Tag, RefreshCw, FileText, ExternalLink, Sparkles
} from 'lucide-react';
import { Movie, Series, AdminMetrics, ContentRights, Sponsor, SponsorCampaign, AdminAuditLog } from '../types';

interface AdminViewProps {
  token: string;
  movies: Movie[];
  series: Series[];
  onRefreshData: () => void;
}

export function AdminView({ token, movies, series, onRefreshData }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'movies' | 'series' | 'rights' | 'sponsors' | 'monetag' | 'affiliate' | 'analytics' | 'audit'>('metrics');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [rightsList, setRightsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [campaigns, setCampaigns] = useState<SponsorCampaign[]>([]);
  const [monetagPlacements, setMonetagPlacements] = useState<any[]>([]);
  const [monetagRevenue, setMonetagRevenue] = useState(0);
  const [affiliateData, setAffiliateData] = useState<any>({ partners: [], campaigns: [], verifiedRevenue: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [paidInputs, setPaidInputs] = useState<Record<string, string>>({});
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
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [campaignDraft, setCampaignDraft] = useState({ sponsorId: '', name: '', destinationUrl: '', imageUrl: '', creativeTitle: '', tagline: '', placement: 'HOME_BETWEEN_RAILS', startDate: new Date().toISOString().slice(0, 16), endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16), agreedPrice: '0' });
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignEdits, setCampaignEdits] = useState<Record<string, any>>({});
  const [showAffiliatePartnerModal, setShowAffiliatePartnerModal] = useState(false);
  const [editingAffiliatePartnerId, setEditingAffiliatePartnerId] = useState<string | null>(null);
  const [affiliatePartnerDraft, setAffiliatePartnerDraft] = useState({ partnerName: '', websiteUrl: '', description: '' });
  const [showAffiliateCampaignModal, setShowAffiliateCampaignModal] = useState(false);
  const [editingAffiliateCampaignId, setEditingAffiliateCampaignId] = useState<string | null>(null);
  const [affiliateCampaignDraft, setAffiliateCampaignDraft] = useState({ partnerId: '', campaignName: '', destinationUrl: '', trackingUrl: '', imageUrl: '', placement: 'HOME_BOTTOM_BANNER', startDate: new Date().toISOString().slice(0, 16), endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16) });
  const [conversionCampaignId, setConversionCampaignId] = useState('');
  const [conversionDraft, setConversionDraft] = useState({ externalReference: '', commissionRevenue: '', currency: 'USD' });

  const fetchAdminMetrics = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/metrics', {
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
      const res = await apiFetch('/api/admin/rights', {
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
      const res = await apiFetch('/api/monetization/sponsors', {
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

  const fetchMonetagData = async () => {
    try {
      const res = await apiFetch('/api/monetization/monetag', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setMonetagPlacements(data.placements || []);
        setMonetagRevenue(data.reportedRevenue || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAffiliateData = async () => {
    try {
      const res = await apiFetch('/api/monetization/affiliate', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setAffiliateData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMonetizationAnalytics = async () => {
    try {
      const res = await apiFetch('/api/monetization/analytics', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
  };

  const saveMonetagPlacement = async (item: any) => {
    try {
      const res = await apiFetch(`/api/monetization/monetag/placements/${item.placement}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: item.enabled, zoneId: item.zoneId, tagCode: item.tagCode }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update placement.');
      await fetchMonetagData();
      setStatusMsg('Monetag placement saved.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not update Monetag placement.');
    }
  };

  const updateMonetagDraft = (placement: string, changes: Record<string, unknown>) => {
    setMonetagPlacements(previous => previous.map(item => item.placement === placement ? { ...item, ...changes } : item));
  };

  const updateSponsorCampaign = async (campaignId: string, changes: Record<string, unknown>) => {
    try {
      const res = await apiFetch(`/api/monetization/sponsors/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update campaign.');
      await fetchSponsorsData();
      await fetchMonetizationAnalytics();
      setStatusMsg('Campaign updated.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not update campaign.');
    }
  };

  const updateSponsor = async (sponsorId: string, changes: Record<string, unknown>) => {
    try {
      const res = await apiFetch(`/api/monetization/sponsors/${sponsorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not update sponsor.');
      await fetchSponsorsData();
      setStatusMsg('Sponsor updated.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not update sponsor.');
    }
  };

  useEffect(() => {
    fetchAdminMetrics();
    fetchRightsData();
    fetchSponsorsData();
    fetchMonetagData();
    fetchAffiliateData();
    fetchMonetizationAnalytics();
  }, [token]);

  const handlePublishMovie = async (movieId: string, newState: string) => {
    setStatusMsg('');
    try {
      const res = await apiFetch(`/api/movies/${movieId}/state`, {
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
      const res = await apiFetch('/api/movies', {
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
      const res = await apiFetch(editingSponsorId ? `/api/monetization/sponsors/${editingSponsorId}` : '/api/monetization/sponsors', {
        method: editingSponsorId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: sponsorName, websiteUrl: sponsorWebsite })
      });
      if (res.ok) {
        setShowAddSponsorModal(false);
        setEditingSponsorId(null);
        setSponsorName('');
        setSponsorWebsite('');
        fetchSponsorsData();
        setStatusMsg(editingSponsorId ? 'Sponsor updated successfully' : 'Sponsor registered successfully');
      } else {
        setStatusMsg((await res.json()).error || 'Could not save sponsor.');
      }
    } catch (err: any) {
      setStatusMsg(err.message);
    }
  };

  const handleCreateSponsorCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { sponsorId, ...campaign } = campaignDraft;
      const res = await apiFetch(editingCampaignId ? `/api/monetization/sponsors/campaigns/${editingCampaignId}` : `/api/monetization/sponsors/${sponsorId}/campaigns`, {
        method: editingCampaignId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...campaign, agreedPrice: Number(campaign.agreedPrice), startDate: new Date(campaign.startDate).toISOString(), endDate: new Date(campaign.endDate).toISOString() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not create campaign.');
      setShowCampaignModal(false);
      setEditingCampaignId(null);
      await fetchSponsorsData();
      await fetchMonetizationAnalytics();
      setStatusMsg(editingCampaignId ? 'Sponsor campaign updated.' : 'Sponsor campaign created.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not create sponsor campaign.');
    }
  };

  const handleSponsorBannerUpload = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg('Banner images must be 5 MB or smaller.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatusMsg('Choose a JPEG, PNG, or WebP banner image.');
      return;
    }
    if (!campaignDraft.sponsorId) {
      setStatusMsg('Select a sponsor before uploading a banner.');
      return;
    }

    setUploadingBanner(true);
    try {
      const filename = `${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]/g, '-')}`;
      const presignResponse = await apiFetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename, contentType: file.type, contentId: campaignDraft.sponsorId, contentTypeCategory: 'sponsor_banner' }),
      });
      const presignData = await presignResponse.json();
      if (!presignResponse.ok) throw new Error(presignData.error || 'Could not prepare R2 upload.');

      const uploadResponse = await fetch(presignData.presignedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!uploadResponse.ok) throw new Error(`R2 upload failed with HTTP ${uploadResponse.status}. Check the bucket CORS policy.`);
      setCampaignDraft(previous => ({ ...previous, imageUrl: presignData.publicUrl }));
      setStatusMsg('Banner uploaded to R2.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not upload banner.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleCreateAffiliatePartner = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const res = await apiFetch(editingAffiliatePartnerId ? `/api/monetization/affiliate/partners/${editingAffiliatePartnerId}` : '/api/monetization/affiliate/partners', {
        method: editingAffiliatePartnerId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(affiliatePartnerDraft),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not create partner.');
      setShowAffiliatePartnerModal(false);
      setEditingAffiliatePartnerId(null);
      setAffiliatePartnerDraft({ partnerName: '', websiteUrl: '', description: '' });
      await fetchAffiliateData();
      setStatusMsg(editingAffiliatePartnerId ? 'Affiliate partner updated.' : 'Affiliate partner created.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not create affiliate partner.');
    }
  };

  const handleCreateAffiliateCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const res = await apiFetch(editingAffiliateCampaignId ? `/api/monetization/affiliate/campaigns/${editingAffiliateCampaignId}` : '/api/monetization/affiliate/campaigns', {
        method: editingAffiliateCampaignId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...affiliateCampaignDraft, startDate: new Date(affiliateCampaignDraft.startDate).toISOString(), endDate: new Date(affiliateCampaignDraft.endDate).toISOString() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not create affiliate campaign.');
      setShowAffiliateCampaignModal(false);
      setEditingAffiliateCampaignId(null);
      await fetchAffiliateData();
      setStatusMsg(editingAffiliateCampaignId ? 'Affiliate campaign updated.' : 'Affiliate campaign created.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not create affiliate campaign.');
    }
  };

  const handleRecordConversion = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const res = await apiFetch(`/api/monetization/affiliate/campaigns/${conversionCampaignId}/conversions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...conversionDraft, commissionRevenue: Number(conversionDraft.commissionRevenue) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not record conversion.');
      setConversionDraft({ externalReference: '', commissionRevenue: '', currency: 'USD' });
      await fetchAffiliateData();
      setStatusMsg('Conversion recorded as pending verification.');
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not record affiliate conversion.');
    }
  };

  const setConversionReview = async (conversionId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const res = await apiFetch(`/api/monetization/affiliate/conversions/${conversionId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not review conversion.');
      await fetchAffiliateData();
      await fetchMonetizationAnalytics();
      setStatusMsg(`Conversion ${status.toLowerCase()}.`);
    } catch (error: any) {
      setStatusMsg(error.message || 'Could not review conversion.');
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
          { id: 'monetag', label: 'Monetag', icon: Sparkles },
          { id: 'affiliate', label: 'Affiliate', icon: ExternalLink },
          { id: 'analytics', label: 'Revenue & Analytics', icon: BarChart3 },
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
              <div className="text-2xl font-black text-white">{metrics.totalWatchHours === null ? 'Not tracked' : `${metrics.totalWatchHours} hrs`}</div>
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
            <div className="flex gap-2">
              <button onClick={() => { setEditingSponsorId(null); setShowAddSponsorModal(true); }} className="px-3 py-2 rounded bg-neutral-800 text-white text-xs font-semibold"><Plus className="mr-1 inline h-4 w-4" /> Sponsor</button>
              <button disabled={!sponsors.length} onClick={() => { setEditingCampaignId(null); setCampaignDraft(previous => ({ ...previous, sponsorId: sponsors[0].id })); setShowCampaignModal(true); }} className="px-3 py-2 rounded bg-red-600 text-white text-xs font-semibold disabled:opacity-50"><Plus className="mr-1 inline h-4 w-4" /> Campaign</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sponsors.map(sp => (
              <div key={sp.id} className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <h3 className="font-bold text-white text-sm">{sp.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${sp.active ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>{sp.active ? 'Active' : 'Paused'}</span>
                    <button onClick={() => { setEditingSponsorId(sp.id); setSponsorName(sp.name); setSponsorWebsite(sp.websiteUrl); setShowAddSponsorModal(true); }} aria-label={`Edit ${sp.name}`} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-white">Edit</button>
                    <button onClick={() => updateSponsor(sp.id, { active: !sp.active })} aria-label={`${sp.active ? 'Pause' : 'Activate'} ${sp.name}`} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-neutral-300">{sp.active ? 'Pause' : 'Activate'}</button>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 truncate">{sp.websiteUrl}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Campaigns and payments</h3>
            {campaigns.map(campaign => {
              const campaignData = campaign as SponsorCampaign & { agreedPrice?: number | string; paidAmount?: number | string; outstandingAmount?: number | string };
              const impressions = campaignData.impressionsCount || 0;
              const clicks = campaignData.clicksCount || 0;
              const now = Date.now();
              const campaignStatus = !campaignData.active ? 'Paused' : new Date(campaignData.startDate).getTime() > now ? 'Scheduled' : new Date(campaignData.endDate).getTime() < now ? 'Ended' : 'Active';
              return (
                <div key={campaign.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center border-b border-neutral-800 py-3 text-xs">
                  <div>
                    <div className="font-semibold text-white">{campaign.name}</div>
                    <div className="text-neutral-500">{campaign.placement} · {campaignStatus}</div>
                    <div className="text-neutral-500">{new Date(campaignData.startDate).toLocaleDateString()} – {new Date(campaignData.endDate).toLocaleDateString()} · Payment {campaignData.internalPaymentStatus}</div>
                    <div className="text-neutral-500">{impressions.toLocaleString()} impressions · {clicks.toLocaleString()} clicks · CTR {impressions ? (clicks / impressions * 100).toFixed(2) : '0.00'}%</div>
                  </div>
                  <div className="text-neutral-300">Contracted ${Number(campaignData.agreedPrice || 0).toFixed(2)}</div>
                  <div className="text-neutral-300">Paid ${Number(campaignData.paidAmount || 0).toFixed(2)} · Outstanding ${Number(campaignData.outstandingAmount ?? Number(campaignData.agreedPrice || 0) - Number(campaignData.paidAmount || 0)).toFixed(2)}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      const creative = campaignData.creatives?.[0];
                      setCampaignDraft({ sponsorId: campaignData.sponsorId, name: campaignData.name, destinationUrl: campaignData.destinationUrl, imageUrl: creative?.imageUrl || '', creativeTitle: creative?.title || campaignData.name, tagline: creative?.tagline || '', placement: campaignData.placement, startDate: new Date(campaignData.startDate).toISOString().slice(0, 16), endDate: new Date(campaignData.endDate).toISOString().slice(0, 16), agreedPrice: String(campaignData.agreedPrice || 0) });
                      setEditingCampaignId(campaignData.id);
                      setShowCampaignModal(true);
                    }} className="rounded bg-neutral-800 px-2 py-1 text-white">Edit</button>
                    <input
                      aria-label={`Paid amount for ${campaign.name}`}
                      type="number"
                      min="0"
                      max={Number(campaignData.agreedPrice || 0)}
                      step="0.01"
                      value={paidInputs[campaign.id] ?? String(campaignData.paidAmount || 0)}
                      onChange={event => setPaidInputs(previous => ({ ...previous, [campaign.id]: event.target.value }))}
                      className="w-24 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-white"
                    />
                    <button onClick={() => updateSponsorCampaign(campaign.id, { paidAmount: Number(paidInputs[campaign.id] ?? campaignData.paidAmount ?? 0) })} className="rounded bg-neutral-800 px-2 py-1 text-white">Save</button>
                    <button onClick={() => updateSponsorCampaign(campaign.id, { active: !campaignData.active })} className="rounded bg-neutral-800 px-2 py-1 text-neutral-300">{campaignData.active ? 'Pause' : 'Activate'}</button>
                  </div>
                </div>
              );
            })}
            {campaigns.length === 0 && <p className="text-xs text-neutral-500">No sponsor campaigns recorded.</p>}
          </div>
        </div>
      )}

      {activeTab === 'monetag' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">Monetag placements</h2>
              <p className="text-xs text-neutral-400">Reported estimated revenue: ${Number(monetagRevenue).toFixed(2)}</p>
            </div>
            <span className="text-[10px] text-amber-300">Estimate only; not verified revenue</span>
          </div>
          <p className="border-l-2 border-amber-600 pl-3 text-xs text-neutral-400">Use a publisher-approved single-placement in-page tag. Do not use MultiTag or Onclick tags, which include popunder behavior. New placements are disabled until a Zone ID and approved tag are saved.</p>
          {monetagPlacements.map(item => (
            <div key={item.placement} className="grid gap-3 border-b border-neutral-800 py-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div>
                <label className="mb-1 block text-xs text-neutral-300" htmlFor={`monetag-zone-${item.placement}`}>{item.placement.replaceAll('_', ' ')} Zone ID</label>
                <input id={`monetag-zone-${item.placement}`} value={item.zoneId} onChange={event => updateMonetagDraft(item.placement, { zoneId: event.target.value })} className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-300" htmlFor={`monetag-tag-${item.placement}`}>Publisher tag snippet</label>
                <textarea id={`monetag-tag-${item.placement}`} value={item.tagCode} onChange={event => updateMonetagDraft(item.placement, { tagCode: event.target.value })} rows={3} className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-xs text-white" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-neutral-300">
                  <input type="checkbox" checked={item.enabled} onChange={event => updateMonetagDraft(item.placement, { enabled: event.target.checked })} aria-label={`Enable Monetag ${item.placement}`} />
                  Enabled
                </label>
                <button onClick={() => saveMonetagPlacement(item)} className="rounded bg-neutral-800 px-3 py-2 text-xs text-white">Save</button>
              </div>
            </div>
          ))}
          {monetagPlacements.length === 0 && <p className="text-xs text-neutral-500">No placement configuration is available.</p>}
        </div>
      )}

      {activeTab === 'affiliate' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-lg font-bold text-white">Affiliate partners and campaigns</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-300">Verified revenue: ${Number(affiliateData.verifiedRevenue || 0).toFixed(2)}</span>
              <button onClick={() => { setEditingAffiliatePartnerId(null); setAffiliatePartnerDraft({ partnerName: '', websiteUrl: '', description: '' }); setShowAffiliatePartnerModal(true); }} className="rounded bg-neutral-800 px-3 py-2 text-xs text-white"><Plus className="mr-1 inline h-4 w-4" /> Partner</button>
              <button disabled={!affiliateData.partners.length} onClick={() => { setEditingAffiliateCampaignId(null); setAffiliateCampaignDraft(previous => ({ ...previous, partnerId: affiliateData.partners[0].id })); setShowAffiliateCampaignModal(true); }} className="rounded bg-red-600 px-3 py-2 text-xs text-white disabled:opacity-50"><Plus className="mr-1 inline h-4 w-4" /> Campaign</button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {affiliateData.partners.map((partner: any) => (
              <div key={partner.id} className="flex items-center justify-between gap-2 border-b border-neutral-800 py-3">
                <div><div className="text-sm font-semibold text-white">{partner.partnerName}</div>
                <a href={partner.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-neutral-400">{partner.websiteUrl}</a>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingAffiliatePartnerId(partner.id); setAffiliatePartnerDraft({ partnerName: partner.partnerName, websiteUrl: partner.websiteUrl, description: partner.description || '' }); setShowAffiliatePartnerModal(true); }} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-white">Edit</button>
                  <button onClick={async () => { const res = await apiFetch(`/api/monetization/affiliate/partners/${partner.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !partner.active }) }); if (res.ok) fetchAffiliateData(); else setStatusMsg((await res.json()).error || 'Could not update partner.'); }} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-neutral-300">{partner.active ? 'Pause' : 'Activate'}</button>
                </div>
              </div>
            ))}
          </div>
          {affiliateData.campaigns.map((campaign: any) => (
            <div key={campaign.id} className="border-b border-neutral-800 py-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div><div className="font-semibold text-white">{campaign.campaignName} · {campaign.partner.partnerName}</div><div className="text-neutral-400">{campaign.placement} · {campaign.clicksCount} clicks · {!campaign.active ? 'Paused' : new Date(campaign.startDate) > new Date() ? 'Scheduled' : new Date(campaign.endDate) < new Date() ? 'Ended' : 'Active'}</div><div className="text-neutral-500">{new Date(campaign.startDate).toLocaleDateString()} – {new Date(campaign.endDate).toLocaleDateString()}</div></div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingAffiliateCampaignId(campaign.id); setAffiliateCampaignDraft({ partnerId: campaign.partnerId, campaignName: campaign.campaignName, destinationUrl: campaign.destinationUrl, trackingUrl: campaign.trackingUrl, imageUrl: campaign.imageUrl || '', placement: campaign.placement, startDate: new Date(campaign.startDate).toISOString().slice(0, 16), endDate: new Date(campaign.endDate).toISOString().slice(0, 16) }); setShowAffiliateCampaignModal(true); }} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-white">Edit</button>
                  <button onClick={async () => { const res = await apiFetch(`/api/monetization/affiliate/campaigns/${campaign.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !campaign.active }) }); if (res.ok) fetchAffiliateData(); else setStatusMsg((await res.json()).error || 'Could not update campaign.'); }} className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-neutral-300">{campaign.active ? 'Pause' : 'Activate'}</button>
                </div>
              </div>
              <form onSubmit={handleRecordConversion} className="mt-3 flex flex-wrap items-end gap-2 border-b border-neutral-900 pb-3">
                <input type="hidden" value={conversionCampaignId} />
                <label className="text-neutral-400">External conversion reference<input required value={conversionDraft.externalReference} onChange={event => { setConversionCampaignId(campaign.id); setConversionDraft(previous => ({ ...previous, externalReference: event.target.value })); }} className="mt-1 block rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-white" /></label>
                <label className="text-neutral-400">Commission<input required min="0" step="0.01" type="number" value={conversionCampaignId === campaign.id ? conversionDraft.commissionRevenue : ''} onFocus={() => setConversionCampaignId(campaign.id)} onChange={event => { setConversionCampaignId(campaign.id); setConversionDraft(previous => ({ ...previous, commissionRevenue: event.target.value })); }} className="mt-1 block w-28 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-white" /></label>
                <button type="submit" disabled={conversionCampaignId !== campaign.id} className="rounded bg-neutral-800 px-3 py-2 text-white disabled:opacity-50">Record pending</button>
              </form>
              <div className="mt-2 flex flex-wrap gap-2">
                {campaign.conversions.map((conversion: any) => (
                  <div key={conversion.id} className={`flex items-center gap-2 rounded px-2 py-1 ${conversion.status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-300' : conversion.status === 'REJECTED' ? 'bg-neutral-800 text-neutral-400' : 'bg-amber-950 text-amber-300'}`}>
                    <span>{conversion.status} · {conversion.currency} {Number(conversion.commissionRevenue).toFixed(2)} · Ref {conversion.externalReference || 'missing'}</span>
                    {conversion.status === 'PENDING' && <><button onClick={() => setConversionReview(conversion.id, 'VERIFIED')} className="font-bold underline">Verify</button><button onClick={() => setConversionReview(conversion.id, 'REJECTED')} className="underline">Reject</button></>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {affiliateData.campaigns.length === 0 && <p className="text-xs text-neutral-500">No affiliate campaigns recorded.</p>}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-white">Revenue and placement analytics</h2>
          {analytics && (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-xs">
                <div className="border-b border-neutral-800 py-3"><div className="text-neutral-400">Monetag reported estimate</div><div className="mt-1 text-emerald-300">${Number(analytics.monetagReportedEstimatedRevenue).toFixed(2)}</div></div>
                <div className="border-b border-neutral-800 py-3"><div className="text-neutral-400">Sponsor contracted</div><div className="mt-1 text-white">${Number(analytics.sponsorContractedRevenue).toFixed(2)}</div></div>
                <div className="border-b border-neutral-800 py-3"><div className="text-neutral-400">Sponsor paid</div><div className="mt-1 text-white">${Number(analytics.sponsorPaidRevenue).toFixed(2)}</div></div>
                <div className="border-b border-neutral-800 py-3"><div className="text-neutral-400">Sponsor outstanding</div><div className="mt-1 text-amber-300">${Number(analytics.sponsorOutstandingRevenue).toFixed(2)}</div></div>
                <div className="border-b border-neutral-800 py-3"><div className="text-neutral-400">Affiliate verified</div><div className="mt-1 text-emerald-300">${Number(analytics.affiliateVerifiedRevenue).toFixed(2)}</div></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 text-neutral-400"><tr><th className="py-2">Placement</th><th>Impressions</th><th>Clicks</th><th>CTR</th></tr></thead>
                  <tbody>{analytics.placementPerformance.map((row: any) => <tr key={row.placement} className="border-b border-neutral-900"><td className="py-2 text-neutral-200">{row.placement}</td><td>{row.impressions}</td><td>{row.clicks}</td><td>{Number(row.ctr).toFixed(2)}%</td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}
          {!analytics && <p className="text-xs text-neutral-500">Analytics are unavailable.</p>}
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
            <h3 className="text-lg font-bold text-white">{editingSponsorId ? 'Edit Sponsor Partner' : 'Register Sponsor Partner'}</h3>
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
                <button type="submit" className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold">{editingSponsorId ? 'Save Sponsor' : 'Register Sponsor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-lg font-bold text-white">{editingCampaignId ? 'Edit Sponsor Campaign' : 'Create Sponsor Campaign'}</h3>
            <form onSubmit={handleCreateSponsorCampaign} className="grid gap-3 sm:grid-cols-2 text-xs">
              <label className="sm:col-span-2 text-neutral-300">Sponsor
                <select required disabled={Boolean(editingCampaignId)} value={campaignDraft.sponsorId} onChange={event => setCampaignDraft(previous => ({ ...previous, sponsorId: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white">
                  <option value="">Select sponsor</option>{sponsors.map(sponsor => <option key={sponsor.id} value={sponsor.id}>{sponsor.name}</option>)}
                </select>
              </label>
              <label className="text-neutral-300">Campaign name<input required value={campaignDraft.name} onChange={event => setCampaignDraft(previous => ({ ...previous, name: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Placement<select value={campaignDraft.placement} onChange={event => setCampaignDraft(previous => ({ ...previous, placement: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white">{['HOME_BETWEEN_RAILS','HOME_BOTTOM_BANNER','BROWSE_BANNER','SEARCH_NATIVE','MOVIE_DETAILS_BANNER','SERIES_DETAILS_BANNER','PLAYER_COMPANION','FOOTER_BANNER'].map(placement => <option key={placement}>{placement}</option>)}</select></label>
              <label className="text-neutral-300 sm:col-span-2">Destination URL<input required type="url" value={campaignDraft.destinationUrl} onChange={event => setCampaignDraft(previous => ({ ...previous, destinationUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Creative title<input required value={campaignDraft.creativeTitle} onChange={event => setCampaignDraft(previous => ({ ...previous, creativeTitle: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Banner image URL<input required type="url" value={campaignDraft.imageUrl} onChange={event => setCampaignDraft(previous => ({ ...previous, imageUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Upload banner from device<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingBanner || !campaignDraft.sponsorId} onChange={event => { void handleSponsorBannerUpload(event.target.files?.[0]); event.currentTarget.value = ''; }} className="mt-1 block w-full text-xs text-neutral-300 file:mr-3 file:rounded file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-white disabled:opacity-50" />{uploadingBanner && <span className="mt-1 block text-amber-300">Uploading…</span>}</label>
              <label className="text-neutral-300 sm:col-span-2">Tagline<input value={campaignDraft.tagline} onChange={event => setCampaignDraft(previous => ({ ...previous, tagline: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Start date<input required type="datetime-local" value={campaignDraft.startDate} onChange={event => setCampaignDraft(previous => ({ ...previous, startDate: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">End date<input required type="datetime-local" value={campaignDraft.endDate} onChange={event => setCampaignDraft(previous => ({ ...previous, endDate: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Agreed price<input required min="0" step="0.01" type="number" value={campaignDraft.agreedPrice} onChange={event => setCampaignDraft(previous => ({ ...previous, agreedPrice: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowCampaignModal(false); setEditingCampaignId(null); }} className="rounded bg-neutral-800 px-4 py-2 text-neutral-300">Cancel</button>
                <button type="submit" className="rounded bg-red-600 px-4 py-2 font-bold text-white">{editingCampaignId ? 'Save Campaign' : 'Create Campaign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAffiliatePartnerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-lg font-bold text-white">{editingAffiliatePartnerId ? 'Edit Affiliate Partner' : 'Create Affiliate Partner'}</h3>
            <form onSubmit={handleCreateAffiliatePartner} className="space-y-3 text-xs">
              <label className="block text-neutral-300">Partner name<input required value={affiliatePartnerDraft.partnerName} onChange={event => setAffiliatePartnerDraft(previous => ({ ...previous, partnerName: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="block text-neutral-300">Website URL<input required type="url" value={affiliatePartnerDraft.websiteUrl} onChange={event => setAffiliatePartnerDraft(previous => ({ ...previous, websiteUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="block text-neutral-300">Description<input value={affiliatePartnerDraft.description} onChange={event => setAffiliatePartnerDraft(previous => ({ ...previous, description: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => { setShowAffiliatePartnerModal(false); setEditingAffiliatePartnerId(null); }} className="rounded bg-neutral-800 px-4 py-2 text-neutral-300">Cancel</button><button type="submit" className="rounded bg-red-600 px-4 py-2 font-bold text-white">Save Partner</button></div>
            </form>
          </div>
        </div>
      )}

      {showAffiliateCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-lg font-bold text-white">{editingAffiliateCampaignId ? 'Edit Affiliate Campaign' : 'Create Affiliate Campaign'}</h3>
            <form onSubmit={handleCreateAffiliateCampaign} className="grid gap-3 sm:grid-cols-2 text-xs">
              <label className="text-neutral-300">Partner<select required disabled={Boolean(editingAffiliateCampaignId)} value={affiliateCampaignDraft.partnerId} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, partnerId: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"><option value="">Select partner</option>{affiliateData.partners.map((partner: any) => <option key={partner.id} value={partner.id}>{partner.partnerName}</option>)}</select></label>
              <label className="text-neutral-300">Campaign name<input required value={affiliateCampaignDraft.campaignName} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, campaignName: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300 sm:col-span-2">Affiliate URL<input required type="url" value={affiliateCampaignDraft.destinationUrl} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, destinationUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300 sm:col-span-2">Tracking URL<input required type="url" value={affiliateCampaignDraft.trackingUrl} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, trackingUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300 sm:col-span-2">Creative image URL<input required type="url" value={affiliateCampaignDraft.imageUrl} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, imageUrl: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">Placement<select value={affiliateCampaignDraft.placement} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, placement: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white">{['HOME_BETWEEN_RAILS','HOME_BOTTOM_BANNER','BROWSE_BANNER','SEARCH_NATIVE','MOVIE_DETAILS_BANNER','SERIES_DETAILS_BANNER','PLAYER_COMPANION','FOOTER_BANNER'].map(placement => <option key={placement}>{placement}</option>)}</select></label>
              <label className="text-neutral-300">Start date<input required type="datetime-local" value={affiliateCampaignDraft.startDate} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, startDate: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <label className="text-neutral-300">End date<input required type="datetime-local" value={affiliateCampaignDraft.endDate} onChange={event => setAffiliateCampaignDraft(previous => ({ ...previous, endDate: event.target.value }))} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-white" /></label>
              <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={() => { setShowAffiliateCampaignModal(false); setEditingAffiliateCampaignId(null); }} className="rounded bg-neutral-800 px-4 py-2 text-neutral-300">Cancel</button><button type="submit" className="rounded bg-red-600 px-4 py-2 font-bold text-white">Save Campaign</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
