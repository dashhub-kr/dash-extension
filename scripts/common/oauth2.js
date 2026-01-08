/* global config */
/* eslint-disable no-unused-vars */

/**
 * OAuth2 Authentication Module
 */
const oAuth2 = {
  /**
   * Initialize Configuration
   */
  init() {
    this.KEY = "DashHub_token";
    this.ACCESS_TOKEN_URL = config.ACCESS_TOKEN_URL;
    this.AUTHORIZATION_URL = config.AUTHORIZATION_URL;
    this.CLIENT_ID = config.CLIENT_ID;
    this.CLIENT_SECRET = config.CLIENT_SECRET;
    this.REDIRECT_URL = config.REDIRECT_URL;
    this.SCOPES = ["repo"];
  },

  /**
   * Begin OAuth Flow
   */
  begin() {
    this.init();

    let url = `${this.AUTHORIZATION_URL}?client_id=${this.CLIENT_ID}&scope=`;
    for (let i = 0; i < this.SCOPES.length; i += 1) {
      url += this.SCOPES[i];
    }

    // Temporarily open pipe for auth
    chrome.storage.local.set({ pipe_DashHub: true }, () => {
      chrome.tabs.create({ url, selected: true }, function () {
        window.close(); // Close popup
      });
    });
  },
};
