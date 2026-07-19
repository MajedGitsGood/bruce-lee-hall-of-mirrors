// telemetry.js — privacy-first, vendor-agnostic usage + error tracking.
//
// INERT BY DEFAULT: with both config values blank, this file loads, wires up a global
// `track(event, props)` no-op-ish helper, and injects NOTHING external — the game stays 100%
// self-contained. Fill in the two values below to turn tracking on. Both are client-side/public by
// design (a GoatCounter site code and a Sentry DSN are meant to live in page source — they are not
// secrets), so they are safe to commit to a public repo.
//
// See docs/TELEMETRY.md for how to get each value.
(function () {
  'use strict';

  var CONFIG = {
    // GoatCounter site code only. e.g. 'bruce-lee' → https://bruce-lee.goatcounter.com
    goatcounterCode: '',
    // Sentry project DSN. e.g. 'https://abcd1234@o0.ingest.sentry.io/0'
    sentryDsn: '',
  };

  // Respect Do Not Track for analytics (not for crash reports — those carry no personal data here).
  var DNT =
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    navigator.msDoNotTrack === '1';

  var analyticsOn = !!CONFIG.goatcounterCode && !DNT;
  var gcReady = false;
  var gcQueue = [];

  // ── GoatCounter (cookie-free page + event analytics) ──────────────────────────
  function initAnalytics() {
    if (!analyticsOn) return;
    window.goatcounter = window.goatcounter || {};
    var s = document.createElement('script');
    s.async = true;
    s.src = '//gc.zgo.at/count.js';
    s.setAttribute(
      'data-goatcounter',
      'https://' + CONFIG.goatcounterCode + '.goatcounter.com/count'
    );
    s.addEventListener('load', function () {
      gcReady = true;
      flushGc();
    });
    document.head.appendChild(s);
  }

  function flushGc() {
    if (!gcReady || !window.goatcounter || !window.goatcounter.count) return;
    while (gcQueue.length) window.goatcounter.count(gcQueue.shift());
  }

  // ── Sentry (crash/error reporting, no-build loader) ───────────────────────────
  function initSentry() {
    if (!CONFIG.sentryDsn) return;
    var m = CONFIG.sentryDsn.match(/^https?:\/\/([^@]+)@/);
    if (!m) return; // malformed DSN → skip rather than break the page
    window.sentryOnLoad = function () {
      window.Sentry.init({ dsn: CONFIG.sentryDsn, sendDefaultPii: false, tracesSampleRate: 0 });
    };
    var s = document.createElement('script');
    s.src = 'https://js.sentry-cdn.com/' + m[1] + '.min.js';
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  // ── Public API: track(event, props) ───────────────────────────────────────────
  // Vendor-agnostic. Add/rename events in game.js without touching provider code.
  function track(event, props) {
    props = props || {};
    if (window.Sentry && window.Sentry.addBreadcrumb) {
      window.Sentry.addBreadcrumb({ category: 'game', message: event, level: 'info', data: props });
    }
    if (analyticsOn) {
      var ev = { path: 'evt/' + event, title: event, event: true };
      if (gcReady && window.goatcounter && window.goatcounter.count) window.goatcounter.count(ev);
      else gcQueue.push(ev);
    }
    if (window.DEBUG) console.log('[track]', event, props);
  }
  window.track = track;

  // ── Errors → a lightweight analytics event too, so you get bug signal even with
  //    Sentry off (Sentry, when on, captures the full stack separately). ──────────
  window.addEventListener('error', function (e) {
    track('js-error', { msg: (e && e.message) || 'error' });
  });
  window.addEventListener('unhandledrejection', function () {
    track('js-rejection', {});
  });

  initSentry();
  initAnalytics();
})();
