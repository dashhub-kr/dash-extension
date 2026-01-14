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
              $("#caption").hide(); // Hide redundant caption in commit mode

              // Show Repository Stats
              chrome.storage.local.get(["stats", "DashHub_hook"], (data3) => {
                const DashHubHook = data3.DashHub_hook;
                if (DashHubHook) {
                  // Update Linked Repo Name & Link
                  $("#linked_repo_name").text(DashHubHook);
                  $("#linked_repo_name").attr("href", `https://github.com/${DashHubHook}`);
                }
              });
            } else {
              $("#hook_mode").show();
              $("#caption").show(); // Show caption in hook mode
            }
          });
        } else if (xhr.status === 401) {
          // Unauthorized: Reset Token
          chrome.storage.local.set({ DashHub_token: null }, () => {
            console.log("Invalid Token. Redirecting to OAuth...");
            action = true;
            $("#auth_mode").show();
            $("#caption").show(); // Show caption in auth mode
          });
        }
      }
    });
    xhr.open("GET", AUTHENTICATION_URL, true);
    xhr.setRequestHeader("Authorization", `token ${token}`);
    xhr.send();
  }
});

/* --------------------------------------------------------------------------
   Disconnect Handler
   -------------------------------------------------------------------------- */
$("#disconnect_btn").on("click", () => {
  if (confirm("정말로 리포지토리 연결을 끊으시겠습니까?\n다시 연결하려면 리포지토리 설정 과정을 거쳐야 합니다.")) {
    // 1. Reset Hook Info
    chrome.storage.local.set({ mode_type: "hook", DashHub_hook: null }, () => {
      // 2. UI Update
      $("#commit_mode").hide();
      $("#hook_mode").show();
      console.log("Repository disconnected by user.");
    });
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
