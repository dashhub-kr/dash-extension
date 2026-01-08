
/* --------------------------------------------------------------------------
   Baekjoon Online Judge Submission Loader
   -------------------------------------------------------------------------- */

let loader;
const currentUrl = window.location.href;

// Check if we should start the loader
const username = findUsername();
if (!isNull(username)) {
  if (["status", `user_id=${username}`, "problem_id", "from_mine=1"].every((key) => currentUrl.includes(key))) {
    startLoader();
  } else if (currentUrl.match(/\.net\/problem\/\d+/) !== null) {
    parseProblemDescription();
  }
}

function startLoader() {
  loader = setInterval(async () => {
    // Check if extension is enabled
    const enable = await checkEnable();
    if (!enable) {
      stopLoader();
      return;
    }

    if (isExistResultTable()) {
      const table = findFromResultTable();
      if (isEmpty(table)) return;

      const data = table[0];
      if (data.hasOwnProperty("username") && data.hasOwnProperty("resultCategory")) {
        const { username, resultCategory } = data;

        // Categories that trigger stops
        const finalResultCategories = [
          RESULT_CATEGORY.RESULT_ACCEPTED,
          RESULT_CATEGORY.RESULT_PARTIALLY_ACCEPTED,
          RESULT_CATEGORY.RESULT_PRESENTATION_ERROR,
          RESULT_CATEGORY.RESULT_WRONG_ANSWER,
          RESULT_CATEGORY.RESULT_ACCEPTED_NOT_CORRECT,
          RESULT_CATEGORY.RESULT_TIME_LIMIT_EXCEEDED,
          RESULT_CATEGORY.RESULT_MEMORY_LIMIT_EXCEEDED,
          RESULT_CATEGORY.RESULT_OUTPUT_LIMIT_EXCEEDED,
          RESULT_CATEGORY.RESULT_RUNTIME_ERROR,
          RESULT_CATEGORY.RESULT_COMPILATION_ERROR,
          RESULT_CATEGORY.RESULT_UNVAILABLE,
          RESULT_CATEGORY.RESULT_DELETED,
          RESULT_CATEGORY.RESULT_ENG_ACCEPTED,
        ];

        // Success Categories
        const successCategories = [
          RESULT_CATEGORY.RESULT_ACCEPTED,
          RESULT_CATEGORY.RESULT_PARTIALLY_ACCEPTED,
          RESULT_CATEGORY.RESULT_ENG_ACCEPTED,
        ];

        if (username === findUsername() && finalResultCategories.some((cat) => resultCategory.includes(cat))) {
          stopLoader();

          // Check success
          const isSuccess = successCategories.some((cat) => resultCategory.includes(cat));

          // Check "Commit Only Success" setting
          const commitSettings = await new Promise((resolve) => {
            chrome.storage.local.get("commitOnlySuccess", resolve);
          });
          const commitOnlySuccess = commitSettings.commitOnlySuccess || false;

          // Skip if failed and "Commit Only Success" is true
          if (commitOnlySuccess && !isSuccess) {
            return;
          }

          renderLoadingUI();
          const submissionData = await findData();
          await processSubmission(submissionData);
        }
      }
    }
  }, 2000);
}

function stopLoader() {
  clearInterval(loader);
  loader = null;
}

function toastThenStopLoader(toastMessage, errorMessage) {
  Toast.raiseToast(toastMessage);
  stopLoader();
  throw new Error(errorMessage);
}

/* 파싱 직후 실행되는 함수 */
async function processSubmission(submissionData) {
  submissionData = ensureDefaultValues(submissionData);

  if (isNotEmpty(submissionData)) {
    // memory/runtime 값이 비어 있으면 -1로 세팅
    if (submissionData.memory === undefined || submissionData.memory === null || submissionData.memory === "") {
      submissionData.memory = -1;
    }
    if (submissionData.runtime === undefined || submissionData.runtime === null || submissionData.runtime === "") {
      submissionData.runtime = -1;
    }
    const stats = await getStats();
    const hook = await getHook();

    const currentVersion = stats.version;
    if (
      isNull(currentVersion) ||
      currentVersion !== getVersion() ||
      isNull(await getStatsSHAfromPath(hook))
    ) {
      await versionUpdate();
    }

    cachedSHA = await getStatsSHAfromPath(
      `${hook}/${submissionData.directory}/${submissionData.fileName}`
    );
    calcSHA = calculateBlobSHA(submissionData.code);


    if (cachedSHA == calcSHA) {
      markAsUploaded(stats.branches, submissionData.directory);
      return;
    }
    // 정답 제출 시 Stats에 memory/runtime 최신값 저장
    await updateProblemsFromStats({
      problemId: submissionData.problemId,
      problem_description: submissionData.problem_description,
      problem_input: submissionData.problem_input,
      problem_output: submissionData.problem_output,
      memory: submissionData.memory,
      runtime: submissionData.runtime,
    });
    await uploadOneSolveProblemOnGit(submissionData, markAsUploaded);
  }
}

async function versionUpdate() {

  const stats = await updateLocalStorageStats();
  // 버전 업데이트.
  stats.version = getVersion();
  await saveStats(stats);

}
