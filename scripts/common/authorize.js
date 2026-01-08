/* --------------------------------------------------------------------------
   GitHub Authorization Handler
   -------------------------------------------------------------------------- */

const localAuth = {
  /**
   * Initialize
   */
  init() {
    this.KEY = "DashHub_token";
    this.ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
    this.AUTHORIZATION_URL = "https://github.com/login/oauth/authorize";
    this.CLIENT_ID = "Ov23lizCovQNe8ijxQQl";
    this.CLIENT_SECRET = "79910b0c629cdea667351e847c8fe25c323842f8";
    this.REDIRECT_URL = "https://github.com/";
    this.SCOPES = ["repo"];
  },

  /**
   * Parse Access Code from URL
   * @param {string} url - URL containing the access code
   */
  parseAccessCode(url) {
    if (url.match(/\?error=(.+)/)) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) chrome.tabs.remove(tabs[0].id);
      });
    } else {
      const accessCode = url.match(/\?code=([\w\/\-]+)/);
      if (accessCode) {
        this.requestToken(accessCode[1]);
      }
    }
  },

  /**
   * Request Access Token
   * @param {string} code - Access code from provider
   */
  requestToken(code) {
    const that = this;
    const data = new FormData();
    data.append("client_id", this.CLIENT_ID);
    data.append("client_secret", this.CLIENT_SECRET);
    data.append("code", code);

    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const match = xhr.responseText.match(/access_token=([^&]*)/);
          if (match) {
            that.finish(match[1]);
          } else {
            that.handleError();
          }
        } else {
          that.handleError();
        }
      }
    });
    xhr.open("POST", this.ACCESS_TOKEN_URL, true);
    xhr.send(data);
  },

  /**
   * Handle Error
   */
  handleError() {
    chrome.runtime.sendMessage({
      closeWebPage: true,
      isSuccess: false,
    });
  },

  /**
   * Finish Authentication
   * @param {string} token - OAuth2 token
   */
  finish(token) {
    const AUTHENTICATION_URL = "https://api.github.com/user";

    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const username = JSON.parse(xhr.responseText).login;
          chrome.runtime.sendMessage({
            closeWebPage: true,
            isSuccess: true,
            token,
            username,
            KEY: this.KEY,
          });
        }
      }
    });
    xhr.open("GET", AUTHENTICATION_URL, true);
    xhr.setRequestHeader("Authorization", `token ${token}`);
    xhr.send();
  },
};

// Initialize
localAuth.init();

// Check for Access Code
const link = window.location.href;
if (window.location.host === "github.com") {
  chrome.storage.local.get("pipe_DashHub", (data) => {
    if (data && data.pipe_DashHub) {
      localAuth.parseAccessCode(link);
    }
  });
}
