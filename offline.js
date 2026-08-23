(() => {
  "use strict";
  const catalog = globalThis.TRA_OFFLINE_CATALOG;
  const byId = (id) => document.getElementById(id);
  const status = byId("offline-status");
  const setStatus = (text, state = "") => {
    status.textContent = text;
    status.dataset.state = state;
  };
  const renderPages = () => {
    const container = byId("site-list");
    if (!catalog?.pages?.length) {
      container.textContent = "המניפסט המקומי עדיין לא נבנה.";
      return;
    }
    catalog.pages.forEach((page) => {
      const link = document.createElement("a");
      link.className = "site";
      link.href = page.route;
      const title = document.createElement("h3");
      title.textContent = page.title;
      const detail = document.createElement("p");
      detail.textContent = page.path;
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = page.section === "archive" ? "ארכיון" : "זמין אופליין";
      link.append(title, detail, tag);
      container.append(link);
    });
    byId("coverage").textContent = `${catalog.coverage.trackedPages} אתרים/דפים · ${catalog.coverage.cachedFiles} קבצים מקומיים`;
  };
  const renderSiteRegistry = () => {
    const container = byId("sites-registry-list");
    const sites = catalog?.siteRegistry || [];
    if (!sites.length) {
      container.textContent = "לא נמצא רישום Sites מקומי.";
      return;
    }
    sites.forEach((site) => {
      const card = site.url ? document.createElement("a") : document.createElement("article");
      card.className = "site";
      if (site.url) {
        card.href = site.url;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
      }
      const title = document.createElement("h3");
      title.textContent = site.title;
      const detail = document.createElement("p");
      detail.textContent = site.publication === "live" ? "פתיחה מקוונת בלבד" : "טיוטה לא־מפורסמת";
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = site.publication === "live" ? "נדרש מיגרציה לאופליין" : "לא פורסם";
      card.append(title, detail, tag);
      container.append(card);
    });
  };
  const requestStatus = () => navigator.serviceWorker?.controller?.postMessage({ type: "TRA_OFFLINE_STATUS" });
  const register = async () => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      setStatus("הקטלוג עובד מקומית. להתקנת המטמון פתחו אותו דרך האתר המאובטח פעם אחת.", "warn");
      return;
    }
    try {
      await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      await navigator.serviceWorker.ready;
      requestStatus();
      setStatus("המטמון מותקן או מתעדכן. אפשר לפתוח את הדפים גם ללא חיבור.", "ready");
    } catch {
      setStatus("לא ניתן היה להתקין את מטמון האופליין בדפדפן זה.", "warn");
    }
  };
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type !== "TRA_OFFLINE_STATUS") return;
    const { cached = 0, total = 0, failed = 0 } = event.data;
    setStatus(failed ? `המטמון חלקי: ${cached}/${total} קבצים. התחברו לרשת ורעננו.` : `מוכן לאופליין: ${cached}/${total} קבצים נשמרו במכשיר.`, failed ? "warn" : "ready");
  });
  byId("refresh-offline").addEventListener("click", async () => {
    await register();
    navigator.serviceWorker?.controller?.postMessage({ type: "TRA_CACHE_ALL" });
  });
  renderPages();
  renderSiteRegistry();
  register();
})();
