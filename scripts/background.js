/**
 * Solved.ac API Call
 * @param {number} problemId
 */
async function solvedApiCall(problemId) {
  return fetch(`https://solved.ac/api/v3/problem/show?problemId=${problemId}`, { method: "GET" })
    .then((query) => query.json());
}

function handleMessage(request, sender, sendResponse) {
  if (request && request.closeWebPage === true && request.isSuccess === true) {
    // Store Username & Token
    chrome.storage.local.set({ DashHub_username: request.username });
    chrome.storage.local.set({ DashHub_token: request.token });

    // Close Pipe
    chrome.storage.local.set({ pipe_DashHub: false }, () => { });

    // Redirect to Onboarding
    const urlOnboarding = `chrome-extension://${chrome.runtime.id}/welcome.html`;
    chrome.tabs.create({ url: urlOnboarding, selected: true });

  } else if (request && request.closeWebPage === true && request.isSuccess === false) {
    alert("프로필 인증 중 오류가 발생했습니다!");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) chrome.tabs.remove(tabs[0].id);
    });

  } else if (request && request.sender === "boj" && request.task === "SolvedApiCall") {
    solvedApiCall(request.problemId).then((res) => sendResponse(res));
  }

  return true;
}

chrome.runtime.onMessage.addListener(handleMessage);
