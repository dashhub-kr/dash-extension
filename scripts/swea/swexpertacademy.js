
/* --------------------------------------------------------------------------
   SW Expert Academy Submission Loader
   -------------------------------------------------------------------------- */

let loader;
const currentUrl = window.location.href;

// Check if it's a practice problem and start loader/parser accordingly
if (
  (currentUrl.includes("/main/solvingProblem/solvingProblem.do") &&
    document.querySelector("header > h1 > span").textContent === "모의 테스트") ||
  currentUrl.includes("/main/talk/solvingClub/problemView.do")
) {
  startLoader();
} else if (
  (currentUrl.includes("/main/code/problem/problemSolver.do") ||
    currentUrl.includes("/main/talk/solvingClub/problemPassedUser.do") ||
    currentUrl.includes("problemSubmitHistory.do")) &&
  currentUrl.includes("extension=DashHub")
) {
  parseAndUpload();
}

function parseAndUpload() {
  (async () => {
    // Check 'result' parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const result = urlParams.get("result");

    // Check "Commit Only Success" setting
    const commitSettings = await new Promise((resolve) => {
      chrome.storage.local.get("commitOnlySuccess", resolve);
    });
    const commitOnlySuccess = commitSettings.commitOnlySuccess || false;

    // Skip if failed and "Commit Only Success" is true
    if (commitOnlySuccess && result === "fail") {
      return;
    }

    const submissionData = await parseData();
    await processSubmission(submissionData);
  })();
}

function startLoader() {
  loader = setInterval(async () => {
    const enable = await checkEnable();
    if (!enable) {
      stopLoader();
      return;
    }

    // Always parse and upload regardless of pass/fail (subject to settings below)
    if (getSolvedResult()) {
      stopLoader();
      try {
        const { contestProbId, solveclubId, probBoxId, problemBoxTitle, problemBoxCnt, level, problemId, problemTitle } =
          await parseCode();
        const result = getSolvedResult().includes("pass") ? "pass" : "fail";

        // Check "Commit Only Success" setting
        let isUploadAllowed = true;
        const commitSettings = await new Promise((resolve) => {
          chrome.storage.local.get("commitOnlySuccess", resolve);
        });
        const commitOnlySuccess = commitSettings.commitOnlySuccess || false;

        // Block upload button if setting enabled and result is fail (button still visible)
        if (commitOnlySuccess && result === "fail") {
          isUploadAllowed = false;
        }

        // Construct Submit URL based on context (Solving Club vs General)
        let submitUrl = "";
        if (solveclubId) {
          submitUrl =
            `${window.location.origin}/main/talk/solvingClub/problemSubmitHistory.do?` +
            `contestProbId=${contestProbId}&` +
            `solveclubId=${solveclubId}&` +
            `probBoxId=${probBoxId}&` +
            `problemBoxTitle=${encodeURIComponent(problemBoxTitle)}&` +
            `searchCondition=1&` +
            `searchKeyword=${encodeURIComponent(getNickname())}&` +
            `nickName=${encodeURIComponent(getNickname())}&` +
            `extension=DashHub&` +
            `result=${result}&` +
            `problemId=${problemId}&` +
            `problemTitle=${encodeURIComponent(problemTitle)}&` +
            `problemLevel=${encodeURIComponent(level)}`;
        } else {
          submitUrl =
            `${window.location.origin}/main/code/problem/problemSubmitHistory.do?` +
            `contestProbId=${contestProbId}&` +
            `nickName=${getNickname()}&` +
            `extension=DashHub&` +
            `result=${result}`;
        }

        await makeSubmitButton(submitUrl, isUploadAllowed);
      } catch (error) {
        console.error(error);
      }
    }
  }, 2000);
}

function getSolvedResult() {
  const popup = document.querySelector("div.popup_layer.show");
  if (!popup) return "";
  const result = popup.innerText.trim().toLowerCase();

  if (result.includes("제출하시겠습니까")) return "";
  if (result.includes("컴파일")) return "";
  return result;
}

function stopLoader() {
  clearInterval(loader);
}

/* Post-parsing processing */
async function processSubmission(submissionData) {
  renderLoadingUI();
  if (isNotEmpty(submissionData)) {
    const stats = await getStats();
    const hook = await getHook();

    const currentVersion = stats.version;
    // Update stats version if mismatch or missing, or if stats for hook is missing
    if (
      isNull(currentVersion) ||
      currentVersion !== getVersion() ||
      isNull(await getStatsSHAfromPath(hook))
    ) {
      await versionUpdate();
    }

    // Check duplication
    cachedSHA = await getStatsSHAfromPath(`${hook}/${submissionData.directory}/${submissionData.fileName}`);
    calcSHA = calculateBlobSHA(submissionData.code);

    if (cachedSHA == calcSHA) {
      markAsUploaded(stats.branches, submissionData.directory);
      return;
    }

    // Upload new submission
    await uploadOneSolveProblemOnGit(submissionData, markAsUploaded);
  }
}

async function versionUpdate() {
  const stats = await updateLocalStorageStats();
  // Update Version
  stats.version = getVersion();
  await saveStats(stats);
}
