/* --------------------------------------------------------------------------
   BOJ Parsing Logic
   -------------------------------------------------------------------------- */

/**
 * Polling and Finding Data
 */
async function findData(submissionData) {
  // Final Result Statuses
  const FINAL_RESULTS = [
    "맞았습니다",
    "틀렸습니다",
    "시간 초과",
    "메모리 초과",
    "출력 초과",
    "런타임 에러",
    "컴파일 에러",
    "출력 형식",
  ];

  try {
    if (isNull(submissionData)) {
      let table = findFromResultTable();
      if (isEmpty(table)) return null;
      submissionData = table[0];
    }

    if (isNaN(Number(submissionData.problemId)) || Number(submissionData.problemId) < 1000) {
      throw new Error(
        `정책상 대회 문제는 업로드 되지 않습니다. 대회 문제가 아니라고 판단된다면 이슈로 남겨주시길 바랍니다.\n문제 ID: ${submissionData.problemId}`
      );
    }

    // Polling: Max 60 times (2s * 60 = 2min)
    let result = submissionData.result;
    let pollCount = 0;
    while (!FINAL_RESULTS.some((r) => result && result.includes(r)) && pollCount < 60) {
      await new Promise((res) => setTimeout(res, 2000));
      let table = findFromResultTable();
      if (!isEmpty(table)) {
        let found = table.find((row) => row.submissionId == submissionData.submissionId);
        if (found) {
          result = found.result;
          submissionData = { ...submissionData, ...found };
        }
      }
      pollCount++;
    }

    // If result not finalized
    if (!FINAL_RESULTS.some((r) => result && result.includes(r))) {
      submissionData.memory = -1;
      submissionData.runtime = -1;
      submissionData.result = "채점 결과 미확정";
      return { ...submissionData, memory: -1, runtime: -1, result: "채점 결과 미확정" };
    }

    // Reset memory/runtime if not accepted
    if (!result.includes("맞았습니다")) {
      submissionData.memory = -1;
      submissionData.runtime = -1;
    }

    submissionData = {
      ...submissionData,
      ...(await findProblemInfoAndSubmissionCode(submissionData.problemId, submissionData.submissionId)),
    };

    const detail = await createSubmissionMetadata(ensureDefaultValues(submissionData));
    return { ...submissionData, ...detail };
  } catch (error) {
    console.error(error);
  }
  return null;
}

/**
 * Create Submission Metadata
 * @param {Object} submissionData
 * @returns {Object} { directory, fileName, message, readme, code }
 */
async function createSubmissionMetadata(submissionData) {
  const {
    problemId,
    submissionId,
    result,
    title,
    level,
    problem_tags,
    problem_description,
    problem_input,
    problem_output,
    submissionTime,
    code,
    language,
    memory,
    runtime,
  } = submissionData;

  const score = parseNumberFromString(result);
  const finalMemory = isEmpty(memory) ? -1 : memory;
  const finalRuntime = isEmpty(runtime) ? -1 : runtime;

  const directory = await getDirNameByOrgOption(
    constructProblemPath(PLATFORM_PATHS.BAEKJOON, level, problemId, title, language),
    langVersionRemove(language, null)
  );

  const message = constructCommitMessage(PLATFORM_PATHS.BAEKJOON, level, title, finalRuntime, finalMemory, score);
  const category = problem_tags.join(", ");
  const fileName = `Main.${languages[language]}`;
  const dateInfo = submissionTime ?? getDateString(new Date(Date.now()));

  const readme = constructReadme(
    PLATFORM_PATHS.BAEKJOON,
    level,
    title,
    problemId,
    `https://www.acmicpc.net/problem/${problemId}`,
    finalMemory,
    finalRuntime,
    category,
    problem_description,
    problem_input,
    problem_output,
    null,
    dateInfo
  );

  return {
    directory,
    fileName,
    message,
    readme,
    code,
    memory: finalMemory,
    runtime: finalRuntime,
  };
}

/**
 * Find the current user's username from the navigation bar
 */
function findUsername() {
  const el = document.querySelector("ul.loginbar > li > a");
  if (isNull(el)) return null;
  const text = el.textContent.trim();
  if (text === "로그인" || text === "회원가입") return null;
  return text;
}

