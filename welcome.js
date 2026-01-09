/* --------------------------------------------------------------------------
   Helpers: Input Retrieval
   -------------------------------------------------------------------------- */
const option = () => $("#type").val();
const repositoryName = () => $("#name").val().trim();
const getCommitCondition = () => $("#commitCondition").val();

/* --------------------------------------------------------------------------
   Helpers: Status Codes
   -------------------------------------------------------------------------- */
const statusCode = (res, status, name) => {
  switch (status) {
    case 304:
      $("#success").hide();
      $("#error").text(`리포지토리 생성 오류 - 잠시 후 다시 시도해주세요.`);
      $("#error").show();
      break;
    case 400:
      $("#success").hide();
      $("#error").text(`리포지토리 생성 오류 - 잘못된 요청입니다. 스크립트 충돌을 확인해주세요.`);
      $("#error").show();
      break;
    case 401:
      $("#success").hide();
      $("#error").text(`권한 오류 - 인증 정보가 만료되었습니다. 다시 로그인해주세요.`);
      $("#error").show();
      break;
    case 403:
      $("#success").hide();
      $("#error").text(`권한 오류 - 리포지토리 생성 권한이 없습니다.`);
      $("#error").show();
      break;
    case 422:
      $("#success").hide();
      $("#error").html(`이미 동일한 이름의 리포지토리가 존재합니다.<br>'기존 리포지토리 연결' 옵션을 선택해주세요.`);
      $("#error").show();
      break;
    default:
      // Success: Change mode to 'commit'
      chrome.storage.local.set({ mode_type: "commit" }, () => {
        $("#error").hide();
        // Simply show the repo link text, not the success message over the button
        const linkHtml = `<a target="_blank" href="${res.html_url}" style="text-decoration: none; color: #0366d6;">${name}</a>`;
        $("#repo_url").html(linkHtml);

        // Update Layout
        document.getElementById("hook_mode").style.display = "none";
        document.getElementById("commit_mode").style.display = "block";

        // Start Auto-close Timer
        startAutoClose();
      });

      // Set Hook & Conditions
      const commitOnlySuccess = getCommitCondition() === "success";
      chrome.storage.local.set(
        {
          DashHub_hook: res.full_name,
          commitOnlySuccess: commitOnlySuccess,
        },
        () => {
          console.log("새로운 리포지토리 훅과 커밋 조건이 성공적으로 설정되었습니다");
        }
      );
      break;
  }
};

const startAutoClose = () => {
  $("#timer_container").show();
  let timeLeft = 3;
  const timerElement = $("#auto_close_timer");

  const interval = setInterval(() => {
    timeLeft--;
    timerElement.text(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(interval);
      window.close();
    }
  }, 1000);
};

// Explicit Close Button
$("#close_window_button").on("click", () => {
  window.close();
});

/* --------------------------------------------------------------------------
   Helpers: Base64 Encoding
   -------------------------------------------------------------------------- */
const b64EncodeUnicode = (str) => {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode("0x" + p1))
  );
};

const b64DecodeUnicode = (str) => {
  return decodeURIComponent(
    atob(str).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
  );
};

/* --------------------------------------------------------------------------
   GitHub Actions
   -------------------------------------------------------------------------- */
const updateREADME = (token, full_name) => {
  const README_URL = `https://api.github.com/repos/${full_name}/contents/README.md`;

  fetch(README_URL, {
    method: "GET",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      const sha = data.sha;
      const existingContentRaw = data.content.replace(/\n/g, "");
      let originalTitle = `# ${full_name.split("/")[1]}`; // default

      try {
        const decodedContent = b64DecodeUnicode(existingContentRaw);
        const firstLine = decodedContent.split("\n")[0];
        if (firstLine && firstLine.startsWith("#")) {
          originalTitle = firstLine;
        }
      } catch (e) {
        console.error("Error decoding README:", e);
      }

      const newContent =
        `${originalTitle}\n\n` +
        `[![DashHub](https://img.shields.io/badge/Powered%20by-DashHub-blue?style=flat-square&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/kimjgflahdmnlhilmojcoaechlgkokhc)\n\n` +
        `This repository is automatically synchronized by **DashHub**.`;

      const base64Content = b64EncodeUnicode(newContent);

      return fetch(README_URL, {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "docs: update README with DashHub",
          content: base64Content,
          sha: sha,
        }),
      });
    })
    .then(() => {
      console.log("README successfully updated.");
    })
    .catch((err) => {
      console.error("Error updating README:", err);
    });
};

