import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useParams } from 'react-router-dom';
import { persistAffiliateReferralId } from '@/lib/affiliateReferral';

const DEFAULT_AFFILIATE_IFRAME_URL = 'https://thescoremachine.com/affiliate/embed';
const DEFAULT_REGISTER_TITLE = 'Start Your Success Journey';

function normalizeAffiliateIframeUrl(rawUrl?: string) {
  const trimmed = String(rawUrl || '').trim();

  if (!trimmed) {
    return DEFAULT_AFFILIATE_IFRAME_URL;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    if (typeof window === 'undefined') {
      return trimmed;
    }

    return new URL(trimmed, window.location.origin).toString();
  }

  return `https://${trimmed}`;
}

function buildIframeSrc(baseUrl: string, affiliateId?: string, search?: string) {
  const normalizedAffiliateId = String(affiliateId || '').trim();
  const normalizedSearch = String(search || '');

  if (typeof window === 'undefined') {
    return baseUrl;
  }

  const iframeUrl = new URL(baseUrl, window.location.origin);
  const normalizedPath = iframeUrl.pathname.replace(/\/+$/, '');
  if (normalizedPath.endsWith('/affiliate') && !normalizedPath.endsWith('/affiliate/embed')) {
    iframeUrl.pathname = `${normalizedPath}/embed`;
  }
  const currentParams = new URLSearchParams(normalizedSearch);

  if (normalizedAffiliateId) {
    iframeUrl.searchParams.set('ref', normalizedAffiliateId);
  }

  currentParams.forEach((value, key) => {
    if (!iframeUrl.searchParams.has(key)) {
      iframeUrl.searchParams.set(key, value);
    }
  });

  if (!iframeUrl.searchParams.has('register_title')) {
    iframeUrl.searchParams.set('register_title', DEFAULT_REGISTER_TITLE);
  }

  iframeUrl.searchParams.set('embedded', '1');

  return iframeUrl.toString();
}

const AffiliateReferralIframe: React.FC = () => {
  const { affiliateId } = useParams<{ affiliateId?: string }>();
  const location = useLocation();

  useEffect(() => {
    if (!affiliateId) {
      return;
    }

    persistAffiliateReferralId(affiliateId);
  }, [affiliateId]);

  const iframeSrc = useMemo(() => {
    const configuredUrl = (import.meta as ImportMeta & {
      env?: Record<string, string | undefined>;
    }).env?.VITE_AFFILIATE_IFRAME_URL;

    return buildIframeSrc(
      normalizeAffiliateIframeUrl(configuredUrl),
      affiliateId,
      location.search,
    );
  }, [affiliateId, location.search]);

  return (
    <div className="min-h-screen bg-slate-950">
      <Helmet>
        <title>Affiliate Invite | Score Machine</title>
        <meta
          name="description"
          content="Affiliate invite link powered by Score Machine."
        />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <iframe
        key={iframeSrc}
        src={iframeSrc}
        title="Score Machine Affiliate Invite"
        className="block h-screen w-full border-0"
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
};

export default AffiliateReferralIframe;