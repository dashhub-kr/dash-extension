/* --------------------------------------------------------------------------
   SWEA UI Utilities
   -------------------------------------------------------------------------- */

/**
 * Render Loading UI
 */
function renderLoadingUI() {
  let elem = document.getElementById("dh-progress-anchor-element");
  if (elem !== undefined) {
    elem = document.createElement("span");
    elem.id = "dh-progress-anchor-element";
  }
  elem.innerHTML = `<div id="dh-progress-elem" class="dh-progress"></div>`;

  // 1. General Problem Page
  let target = document.querySelector("div.box-list > div.box-list-inner > div.right_answer > span.btn_right");

  // 2. Club Page
  if (isNull(target)) {
    const myNickname = getNickname();
    const rows = document.querySelectorAll("div.problem_smt");
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].innerText.includes(myNickname)) {
        target = rows[i].querySelector("div.info") || rows[i];
        break;
      }
    }
  }

  if (isNull(target)) {
    console.warn("DashHub: 진행 상태 아이콘을 표시할 대상을 찾을 수 없습니다.");
  } else {
    target.prepend(elem);
  }
  startUploadCountDown();
}

/**
 * Create and Attach Submit Button
 * @param {string} link
 * @param {boolean} isUploadAllowed
 */
function makeSubmitButton(link, isUploadAllowed = true) {
  let elem = document.getElementById("dh-submit-button-element");
  if (elem !== undefined) {
    elem = document.createElement("a");
    elem.id = "dh-submit-button-element";
    elem.className = "btn_grey3 md btn";

    if (isUploadAllowed) {
      elem.style = "cursor:pointer";
      elem.href = link;
      elem.onclick = null;
    } else {
      elem.style = "cursor:not-allowed; background-color: #888; border-color: #888; color: #fff;";
      elem.removeAttribute("href");
      elem.classList.add("dh-tooltipped");
      elem.setAttribute("data-tooltip", "'성공한 제출만'으로 설정되어 있습니다.\n크롬 익스텐션 설정을 확인해주세요.");
      elem.onclick = (e) => e.preventDefault();
    }
  }
  elem.innerHTML = "대시허브로 업로드";
  const target = document.querySelector("body > div.popup_layer.show > div > div");
  if (!isNull(target)) {
    target.append(elem);
  }
}

/**
 * Mark Upload As Success
 * @param {object} branches
 * @param {string} directory
 */
function markAsUploaded(branches, directory) {
  uploadState.uploading = false;
  const elem = document.getElementById("dh-progress-elem");
  if (isNull(elem)) return;
  elem.className = "markuploaded";
  const uploadedUrl = `https://github.com/${Object.keys(branches)[0]}/tree/${branches[Object.keys(branches)[0]]}/${directory}`;
  elem.addEventListener("click", function () {
    window.location.href = uploadedUrl;
  });
  elem.style.cursor = "pointer";
}

/**
 * Mark Upload As Failed
 */
function markAsUploadFailed() {
  uploadState.uploading = false;
  const elem = document.getElementById("dh-progress-elem");
  if (!elem) return;
  elem.className = "markuploadfailed";
}

/**
 * Start Upload Countdown (10s timeout)
 */
function startUploadCountDown() {
  uploadState.uploading = true;
  uploadState.countdown = setTimeout(() => {
    if (uploadState.uploading === true) {
      markAsUploadFailed();
    }
  }, 10000);
}

/**
 * Get Current User Nickname
 * @returns {string}
 */
function getNickname() {
  return document.querySelector("#Beginner")?.innerText || document.querySelector("header > div > span.name")?.innerText || "";
}