function findUsernameOnUserInfoPage() {
  const el = document.querySelector("div.page-header > h1");
  if (isNull(el)) return null;
  const username = el.textContent.trim();
  if (isEmpty(username)) return null;
  return username;
}


function parsingResultTableList(doc) {
  const table = doc.getElementById("status-table");
  if (table === null || table === undefined || table.length === 0) return [];
  const headers = Array.from(table.rows[0].cells, (x) => convertResultTableHeader(x.innerText.trim()));

  const list = [];
  for (let i = 1; i < table.rows.length; i++) {
    const row = table.rows[i];
    const cells = Array.from(row.cells, (x, index) => {
      switch (headers[index]) {
        case "result":
          return {
            result: x.innerText.trim(),
            resultCategory: x.firstChild.getAttribute("data-color").replace("-eng", "").trim(),
          };
        case "language":
          return x.innerText.unescapeHtml().replace(/\/.*$/g, "").trim();
        case "submissionTime":
          const el = x.querySelector("a.show-date");
          if (isNull(el)) return null;
          return el.getAttribute("data-original-title");
        case "problemId":
          const a = x.querySelector("a.problem_title");
          if (isNull(a)) return null;
          return {
            problemId: a.getAttribute("href").replace(/^.*\/([0-9]+)$/, "$1"),
          };
        default:
          return x.innerText.trim();
      }
    });

    let obj = {};
    obj.elementId = row.id;
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = cells[j];
    }
    obj = { ...obj, ...obj.result, ...obj.problemId };

    list.push(obj);
  }

  return list;
}

/**
 * Check if the result table exists
 */
function isExistResultTable() {
  return document.getElementById("status-table") !== null;
}

/**
 * Parse data from the submission screen table
 */
function findFromResultTable() {
  if (!isExistResultTable()) {
    return [];
  }
  return parsingResultTableList(document);
}

/**
 * Parse Problem Description
 */
function parseProblemDescription(doc = document) {
  convertImageTagAbsoluteURL(doc.getElementById("problem_description"));
  const problemId = doc.getElementsByTagName("title")[0].textContent.split(":")[0].replace(/[^0-9]/, "");
  const title = doc.getElementById("problem_title")?.innerText;

  const problem_description = unescapeHtml(doc.getElementById("problem_description").innerHTML.trim());
  const problem_input = doc.getElementById("problem_input")?.innerHTML.trim?.().unescapeHtml?.() || "Empty";
  const problem_output = doc.getElementById("problem_output")?.innerHTML.trim?.().unescapeHtml?.() || "Empty";

  if (problemId && problem_description) {
    updateProblemsFromStats({
      problemId,
      title,
      problem_description,
      problem_input,
      problem_output,
    });
    return {
      problemId,
      title,
      problem_description,
      problem_input,
      problem_output,
    };
  }
  return {};
}

async function fetchProblemDescriptionById(problemId) {
  return fetch(`https://www.acmicpc.net/problem/${problemId}`)
    .then((res) => res.text())
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return parseProblemDescription(doc);
    });
}

async function fetchSubmitCodeById(submissionId) {
  return fetch(`https://www.acmicpc.net/source/download/${submissionId}`, {
    method: "GET",
  }).then((res) => res.text());
}

async function fetchSolvedACById(problemId) {
  return chrome.runtime.sendMessage({
    sender: "boj",
    task: "SolvedApiCall",
    problemId: problemId,
  });
}

async function getProblemDescriptionById(problemId) {
  let problem = await getProblemFromStats(problemId);
  if (isNull(problem)) {
    problem = await fetchProblemDescriptionById(problemId);
    updateProblemsFromStats(problem);
  }
  return problem;
}

async function getSubmitCodeById(submissionId) {
  let code = await getSubmitCodeFromStats(submissionId);
  if (isNull(code)) {
    code = await fetchSubmitCodeById(submissionId);
    updateSubmitCodeFromStats({ submissionId, code });
  }
  return code;
}

async function getSolvedACById(problemId) {
  let jsonData = await getSolvedACFromStats(problemId);
  if (isNull(jsonData)) {
    jsonData = await fetchSolvedACById(problemId);
    updateSolvedACFromStats({ problemId, jsonData });
  }
  return jsonData;
}

