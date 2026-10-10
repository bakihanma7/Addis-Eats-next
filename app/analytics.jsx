import Script from 'next/script';

// Optional third-party analytics (Plausible). Renders nothing unless
// NEXT_PUBLIC_ANALYTICS_DOMAIN is set, so there is no third-party request by default.
// `lazyOnload` waits until the browser is idle after the page has loaded, so the
// script can't delay first paint, LCP or interaction readiness.
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
  if (!domain) return null;
  return <Script src="https://plausible.io/js/script.js" data-domain={domain} strategy="lazyOnload" />;
}
