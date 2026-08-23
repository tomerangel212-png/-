/* Shared offline behavior injected by sw.js into every cached TRA document. */
(() => {
  "use strict";
  const message = "תוכן זה זקוק לחיבור לאינטרנט ולכן הוסתר במצב Offline.";
  const isExternal = (value) => {
    try { return new URL(value, location.href).origin !== location.origin; } catch { return false; }
  };
  const addNotice = (target) => {
    if (target.dataset.traOfflineNotice === "true") return;
    target.dataset.traOfflineNotice = "true";
    const notice = document.createElement("p");
    notice.className = "tra-offline-external-notice";
    notice.textContent = message;
    target.after(notice);
  };
  const apply = () => {
    document.documentElement.dataset.traNetwork = navigator.onLine ? "online" : "offline";
    if (navigator.onLine) return;
    document.querySelectorAll("[data-tra-online-only]").forEach((target) => {
      target.setAttribute("aria-disabled", "true");
      addNotice(target);
    });
    document.querySelectorAll("iframe[src]").forEach((frame) => {
      if (!isExternal(frame.src)) return;
      frame.hidden = true;
      addNotice(frame);
    });
  };
  window.addEventListener("online", apply);
  window.addEventListener("offline", apply);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply, { once: true });
  else apply();
})();