/**
 * Get Submission Code and Problem Info
 * @param {Object} problemId
 * @param {Object} submissionId
 */
async function findProblemInfoAndSubmissionCode(problemId, submissionId) {
  if (!isNull(problemId) && !isNull(submissionId)) {
    return Promise.all([
      getProblemDescriptionById(problemId),
      getSubmitCodeById(submissionId),
      getSolvedACById(problemId),
    ])
      .then(([description, code, solvedJson]) => {
        let problem_tags, title, level;

        if (isNull(solvedJson)) {
          problem_tags = [];
          title = description.title;
          level = bj_level[0]; // Unrated
        } else {
          problem_tags = solvedJson.tags
            .flatMap((tag) => tag.displayNames)
            .filter((tag) => tag.language === "ko")
            .map((tag) => tag.name);
          title = solvedJson.titleKo;
          level = bj_level[solvedJson.level];
        }

        const { problem_description, problem_input, problem_output } = description;

        return {
          problemId,
          submissionId,
          title,
          level,
          code,
          problem_description,
          problem_input,
          problem_output,
          problem_tags,
        };
      })
      .catch((err) => {
        uploadState.uploading = false;
        markAsUploadFailed();
      });
  }
}

/**
 * Fetch Problem Info by IDs (Batch 100)
 */
async function fetchProblemInfoByIds(problemIds) {
  const dividedProblemIds = [];
  for (let i = 0; i < problemIds.length; i += 100) {
    dividedProblemIds.push(problemIds.slice(i, i + 100));
  }
  return asyncPool(1, dividedProblemIds, async (pids) => {
    const result = await fetch(`https://solved.ac/api/v3/problem/lookup?problemIds=${pids.join("%2C")}`, {
      method: "GET",
    });
    return result.json();
  }).then((results) => results.flatMap((result) => result));
}

/**
 * Fetch Problem Descriptions by IDs (Parallel 2)
 */
async function fetchProblemDescriptionsByIds(problemIds) {
  return asyncPool(2, problemIds, async (problemId) => {
    return getProblemDescriptionById(problemId);
  });
}

/**
 * Fetch Submission Codes by IDs (Parallel 2)
 */
async function fetchSubmissionCodeByIds(submissionIds) {
  return asyncPool(2, submissionIds, async (submissionId) => {
    return getSubmitCodeById(submissionId);
  });
}

/**
 * Find Result Table by Problem ID and Username
 */
async function findResultTableByProblemIdAndUsername(problemId, username) {
  return fetch(`https://www.acmicpc.net/status?from_mine=1&problem_id=${problemId}&user_id=${username}`, {
    method: "GET",
  })
    .then((html) => html.text())
    .then((text) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      return parsingResultTableList(doc);
    });
}

/**
 * Find Unique "Accepted" Result List by Username
 */
async function findUniqueResultTableListByUsername(username) {
  return selectBestSubmissionList(await findResultTableListByUsername(username));
}

/**
 * Find "Accepted" Result List by Username
 */
async function findResultTableListByUsername(username) {
  const result = [];
  let doc = await findHtmlDocumentByUrl(`https://www.acmicpc.net/status?user_id=${username}&result_id=1`);
  let next_page = doc.getElementById("next_page");

  do {
    result.push(...parsingResultTableList(doc));
    if (next_page !== null) {
      doc = await findHtmlDocumentByUrl(next_page.getAttribute("href"));
    }
  } while ((next_page = doc.getElementById("next_page")) !== null);

  result.push(...parsingResultTableList(doc));

  return result;
}

/**
 * Fetch HTML Document by URL
 */
async function findHtmlDocumentByUrl(url) {
  return fetch(url, { method: "GET" })
    .then((html) => html.text())
    .then((text) => {
      const parser = new DOMParser();
      return parser.parseFromString(text, "text/html");
    });
}

/**
 * Remove Language Version
 * @param {string} lang
 * @param {Set} ignores
 */
function langVersionRemove(lang, ignores) {
  if (ignores === null || !ignores.has(lang)) {
    let parts = lang.split(" ");
    if (/^\d/.test(parts[parts.length - 1])) {
      parts.pop();
    }
    lang = parts.join(" ");
  }

  return lang;
}
