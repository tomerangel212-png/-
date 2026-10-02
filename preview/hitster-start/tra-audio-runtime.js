"use strict";
(function () {
  function timeoutError() { var error = new Error("Audio preparation timed out"); error.name = "TimeoutError"; return error; }
  function bounded(operation, milliseconds, cancel) {
    var timer;
    var limit = new Promise(function (_, reject) {
      timer = setTimeout(function () { if (cancel) cancel(); reject(timeoutError()); }, milliseconds);
    });
    return Promise.race([Promise.resolve().then(operation), limit]).finally(function () { clearTimeout(timer); });
  }
  function request(url, options, milliseconds, consume) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var config = Object.assign({}, options || {});
    if (controller) config.signal = controller.signal;
    return bounded(async function () {
      var response = await fetch(url, config);
      if (!response.ok) throw new Error("Audio HTTP " + response.status);
      return consume ? await consume(response) : response;
    }, milliseconds, function () { if (controller) controller.abort(); });
  }
  function durationIsValid(media) { var n = Number(media && media.duration); return Number.isFinite(n) && n >= 29; }
  function json(url, options, milliseconds) { return request(url, options, milliseconds || 6000, function (r) { return r.json(); }); }
  function capture(name, properties) {
    var details = Object.assign({ audio_build: "20260930-bounded", page: location.pathname }, properties || {});
    try { if (window.posthog && window.posthog.capture) window.posthog.capture(name, details); } catch (error) {}
    // Diagnostics remain inspectable even when the analytics SDK is blocked.
    window.dispatchEvent(new CustomEvent("tra-audio-diagnostic", { detail: { event: name, properties: details } }));
  }
  if (!window.posthog && /^(tomerangel212-png.github.io)$/.test(location.hostname)) {
!function(t,e){var o,n,p,r;e.__SV||(window.posthog&&window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}p||((p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",p.onerror=function(){p=null},(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r));var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister get_distinct_id get_session_id opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing set_config".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_va9g3UBzamuTv5vAe4PYnbwrDwdxY2d5WboVW7VWtVBE',{api_host:'https://us.i.posthog.com',defaults:'2026-05-30',capture_pageview:false,autocapture:false,disable_session_recording:true,person_profiles:'identified_only'});

  }
  window.TRAAudio = { bounded: bounded, request: request, json: json, durationIsValid: durationIsValid, capture: capture };
}());
