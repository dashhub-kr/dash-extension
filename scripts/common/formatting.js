/**
 * Centralized Formatting and Configuration Functions
 */

// Platform Directory Constants
const PLATFORM_PATHS = {
    BAEKJOON: "BOJ",
    SWEA: "SWEA",
    PROGRAMMERS: "Programmers",
};

/**
 * Generate Directory Path for Problem
 * @param {string} platform
 * @param {string} level
 * @param {string} problemId
 * @param {string} title
 * @param {string} language
 * @returns {string} Directory path
 */
function constructProblemPath(platform, level, problemId, title, language) {
    const safeTitle = convertSingleCharToDoubleChar(title);

    // Remove detailed level if needed (e.g. Gold III -> Gold)
    const cleanLevel = level.replace(/ .*/, "");

    if (platform === PLATFORM_PATHS.BAEKJOON) {
        return `${PLATFORM_PATHS.BAEKJOON}/${cleanLevel}/${problemId}. ${safeTitle}`;
    } else if (platform === PLATFORM_PATHS.SWEA) {
        return `${PLATFORM_PATHS.SWEA}/${level}/${problemId}. ${safeTitle}`;
    }

    return `${platform}/${level}/${problemId}. ${safeTitle}`;
}

/**
 * Format Date (YYYY년 MM월 DD일 HH:mm:ss)
 * @param {Date} date
 * @returns {string}
 */
function getDateString(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}:${seconds}`;
}

/**
 * Generate Commit Message
 * @param {string} platform
 * @param {string} level
 * @param {string} title
 * @param {string} runtime
 * @param {string} memory
 * @param {string} score
 * @returns {string}
 */
function constructCommitMessage(platform, level, title, runtime, memory, score) {
    let message = `[${level}] Title: ${title}, Time: ${runtime}`;

    if (platform === PLATFORM_PATHS.BAEKJOON) {
        message += ` ms, Memory: ${memory} KB`;
        if (score && !isNaN(score)) {
            message += `, Score: ${score} point`;
        }
    } else {
        message += `, Memory: ${memory}`;
    }

    message += ` - DashHub`;
    return message;
}

/**
 * Generate README Content
 * @param {string} platform
 * @param {string} level
 * @param {string} title
 * @param {string} problemId
 * @param {string} link
 * @param {string} memory
 * @param {string} runtime
 * @param {string} category
 * @param {string} description
 * @param {string} input
 * @param {string} output
 * @param {string} codeLength
 * @param {string} dateInfo
 * @returns {string} Markdown string
 */
function constructReadme(platform, level, title, problemId, link, memory, runtime, category, description, input, output, codeLength, dateInfo) {
    let readme = `# [${level}] ${title} - ${problemId} \n\n` +
        `[문제 링크](${link}) \n\n` +
        `### 성능 요약\n\n`;

    if (platform === PLATFORM_PATHS.BAEKJOON) {
        readme += `메모리: ${memory} KB, 시간: ${runtime} ms\n\n`;
    } else {
        // SWEA
        readme += `메모리: ${memory}, 시간: ${runtime}, 코드길이: ${codeLength} Bytes\n\n`;
    }

    if (category) {
        readme += `### 분류\n\n${category || "Empty"}\n\n`;
    }

    if (dateInfo) {
        readme += `### 제출 일자\n\n${dateInfo}\n\n`;
    }

    if (description) {
        readme += `### 문제 설명\n\n${description}\n\n`;
    }

    if (input) {
        readme += `### 입력 \n\n ${input}\n\n`;
    }

    if (output) {
        readme += `### 출력 \n\n ${output}\n\n`;
    }

    if (platform === PLATFORM_PATHS.SWEA) {
        readme += `\n\n> 출처: SW Expert Academy, https://swexpertacademy.com/main/code/problem/problemList.do`;
    }

    return readme;
}
