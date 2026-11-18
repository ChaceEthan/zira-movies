import React, { useState } from 'react';
import {
  Crown,
  Check,
  ShieldCheck,
  Sparkles,
  Play,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { VipConfig, VipPlan } from '../types';
import { apiFetch } from '../api';

interface VipViewProps {
  vipConfig: VipConfig | null;
  paymentGatewayConfigured: boolean;
  onContinueFreeStreaming: () => void;
}

export function VipView({
  vipConfig,
  paymentGatewayConfigured,
  onContinueFreeStreaming,
}: VipViewProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    vipConfig?.plans.find(p => p.popular)?.id || vipConfig?.plans[0]?.id || 'vip-quarterly',
  );
  const [checkoutStatus, setCheckoutStatus] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  const activePlans: VipPlan[] = (vipConfig?.plans || []).filter(p => p.active);
  const enabledBenefits = (vipConfig?.benefits || []).filter(b => b.enabled);

  const handleRequestCheckout = async (planId: string) => {
    setSelectedPlanId(planId);
    setCheckoutStatus({ loading: true, error: null });
    try {
      const res = await apiFetch('/api/vip/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutStatus({
          loading: false,
          error:
            data.error ||
            'Payment provider credentials are not configured on this server. All authorized content remains 100% free to watch.',
        });
        return;
      }
      setCheckoutStatus({ loading: false, error: null });
    } catch {
      setCheckoutStatus({
        loading: false,
        error:
          'Unable to connect to live payment processor. All authorized movies and series on ZIRA remain 100% free to watch.',
      });
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Hero VIP Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#171206] via-[#0f131d] to-[#1f1304] border border-amber-500/40 p-6 sm:p-10 shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider">
            <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>ZIRA GOLD VIP EXPERIENCE (OPTIONAL)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Gura VIP — <span className="text-amber-400">Kureba Nta Kwamamaza</span>
          </h1>

          <p className="text-xs sm:text-base text-neutral-200 leading-relaxed">
            Kuri ZIRA, filime na series zose zifite uburenganzira bwemewe zirebwa{' '}
            <strong className="text-emerald-400">ku buntu (100% Free)</strong> nta tegeko ryo kwishyura.
            Ubukungu bwa VIP ni ubushake bw'umufana ushaka kureba nta matangazo yamamaza (Ad-Free) no kubona ikirango cya Zahabu cya VIP.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onContinueFreeStreaming}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Komeza Urebe ku Ubuntu (Watch Free Catalog)</span>
            </button>
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Nta kwishyura guhatiriza • No Compulsory Subscription</span>
            </span>
          </div>
        </div>
      </div>

      {/* Configurable VIP Benefits Section */}
      <div className="bg-[#0b0f17] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Ibyiza bya ZIRA VIP (Configured Benefits)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Ibi byiza bigenzurwa n'ubuyobozi bwa ZIRA muri Admin Console.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enabledBenefits.map(benefit => (
            <div
              key={benefit.id}
              className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4 flex items-start gap-3.5"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">{benefit.titleRw || benefit.title}</h3>
                <div className="text-[11px] font-semibold text-amber-400/90">{benefit.title}</div>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VIP Plans Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Hitamo Ifatabuguzi rya VIP (Optional VIP Plans)
          </h2>
          <span className="text-xs font-semibold text-neutral-400">
            Ibiciro n'igihe bigenwa n'Ubuyobozi bwa ZIRA
          </span>
        </div>

        {checkoutStatus.error && (
          <div className="rounded-2xl bg-amber-950/50 border border-amber-500/50 p-4 flex items-start gap-3 text-xs sm:text-sm text-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <div className="font-bold text-amber-300">
                Kwishyura kuri interineti ntabwo birafungurwa (Payment Gateway Not Yet Active)
              </div>
              <p className="text-amber-100/90 leading-relaxed">{checkoutStatus.error}</p>
              <button
                type="button"
                onClick={onContinueFreeStreaming}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 text-neutral-950 font-black text-xs"
              >
                <Play className="w-3.5 h-3.5 fill-neutral-950" />
                <span>Subira Kureba Filime ku Ubuntu</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {activePlans.map(plan => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all border ${
                  plan.popular
                    ? 'bg-gradient-to-b from-[#1c1607] to-[#0d111a] border-amber-400 shadow-xl shadow-amber-950/30'
                    : isSelected
                      ? 'bg-[#111724] border-amber-500/60'
                      : 'bg-[#0d111a] border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {plan.badgeText && (
                  <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 text-[10px] font-black uppercase tracking-wider shadow">
                    {plan.badgeText}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      {plan.name}
                    </div>
                    <h3 className="text-xl font-black text-white mt-0.5">{plan.nameRw}</h3>
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-white">
                        {plan.priceRwf.toLocaleString()} RWF
                      </span>
                      <span className="text-xs text-neutral-400">/ {plan.durationDays} iminsi</span>
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      (~${plan.priceUsd.toFixed(2)} USD)
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-neutral-300 pt-2">
                    {enabledBenefits.slice(0, 4).map(b => (
                      <li key={b.id} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>{b.titleRw || b.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={checkoutStatus.loading}
                  onClick={e => {
                    e.stopPropagation();
                    void handleRequestCheckout(plan.id);
                  }}
                  className={`mt-6 w-full py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 shadow-lg'
                      : 'bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-white border border-neutral-700'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span>
                    {paymentGatewayConfigured
                      ? `Gura ${plan.nameRw}`
                      : `Saba ${plan.nameRw}`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Verification Transparency Footer */}
        <div className="rounded-2xl bg-neutral-900/50 border border-neutral-800 p-4 flex items-center justify-between flex-wrap gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              ZIRA ntabwo yakira amafaranga adafite icyemezo cy'ubwishyu bwemewe (Verified Payment Gateway Only).
            </span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            Gateway Status: {paymentGatewayConfigured ? 'LIVE VERIFIED' : 'AWAITING PROVIDER KEYS'}
          </span>
        </div>
      </div>
    </div>
  );
}
