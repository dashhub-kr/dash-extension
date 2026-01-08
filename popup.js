/* global oAuth2 */
/* eslint no-undef: "error" */

let action = false;

// Authenticate Button Click
$("#authenticate").on("click", () => {
  if (action) {
    oAuth2.begin();
  }
});

// Set URLs for buttons
const welcomeUrl = `chrome-extension://${chrome.runtime.id}/welcome.html`;
$("#welcome_URL").attr("href", welcomeUrl);
$("#hook_URL").attr("href", welcomeUrl);

// Check Token
chrome.storage.local.get("DashHub_token", (data) => {
  const token = data.DashHub_token;
  if (token === null || token === undefined) {
    action = true;
    $("#auth_mode").show();
  } else {
    // Validate User via GitHub API
    const AUTHENTICATION_URL = "https://api.github.com/user";
    const xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // Success: Show Main Features
          chrome.storage.local.get("mode_type", (data2) => {
            if (data2 && data2.mode_type === "commit") {
              $("#commit_mode").show();
              // Show Repository Stats
              chrome.storage.local.get(["stats", "DashHub_hook"], (data3) => {
                const DashHubHook = data3.DashHub_hook;
                if (DashHubHook) {
                  $("#repo_url").html(
                    `연결 정보: <a target="blank" style="color: cadetblue !important;" href="https://github.com/${DashHubHook}">${DashHubHook}</a>`
                  );
                }
              });
            } else {
              $("#hook_mode").show();
            }
          });
        } else if (xhr.status === 401) {
          // Unauthorized: Reset Token
          chrome.storage.local.set({ DashHub_token: null }, () => {
            console.log("Invalid Token. Redirecting to OAuth...");
            action = true;
            $("#auth_mode").show();
          });
        }
      }
    });
    xhr.open("GET", AUTHENTICATION_URL, true);
    xhr.setRequestHeader("Authorization", `token ${token}`);
    xhr.send();
  }
});

// Init Toggle Switch
chrome.storage.local.get("DashHubEnable", (data4) => {
  if (data4.DashHubEnable === undefined) {
    $("#onffbox").prop("checked", true);
    chrome.storage.local.set({ DashHubEnable: $("#onffbox").is(":checked") }, () => { });
  } else {
    $("#onffbox").prop("checked", data4.DashHubEnable);
    chrome.storage.local.set({ DashHubEnable: $("#onffbox").is(":checked") }, () => { });
  }
});

// Toggle Switch Listener
$("#onffbox").on("click", () => {
  chrome.storage.local.set({ DashHubEnable: $("#onffbox").is(":checked") }, () => { });
});
