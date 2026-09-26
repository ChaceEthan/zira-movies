import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api';

export type MonetagPlacement =
  | 'HOME_BETWEEN_RAILS'
  | 'HOME_BOTTOM_BANNER'
  | 'BROWSE_BANNER'
  | 'SEARCH_NATIVE'
  | 'MOVIE_DETAILS_BANNER'
  | 'SERIES_DETAILS_BANNER'
  | 'PLAYER_COMPANION'
  | 'FOOTER_BANNER';

interface MonetagConfig {
  enabled: boolean;
  zoneId: string | null;
  tagCode: string | null;
}

const loadedZoneTags = new Set<string>();
const loadingZoneTags = new Set<string>();

interface MonetagAdProps {
  placement: MonetagPlacement;
  className?: string;
}

export function MonetagAd({ placement, className = '' }: MonetagAdProps) {
  const [config, setConfig] = useState<MonetagConfig | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch(`/api/monetization/monetag/placement?placement=${encodeURIComponent(placement)}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) return null;
        return response.json() as Promise<MonetagConfig>;
      })
      .then(value => {
        if (!controller.signal.aborted) setConfig(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setConfig(null);
      });

    return () => controller.abort();
  }, [placement]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !config?.enabled || !config.zoneId || !config.tagCode || loadedZoneTags.has(config.zoneId) || loadingZoneTags.has(config.zoneId)) return;

    const parsedTag = new DOMParser().parseFromString(config.tagCode, 'text/html');
    const sourceTag = parsedTag.querySelector('script');
    if (!sourceTag || parsedTag.querySelectorAll('script').length !== 1 || parsedTag.body.childElementCount !== 1 || parsedTag.body.firstElementChild !== sourceTag) return;

    const sourceUrl = sourceTag.getAttribute('src');
    if (!sourceUrl) return;

    let tagUrl: URL;
    try {
      tagUrl = new URL(sourceUrl);
    } catch {
      return;
    }
    if (tagUrl.protocol !== 'https:') return;
    const embeddedZone = sourceTag.dataset.zone;
    if (embeddedZone && embeddedZone !== config.zoneId) return;

    const script = document.createElement('script');
    for (const attribute of Array.from(sourceTag.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name === 'src' || name.startsWith('on')) continue;
      if (name === 'async' || name === 'defer' || name === 'crossorigin' || name === 'referrerpolicy' || name === 'integrity' || name === 'type' || name.startsWith('data-')) {
        script.setAttribute(name, attribute.value);
      }
    }
    script.async = true;
    script.src = tagUrl.toString();
    script.dataset.zone = config.zoneId;
    script.dataset.ziraPlacement = placement;
    loadingZoneTags.add(config.zoneId);
    script.onload = () => {
      loadingZoneTags.delete(config.zoneId!);
      loadedZoneTags.add(config.zoneId!);
    };
    script.onerror = () => {
      loadingZoneTags.delete(config.zoneId!);
      script.remove();
    };
    target.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
      if (!loadedZoneTags.has(config.zoneId!)) {
        loadingZoneTags.delete(config.zoneId!);
        script.remove();
      }
    };
  }, [config, placement]);

  if (!config?.enabled || !config.zoneId || !config.tagCode) return null;

  return (
    <div
      className={`zira-monetag-placement ${className}`}
      ref={targetRef}
      data-monetag-placement={placement}
      data-monetag-zone={config.zoneId}
      aria-label="Advertisement"
    />
  );
}
