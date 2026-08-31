"use strict";

(() => {
  const script = document.currentScript;
  const scriptUrl = new URL(script?.src || location.href, location.href);
  const rootUrl = new URL("./", scriptUrl);
  const page = location.pathname.split("/").filter(Boolean).pop() || "index";
  const OPERATIONAL_QUALITY = "99.99/100";

  document.documentElement.dataset.traVersion = "9.9";
  document.documentElement.dataset.traQuality = "10/10";
  document.documentElement.dataset.traOperationalQuality = OPERATIONAL_QUALITY;
  document.documentElement.dataset.traPerfectTarget = "9999999999/9999999999";

  const style = document.createElement("style");
  style.textContent = `
    html{scroll-behavior:smooth;overflow-x:hidden}
    body{overflow-x:hidden;-webkit-text-size-adjust:100%}
    :where(a,button,input,select,textarea,[role="button"],[tabindex]):focus-visible{outline:3px solid #f4cb67!important;outline-offset:3px!important}
    :where(button,input,select,textarea,[role="button"]){min-block-size:44px}
    :where(img,video,canvas,svg){max-inline-size:100%}
    .tra-skip{position:fixed;z-index:2147483647;top:8px;right:8px;transform:translateY(-150%);background:#fff;color:#111;padding:10px 14px;border-radius:10px;font:700 14px/1.2 system-ui;text-decoration:none;box-shadow:0 6px 24px #0004}.tra-skip:focus{transform:none}
    .tra-quality-badge{position:fixed;z-index:2147483646;left:max(10px,env(safe-area-inset-left));bottom:max(10px,env(safe-area-inset-bottom));display:inline-flex;gap:6px;align-items:center;padding:8px 11px;border:1px solid #ffffff2e;border-radius:999px;background:#0d1715e8;color:#fff;font:800 12px/1 system-ui;box-shadow:0 8px 26px #0005;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);text-decoration:none}.tra-quality-badge strong{color:#f4cb67}
    .tra-network-status{position:fixed;z-index:2147483645;left:max(10px,env(safe-area-inset-left));bottom:max(54px,calc(env(safe-area-inset-bottom) + 54px));max-width:min(340px,calc(100vw - 20px));padding:9px 12px;border-radius:12px;background:#151b20e8;color:#fff;font:700 12px/1.4 system-ui;box-shadow:0 8px 24px #0004;opacity:0;transform:translateY(8px);pointer-events:none;transition:.18s ease}.tra-network-status.show{opacity:1;transform:none}
    .tra-copyright{max-width:1100px;margin:36px auto 0;padding:18px max(16px,env(safe-area-inset-right)) calc(76px + env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));text-align:center;font:600 12px/1.5 system-ui;color:inherit;opacity:.72}
    .audio-fallbacks{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:7px;margin-top:10px}.audio-fallbacks[hidden]{display:none}.audio-fallbacks .muted{width:100%;text-align:center}.provider-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:8px 11px;border-radius:999px;background:#eef5ef;color:#173c33!important;text-decoration:none;font-weight:850;border:1px solid #b8c8bf}
    .chess-review{margin-top:14px;padding:14px;border:1px solid #b9cbbf;border-radius:16px;background:#f7faf7;color:#18352c}.chess-review h3{margin:5px 0 10px}.review-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.review-actions button{border:1px solid #8a9f94;border-radius:11px;padding:9px;background:#fff;color:#18352c;font-weight:850}.review-text{margin-top:9px;min-height:42px;padding:10px;border-radius:10px;background:#e7eee9;font-size:.85rem;line-height:1.45}.square.hinted{box-shadow:inset 0 0 0 6px #59c9ff!important}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
    @media(forced-colors:active){.tra-quality-badge,.tra-network-status{forced-color-adjust:auto;border:1px solid CanvasText}.tra-skip:focus{outline:3px solid Highlight!important}}
    @media(max-width:520px){.tra-quality-badge{font-size:11px;padding:7px 9px}.review-actions{grid-template-columns:1fr}}
  `;
  document.head.append(style);

  const ensureMain = () => {
    let main = document.querySelector("main");
    if (!main) {
      const candidate = document.querySelector(".wrap,.app,.shell") || document.body;
      candidate.setAttribute("role", candidate.getAttribute("role") || "main");
      candidate.id ||= "main-content";
      return candidate;
    }
    main.id ||= "main-content";
    return main;
  };

  const announce = (message) => {
    let el = document.querySelector(".tra-network-status");
    if (!el) {
      el = document.createElement("div");
      el.className = "tra-network-status";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.append(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => el.classList.remove("show"), 2600);
  };

  const track = (event, properties = {}) => {
    try {
      window.posthog?.capture?.(event, {
        page,
        tra_version: "9.9",
        tra_quality: "10/10",
        tra_operational_quality: OPERATIONAL_QUALITY,
        tra_perfect_target: "9999999999/9999999999",
        ...properties
      });
    } catch {}
  };

  const hardenDom = () => {
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      rel.add("noreferrer");
      link.setAttribute("rel", [...rel].join(" "));
    });
    document.querySelectorAll("iframe").forEach(frame => {
      if (!frame.hasAttribute("title")) frame.setAttribute("title", "Embedded content");
      if (!frame.hasAttribute("loading")) frame.setAttribute("loading", "lazy");
    });
    document.querySelectorAll("img").forEach((img, index) => {
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
      if (index > 0 && !img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    });
    document.querySelectorAll("audio,video").forEach(media => {
      media.setAttribute("playsinline", "");
      if (!media.hasAttribute("preload")) media.setAttribute("preload", "metadata");
    });
  };

  const mountCopyright = () => {
    if (document.querySelector(".tra-copyright")) return;
    const footer = document.createElement("footer");
    footer.className = "tra-copyright";
    footer.setAttribute("aria-label", "Copyright");
    footer.textContent = "© 2026 Tomer Rafael Angel · כל הזכויות שמורות / All Rights Reserved";
    document.body.append(footer);
  };

  const startPerformanceEvidence = () => {
    if (!("PerformanceObserver" in window)) return;
    const metrics = { lcp: 0, cls: 0, inp: 0, long_tasks: 0 };
    const observe = (type, handler) => {
      try {
        const observer = new PerformanceObserver(list => list.getEntries().forEach(handler));
        observer.observe({ type, buffered: true });
      } catch {}
    };
    observe("largest-contentful-paint", entry => { metrics.lcp = Math.max(metrics.lcp, Math.round(entry.startTime)); });
    observe("layout-shift", entry => { if (!entry.hadRecentInput) metrics.cls = Number((metrics.cls + entry.value).toFixed(4)); });
    observe("event", entry => { if (entry.interactionId) metrics.inp = Math.max(metrics.inp, Math.round(entry.duration)); });
    observe("longtask", () => { metrics.long_tasks += 1; });
    let sent = false;
    const flush = () => {
      if (sent) return;
      sent = true;
      track("tra_web_vitals", metrics);
    };
    window.addEventListener("pagehide", flush, { once: true });
    setTimeout(flush, 10000);
  };

  const mount = () => {
    const main = ensureMain();
    hardenDom();
    if (main && !document.querySelector(".tra-skip")) {
      const skip = document.createElement("a");
      skip.className = "tra-skip";
      skip.href = `#${main.id}`;
      skip.textContent = "דלגו לתוכן";
      document.body.prepend(skip);
    }
    if (!document.querySelector(".tra-quality-badge")) {
      const badge = document.createElement("a");
      badge.className = "tra-quality-badge";
      badge.href = new URL("TRA_VERSION_HISTORY.md", rootUrl).href;
      badge.setAttribute("aria-label", "TRA 9.9, operational quality target 99.99 out of 100");
      badge.innerHTML = `<span>TRA 9.9</span><strong>${OPERATIONAL_QUALITY}</strong>`;
      document.body.append(badge);
    }
    mountCopyright();
    startPerformanceEvidence();
    track("tra_page_quality_loaded", { online: navigator.onLine, save_data: Boolean(navigator.connection?.saveData) });
    if (!navigator.onLine) announce("📴 מצב Offline — האתר ממשיך לעבוד מהמטמון כשאפשר.");
  };

  window.addEventListener("online", () => { announce("✅ החיבור חזר."); track("tra_network_online"); });
  window.addEventListener("offline", () => { announce("📴 אין חיבור כרגע. עוברים ל־Offline."); track("tra_network_offline"); });
  window.addEventListener("error", event => track("tra_runtime_error", { message: String(event.message || "error").slice(0, 180), source: String(event.filename || "").slice(-120) }));
  window.addEventListener("unhandledrejection", event => track("tra_unhandled_rejection", { reason: String(event.reason?.message || event.reason || "rejection").slice(0, 180) }));

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    const sw = new URL("sw.js", rootUrl);
    navigator.serviceWorker.register(sw.href, { scope: rootUrl.pathname }).catch(error => track("tra_service_worker_error", { message: String(error?.message || error).slice(0, 180) }));
  }

  fetch(new URL("TRA_VERSION.json", rootUrl), { cache: "no-store" })
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!data?.version) return;
      document.documentElement.dataset.traVersion = data.version;
      if (data.operational_quality_target) document.documentElement.dataset.traOperationalQuality = data.operational_quality_target;
      if (data.perfect_target) document.documentElement.dataset.traPerfectTarget = data.perfect_target;
      const badgeVersion = document.querySelector(".tra-quality-badge span");
      const badgeScore = document.querySelector(".tra-quality-badge strong");
      if (badgeVersion) badgeVersion.textContent = `TRA ${data.version}`;
      if (badgeScore && data.operational_quality_target) badgeScore.textContent = data.operational_quality_target;
    })
    .catch(() => {});

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