const createRepo = (token, name) => {
  const AUTHENTICATION_URL = "https://api.github.com/user/repos";
  const data = JSON.stringify({
    name,
    private: true,
    auto_init: true,
    description: "Automated Algorithm Solutions Archive. Powered by DashHub.",
  });

  const xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", function () {
    if (xhr.readyState === 4) {
      const res = JSON.parse(xhr.responseText);
      if (xhr.status === 201) {
        updateREADME(token, res.full_name);
      }
      statusCode(res, xhr.status, name);
    }
  });

  const stats = {
    version: chrome.runtime.getManifest().version,
    submission: {},
  };
  chrome.storage.local.set({ stats });

  xhr.open("POST", AUTHENTICATION_URL, true);
  xhr.setRequestHeader("Authorization", `token ${token}`);
  xhr.setRequestHeader("Accept", "application/vnd.github.v3+json");
  xhr.send(data);
};

const linkStatusCode = (status, name) => {
  let bool = false;
  switch (status) {
    case 301:
      $("#success").hide();
      $("#error").html(`리포지토리가 이전되었습니다. <a target="blank" href="https://github.com/${name}">${name}</a><br> 리포지토리 이름을 다시 확인해주세요.`);
      $("#error").show();
      break;
    case 403:
      $("#success").hide();
      $("#error").html(`리포지토리에 대한 접근 권한이 없습니다. <a target="blank" href="https://github.com/${name}">${name}</a><br> 리포지토리에 대한 접근 권한을 확인해주세요.`);
      $("#error").show();
      break;
    case 404:
      $("#success").hide();
      $("#error").html(`리포지토리를 찾을 수 없습니다. <a target="blank" href="https://github.com/${name}">${name}</a><br> 리포지토리 이름을 다시 확인해주세요.`);
      $("#error").show();
      break;
    default:
      bool = true;
      break;
  }
  $("#unlink").show();
  return bool;
};

const linkRepo = (token, name, updateConfig = false) => {
  const AUTHENTICATION_URL = `https://api.github.com/repos/${name}`;

  const xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", function () {
    if (xhr.readyState === 4) {
      const res = JSON.parse(xhr.responseText);
      const bool = linkStatusCode(xhr.status, name);
      if (xhr.status === 200) {
        if (!bool) {
          // Error handling: fallback to hook mode
          chrome.storage.local.set({ mode_type: "hook" }, () => console.log(`${name} 연결 오류`));
          chrome.storage.local.set({ DashHub_hook: null }, () => console.log("리포지토리 훅 초기화 (NONE)"));
          document.getElementById("hook_mode").style.display = "block";
          document.getElementById("commit_mode").style.display = "none";
        } else {
          // Success
          chrome.storage.local.set(
            { mode_type: "commit", repo: res.html_url },
            () => {
              $("#error").hide();
              // Simply show the repo link text
              const linkHtml = `<a target="_blank" href="${res.html_url}" style="text-decoration: none; color: #0366d6;">${name}</a>`;
              $("#repo_url").html(linkHtml);

              document.getElementById("hook_mode").style.display = "none";
              document.getElementById("commit_mode").style.display = "block";

              if (updateConfig) {
                startAutoClose();
              }
            }
          );

          chrome.storage.local.set({
            stats: {
              version: chrome.runtime.getManifest().version,
              submission: {}
            }
          });

          if (updateConfig) {
            const commitOnlySuccess = getCommitCondition() === "success";
            chrome.storage.local.set(
              { DashHub_hook: res.full_name, commitOnlySuccess: commitOnlySuccess },
              () => {
                console.log("새로운 리포지토리 훅과 커밋 조건 설정 완료");
                const conditionText = commitOnlySuccess ? "성공한 제출만" : "모든 제출";
                $("#current_commit_condition").text(conditionText);
              }
            );
          } else {
            chrome.storage.local.set({ DashHub_hook: res.full_name });
          }

          document.getElementById("hook_mode").style.display = "none";
          document.getElementById("commit_mode").style.display = "block";
        }
      }
    }
  });

  xhr.open("GET", AUTHENTICATION_URL, true);
  xhr.setRequestHeader("Authorization", `token ${token}`);
  xhr.setRequestHeader("Accept", "application/vnd.github.v3+json");
  xhr.send();
};

const unlinkRepo = () => {
  chrome.storage.local.set({ mode_type: "hook" }, () => console.log("리포지토리 연결 해제"));
  chrome.storage.local.set(
    { DashHub_hook: null, commitOnlySuccess: false },
    () => console.log("훅 초기화 완료")
  );

  document.getElementById("hook_mode").style.display = "block";
  document.getElementById("commit_mode").style.display = "none";
};

/* --------------------------------------------------------------------------
   UI Event Listeners
   -------------------------------------------------------------------------- */
$("#type").on("change", function () {
  const valueSelected = this.value;
  $("#hook_button").attr("disabled", !valueSelected);
});

