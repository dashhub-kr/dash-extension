/* --------------------------------------------------------------------------
   SWEA Parsing Logic
   -------------------------------------------------------------------------- */

/**
 * Parse submitted source code and problem info
 */
async function parseCode() {
  const problemBox = document.querySelector("div.problem_box");
  const problemId = problemBox.querySelector("h3").innerText.replace(/\..*$/, "").trim();
  const problemTitle = problemBox.querySelector("h3").innerText.replace(/^.*\./, "").trim();
  const level = problemBox.querySelector("span.badge")?.textContent || "Unrated";

  // Contest Prob ID extraction
  const contestProbIdInput = [...document.querySelectorAll("#contestProbId")].slice(-1)[0];
  const contestProbId =
    contestProbIdInput?.value || new URLSearchParams(window.location.search).get("contestProbId") || "";

  // SolveClub ID Detection
  let solveclubId =
    document.querySelector("#solveclubId")?.value ||
    document.querySelector("input[name='solveclubId']")?.value ||
    new URLSearchParams(window.location.search).get("solveclubId") ||
    new URLSearchParams(window.location.search).get("solveClubId");

  if (!solveclubId) {
    const match = document.documentElement.innerHTML.match(/name=["']solveclubId["']\s+value=["']([^"']+)["']/i);
    if (match) solveclubId = match[1];
  }

  if (!solveclubId && window.opener) {
    try {
      solveclubId =
        window.opener.document.querySelector("#solveclubId")?.value ||
        window.opener.document.querySelector("input[name='solveclubId']")?.value ||
        new URLSearchParams(window.opener.location.search).get("solveclubId");
    } catch (e) {
      console.warn("DashHub: Opener Access Failed", e);
    }
  }
  solveclubId = solveclubId || "";

  // probBoxId Detection
  let probBoxId =
    document.querySelector("#probBoxId")?.value ||
    document.querySelector("input[name='probBoxId']")?.value ||
    new URLSearchParams(window.location.search).get("probBoxId");

  if (!probBoxId && window.opener) {
    try {
      probBoxId =
        window.opener.document.querySelector("#probBoxId")?.value ||
        new URLSearchParams(window.opener.location.search).get("probBoxId");
    } catch (e) { }
  }
  probBoxId = probBoxId || "";

  // problemBoxTitle Detection
  let problemBoxTitle =
    document.querySelector("#problemBoxTitle")?.value ||
    document.querySelector("input[name='problemBoxTitle']")?.value ||
    new URLSearchParams(window.location.search).get("problemBoxTitle");

  if (!problemBoxTitle && window.opener) {
    try {
      problemBoxTitle =
        window.opener.document.querySelector("#problemBoxTitle")?.value ||
        new URLSearchParams(window.opener.location.search).get("problemBoxTitle");
    } catch (e) { }
  }
  problemBoxTitle = problemBoxTitle || "";

  // problemBoxCnt Detection
  let problemBoxCnt =
    document.querySelector("#problemBoxCnt")?.value ||
    document.querySelector("input[name='problemBoxCnt']")?.value ||
    new URLSearchParams(window.location.search).get("problemBoxCnt");

  if (!problemBoxCnt && window.opener) {
    try {
      problemBoxCnt =
        window.opener.document.querySelector("#problemBoxCnt")?.value ||
        new URLSearchParams(window.opener.location.search).get("problemBoxCnt");
    } catch (e) { }
  }
  problemBoxCnt = problemBoxCnt || "";

  updateTextSourceEvent();
  const code = document.querySelector("#textSource").value;
  await updateProblemData(problemId, { code, contestProbId });
  return {
    problemId,
    contestProbId,
    solveclubId,
    probBoxId,
    problemBoxTitle,
    problemBoxCnt,
    level,
    problemTitle,
  };
}

/**
 * Trigger 'reset' event to save cEditor content to #textSource
 */
function updateTextSourceEvent() {
  document.documentElement.setAttribute("onreset", "cEditor.save();");
  document.documentElement.dispatchEvent(new CustomEvent("reset"));
  document.documentElement.removeAttribute("onreset");
}

/**
 * Parse submission data from details page or list
 */
async function parseData() {
  const nickname = document.querySelector("#searchinput").value;

  // General Page check
  const isGeneralPage =
    !window.location.href.includes("problemPassedUser.do") &&
    !window.location.href.includes("problemSubmitHistory.do") &&
    !!document.querySelector("#problemForm div.info");

  if (isGeneralPage) {
    if (getNickname() !== nickname) return;
  }

  let title, level, problemId, link, language, memory, runtime, length, extension, submissionTime;

  if (isGeneralPage) {
    title = document
      .querySelector("div.problem_box > p.problem_title")
      .innerText.replace(/ D[0-9]$/, "")
      .replace(/^[^.]*/, "")
      .substr(1)
      .trim();
    level =
      document.querySelector("div.problem_box > p.problem_title > span.badge")?.textContent || "Unrated";
    problemId = document
      .querySelector("body > div.container > div.container.sub > div > div.problem_box > p")
      .innerText.split(".")[0]
      .trim();
    const contestProbId = [...document.querySelectorAll("#contestProbId")].slice(-1)[0].value;
    link = `${window.location.origin}/main/code/problem/problemDetail.do?contestProbId=${contestProbId}`;

    language = document
      .querySelector("#problemForm div.info > ul > li:nth-child(1) > span:nth-child(1)")
      .textContent.trim();
    memory = document
      .querySelector("#problemForm div.info > ul > li:nth-child(2) > span:nth-child(1)")
      .textContent.trim()
      .toUpperCase();
    runtime = document
      .querySelector("#problemForm div.info > ul > li:nth-child(3) > span:nth-child(1)")
      .textContent.trim();
    length = document
      .querySelector("#problemForm div.info > ul > li:nth-child(4) > span:nth-child(1)")
      .textContent.trim();

    submissionTime = document
      .querySelector(".smt_txt > dd")
      .textContent.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/g)[0];

    extension = languages[language.toLowerCase()];
  } else {
    // Solving Club Page Parsing
    const myNickname = getNickname();
    const rows = document.querySelectorAll("div.problem_smt");
    let targetRow = null;

    // Find my latest submission
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].innerText.includes(myNickname)) {
        targetRow = rows[i];
        break;
      }
    }

    if (!targetRow) {
      console.error("내 제출 기록을 찾을 수 없습니다.");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    problemId = urlParams.get("problemId");
    title = urlParams.get("problemTitle");
    level = urlParams.get("problemLevel");

    // Fallback if not in URL
    if (!problemId || !title) {
      const problemBox = document.querySelector("div.problem_box");
      if (problemBox) {
        title = problemBox
          .querySelector("p.problem_title")
          .innerText.replace(/ D[0-9]$/, "")
          .replace(/^[^.]*/, "")
          .substr(1)
          .trim();
        level = problemBox.querySelector("p.problem_title > span.badge")?.textContent || "Unrated";
        problemId = problemBox.querySelector("p.problem_title").innerText.split(".")[0].trim();
      } else {
        title = "Unknown Problem";
        level = "Unrated";
        problemId = "0000";
      }
    }

    const contestProbId = urlParams.get("contestProbId");
    link = `${window.location.origin}/main/code/problem/problemDetail.do?contestProbId=${contestProbId}`;

    const infoDiv = targetRow.querySelector("div.info");

    if (infoDiv) {
      language = infoDiv.querySelector("ul > li:nth-child(1) > span:nth-child(1)")?.textContent?.trim() || "Unknown";
      memory = infoDiv
        .querySelector("ul > li:nth-child(2) > span:nth-child(1)")
        ?.textContent?.trim()
        ?.toUpperCase()
        ?.replace(/,/g, "") || "0";
      runtime = infoDiv
        .querySelector("ul > li:nth-child(3) > span:nth-child(1)")
        ?.textContent?.trim()
        ?.replace(/,/g, "") || "0";
      length = infoDiv
        .querySelector("ul > li:nth-child(4) > span:nth-child(1)")
        ?.textContent?.trim()
        ?.replace(/,/g, "") || "0";
    } else {
      console.warn("DashHub: 행에서 info div를 찾을 수 없어 Regex로 대체합니다");
      const rowText = targetRow.innerText;
      const langMatch = rowText.match(/([a-zA-Z\+\#]+)\s*언어/);
      language = langMatch ? langMatch[1] : "Unknown";
      const memMatch = rowText.match(/([\d,]+)\s*kb\s*메모리/i);
      memory = memMatch ? memMatch[1] : "0";
      const timeMatch = rowText.match(/([\d,]+)\s*ms\s*실행시간/i);
      runtime = timeMatch ? timeMatch[1] : "0";
      const lenMatch = rowText.match(/([\d,]+)\s*코드길이/);
      length = lenMatch ? lenMatch[1] : "0";
    }

    // Fail Case
    const resultParam = urlParams.get("result");
    if (resultParam && resultParam !== "pass") {
      memory = "-1";
      runtime = "-1";
    }

    extension = languages[language.toLowerCase()];
    const timeDateMatch = targetRow.innerText.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    submissionTime = timeDateMatch ? timeDateMatch[0] : getDateString(new Date());
  }

  const data = await getProblemData(problemId);

  if (isNull(data?.code)) {
    console.error("소스코드 데이터가 없습니다.");
    return;
  }
  const code = data.code;

  return createSubmissionMetadata({
    link,
    problemId,
    level,
    title,
    extension,
    code,
    runtime,
    memory,
    length,
    submissionTime,
    language,
  });
}

async function createSubmissionMetadata(origin) {
  const {
    link,
    problemId,
    level,
    extension,
    title,
    runtime,
    memory,
    code,
    length,
    submissionTime,
    language,
  } = origin;

  /*
   * Handle first-letter uppercase for consistent language naming
   * e.g., JAVA -> Java, but C++ remains C++
   */
  const lang =
    language === language.toUpperCase()
      ? language.substring(0, 1) + language.substring(1).toLowerCase()
      : language;

  const directory = await getDirNameByOrgOption(
    constructProblemPath(PLATFORM_PATHS.SWEA, level, problemId, title, language),
    lang
  );

  const message = constructCommitMessage(PLATFORM_PATHS.SWEA, level, title, runtime, memory);
  const fileName = `${convertSingleCharToDoubleChar(title)}.${extension}`;
  const dateInfo = submissionTime ?? getDateString(new Date(Date.now()));

  const readme = constructReadme(
    PLATFORM_PATHS.SWEA,
    level,
    title,
    problemId,
    link,
    memory,
    runtime,
    null,
    null,
    null,
    null,
    length,
    dateInfo
  );

  return { problemId, directory, message, fileName, readme, code };
}
