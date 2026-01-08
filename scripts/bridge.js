/* --------------------------------------------------------------------------
   DashHub Extension Bridge
   - Injects extension data into the Dash website DOM
   -------------------------------------------------------------------------- */

(function () {
  "use strict";

  const fetchAndInject = () => {
    chrome.storage.local.get(
      ["repo", "DashHub_hook", "DashHub_username"],
      (data) => {
        // 1. DOM Update
        let container = document.getElementById("DashHub-dash-data");
        if (!container) {
          container = document.createElement("div");
          container.id = "DashHub-dash-data";
          container.style.display = "none";
          if (document.documentElement) {
            document.documentElement.appendChild(container);
          } else {
            document.addEventListener("DOMContentLoaded", () => {
              document.documentElement.appendChild(container);
            });
          }
        }

        container.setAttribute("data-repo", data.repo || "");
        container.setAttribute("data-hook", data.DashHub_hook || "");
        container.setAttribute("data-username", data.DashHub_username || "");
        container.setAttribute("data-extension-installed", "true");
        container.setAttribute("data-extension-id", chrome.runtime.id);

        // 2. Dispatch Event
        window.dispatchEvent(
          new CustomEvent("DashHub-dash-ready", {
            detail: {
              repo: data.repo || null,
              hook: data.DashHub_hook || null,
              username: data.DashHub_username || null,
              extensionInstalled: true,
              extensionId: chrome.runtime.id,
            },
          })
        );
      }
    );
  };

  // 1. Initial Load
  fetchAndInject();

  // 2. Listen for requests (e.g., from web app)
  window.addEventListener("DashHub-dash-request", () => {
    fetchAndInject();
  });
})();