$("#hook_button").on("click", () => {
  if (!option()) {
    $("#error").text("옵션을 선택해주세요.");
    $("#error").show();
  } else if (!repositoryName()) {
    $("#error").text("리포지토리 이름을 입력해주세요!");
    $("#name").focus();
    $("#error").show();
  } else {
    $("#error").hide();
    $("#success").text("리포지토리 연결 중... 잠시만 기다려주세요.");
    $("#success").show();

    chrome.storage.local.get("DashHub_token", (data) => {
      const token = data.DashHub_token;
      if (!token) {
        $("#error").text("인증 오류 - GitHub 로그인이 필요합니다.");
        $("#error").show();
        $("#success").hide();
      } else if (option() === "new") {
        createRepo(token, repositoryName());
      } else {
        chrome.storage.local.get("DashHub_username", (data2) => {
          const username = data2.DashHub_username;
          if (!username) {
            $("#error").text("인증 오류 - GitHub 계정 정보가 없습니다.");
            $("#error").show();
            $("#success").hide();
          } else {
            linkRepo(token, `${username}/${repositoryName()}`, true);
          }
        });
      }
    });
  }
});

$("#unlink a").on("click", () => {
  unlinkRepo();
  $("#unlink").hide();
  $("#success").text("리포지토리 연결이 해제되었습니다.");
});

$("#login_button").on("click", () => {
  if (typeof oAuth2 !== "undefined") {
    oAuth2.begin();
  } else {
    alert("인증 모듈을 로드하는데 실패했습니다.");
  }
});

/* --------------------------------------------------------------------------
   Initialization
   -------------------------------------------------------------------------- */
chrome.storage.local.get("DashHub_token", (dataToken) => {
  const token = dataToken.DashHub_token;

  if (!token) {
    document.getElementById("auth_mode").style.display = "block";
    document.getElementById("hook_mode").style.display = "none";
    document.getElementById("commit_mode").style.display = "none";
  } else {
    chrome.storage.local.get("mode_type", (data) => {
      const mode = data.mode_type;

      if (mode && mode === "commit") {
        if (!token) {
          $("#error").text("인증 오류 - GitHub 접근 권한이 필요합니다.");
          $("#error").show();
          $("#success").hide();
          document.getElementById("commit_mode").style.display = "none";
          document.getElementById("auth_mode").style.display = "block";
        } else {
          chrome.storage.local.get("DashHub_hook", (repoName) => {
            const hook = repoName.DashHub_hook;
            if (!hook) {
              $("#error").hide();
              document.getElementById("hook_mode").style.display = "block";
              document.getElementById("commit_mode").style.display = "none";
            } else {
              linkRepo(token, hook, false);
            }
          });
        }

        document.getElementById("hook_mode").style.display = "none";
        document.getElementById("commit_mode").style.display = "block";

        chrome.storage.local.get("commitOnlySuccess", (data3) => {
          const commitOnlySuccess = data3.commitOnlySuccess || false;
          const conditionText = commitOnlySuccess ? "성공한 제출만" : "모든 제출";
          $("#current_commit_condition").text(conditionText);
        });
      } else {
        document.getElementById("hook_mode").style.display = "block";
        document.getElementById("commit_mode").style.display = "none";
      }
    });
  }
});

/* --------------------------------------------------------------------------
   OAuth Handler
   -------------------------------------------------------------------------- */
const link = window.location.href;
if (link.match(/\?code=([\w\/\-]+)/)) {
  const code = link.match(/\?code=([\w\/\-]+)/)[1];
  const CLIENT_ID = config.CLIENT_ID;
  const CLIENT_SECRET = config.CLIENT_SECRET;
  const ACCESS_TOKEN_URL = config.ACCESS_TOKEN_URL;
  const AUTHENTICATION_URL = "https://api.github.com/user";

  const data = new FormData();
  data.append("client_id", CLIENT_ID);
  data.append("client_secret", CLIENT_SECRET);
  data.append("code", code);

  const xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        const tokenMatch = xhr.responseText.match(/access_token=([^&]*)/);
        if (tokenMatch) {
          const token = tokenMatch[1];
          // Determine Username
          const xhr2 = new XMLHttpRequest();
          xhr2.addEventListener("readystatechange", function () {
            if (xhr2.readyState === 4) {
              if (xhr2.status === 200) {
                const username = JSON.parse(xhr2.responseText).login;
                chrome.storage.local.set(
                  {
                    DashHub_token: token,
                    DashHub_username: username,
                    pipe_DashHub: false,
                    DashHubEnable: true,
                  },
                  () => {
                    $("#success").text("인증 성공! 이제 리포지토리를 설정할 수 있습니다.");
                    $("#success").show();
                    $("#error").hide();
                    // Clear Code from URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    // Refresh for UI Update
                    setTimeout(() => location.reload(), 1000);
                  }
                );
              }
            }
          });
          xhr2.open("GET", AUTHENTICATION_URL, true);
          xhr2.setRequestHeader("Authorization", `token ${token}`);
          xhr2.send();
        }
      } else {
        $("#error").text("인증 실패 - 다시 시도해주세요.");
        $("#error").show();
      }
    }
  });
  xhr.open("POST", ACCESS_TOKEN_URL, true);
  xhr.send(data);
}
