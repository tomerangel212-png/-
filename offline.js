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
  register();
})();
