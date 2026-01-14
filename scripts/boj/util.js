/* --------------------------------------------------------------------------
   UI & Comparison Utilities
   -------------------------------------------------------------------------- */

/**
 * Render Loading UI
 */
function renderLoadingUI() {
  let elem = document.getElementById("dh-progress-anchor-element");
  if (elem !== undefined) {
    elem = document.createElement("span");
    elem.id = "dh-progress-anchor-element";
    elem.className = "dh-loading-wrap";
  }
  elem.innerHTML = `<div id="dh-progress-elem" class="dh-progress"></div>`;
  const target =
    document.getElementById("status-table")?.childNodes[1].childNodes[0].childNodes[3] ||
    document.querySelector("div.table-responsive > table > tbody > tr > td:nth-child(5)");
  target.append(elem);
  if (target.childNodes.length > 0) {
    target.childNodes[0].append(elem);
  }
  startUploadCountDown();
}

/**
 * Mark Upload As Success
 * @param {object} branches
 * @param {string} directory
 */
function markAsUploaded(branches, directory) {
  uploadState.uploading = false;
  const elem = document.getElementById("dh-progress-elem");
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
  elem.className = "markuploadfailed";
}

/**
 * Start Upload Countdown (10s timeout)
 */
function startUploadCountDown() {
  if (uploadState.countdown) {
    clearTimeout(uploadState.countdown);
  }
  uploadState.uploading = true;
  uploadState.countdown = setTimeout(() => {
    if (uploadState.uploading === true) {
      markAsUploadFailed();
    }
  }, 10000);
}

/**
 * Compare Submissions
 * Prioritize: Result > Runtime > Memory > CodeLength > SubmissionID
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
function compareSubmission(a, b) {
  // prettier-ignore-start
  /* eslint-disable */
  return hasNotSubtask(a.result, b.result)
    ? a.runtime === b.runtime
      ? a.memory === b.memory
        ? a.codeLength === b.codeLength
          ? -(a.submissionId - b.submissionId)
          : a.codeLength - b.codeLength
        : a.memory - b.memory
      : a.runtime - b.runtime
    : compareResult(a.result, b.result);
  /* eslint-enable */
  // prettier-ignore-end
}

/**
 * Check if Subtask Exists
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function hasNotSubtask(a, b) {
  a = parseNumberFromString(a);
  b = parseNumberFromString(b);
  if (isNaN(a) && isNaN(b)) return true;
  return false;
}

/**
 * Compare Results (Score)
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function compareResult(a, b) {
  a = parseNumberFromString(a);
  b = parseNumberFromString(b);

  if (typeof a === "number" && typeof b === "number") return -(a - b);
  if (isNaN(b)) return -1;
  if (isNaN(a)) return 1;
}

/**
 * Select Best Submissions
 * @param {array} submissions
 * @returns {array}
 */
function selectBestSubmissionList(submissions) {
  if (isNull(submissions) || submissions.length === 0) return [];
  return maxValuesGroupBykey(submissions, "problemId", (a, b) => -compareSubmission(a, b));
}

function convertResultTableHeader(header) {
  switch (header) {
    case "문제번호":
    case "문제":
      return "problemId";
    case "난이도":
      return "level";
    case "결과":
      return "result";
    case "문제내용":
      return "problemDescription";
    case "언어":
      return "language";
    case "제출 번호":
      return "submissionId";
    case "아이디":
      return "username";
    case "제출시간":
    case "제출한 시간":
      return "submissionTime";
    case "시간":
      return "runtime";
    case "메모리":
      return "memory";
    case "코드 길이":
      return "codeLength";
    default:
      return "unknown";
  }
}

function convertImageTagAbsoluteURL(doc = document) {
  if (isNull(doc)) return;
  Array.from(doc.getElementsByTagName("img"), (x) => {
    x.setAttribute("src", x.currentSrc);
    return x;
  });
}
