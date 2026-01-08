/* --------------------------------------------------------------------------
   Local Storage & Sync Manager
   -------------------------------------------------------------------------- */

/* Sync to Local Storage */
chrome.storage.local.get("isSync", (data) => {
  const keys = ["DashHub_token", "DashHub_username", "pipe_DashHub", "stats", "DashHub_hook", "mode_type"];
  if (!data || !data.isSync) {
    keys.forEach((key) => {
      chrome.storage.sync.get(key, (data) => {
        chrome.storage.local.set({ [key]: data[key] });
      });
    });
    chrome.storage.local.set({ isSync: true }, () => { });
  }
});

/* Initialize Stats */
getStats().then((stats) => {
  if (isNull(stats)) stats = {};
  if (isNull(stats.version)) stats.version = "0.0.0";
  if (isNull(stats.branches) || stats.version !== getVersion()) stats.branches = {};
  if (isNull(stats.submission) || stats.version !== getVersion()) stats.submission = {};
  if (isNull(stats.problems) || stats.version !== getVersion()) stats.problems = {};
  saveStats(stats);
});

/**
 * Get Object from Local Storage
 * @param {string} key
 */
async function getObjectFromLocalStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(result[key]);
    });
  });
}

/**
 * Save Object to Local Storage
 * @param {object} obj
 */
async function saveObjectInLocalStorage(obj) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(obj, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

/**
 * Remove Object from Local Storage
 * @param {string|string[]} keys
 */
async function removeObjectFromLocalStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

/**
 * Get Object from Sync Storage
 * @param {string} key
 */
async function getObjectFromSyncStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (result) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(result[key]);
    });
  });
}

/**
 * Save Object to Sync Storage
 * @param {object} obj
 */
async function saveObjectInSyncStorage(obj) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(obj, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

/**
 * Remove Object from Sync Storage
 * @param {string|string[]} keys
 */
async function removeObjectFromSyncStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(keys, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

/* --------------------------------------------------------------------------
   Getters & Setters
   -------------------------------------------------------------------------- */

async function getToken() {
  return await getObjectFromLocalStorage("DashHub_token");
}

async function getGithubUsername() {
  return await getObjectFromLocalStorage("DashHub_username");
}

async function getStats() {
  return await getObjectFromLocalStorage("stats");
}

async function getHook() {
  return await getObjectFromLocalStorage("DashHub_hook");
}

async function getModeType() {
  return await getObjectFromLocalStorage("mode_type");
}

async function saveToken(token) {
  return await saveObjectInLocalStorage({ DashHub_token: token });
}

async function saveStats(stats) {
  return await saveObjectInLocalStorage({ stats });
}

/* --------------------------------------------------------------------------
   Utils
   -------------------------------------------------------------------------- */

async function updateStatsSHAfromPath(path, sha) {
  const stats = await getStats();
  updateObjectDatafromPath(stats.submission, path, sha);
  await saveStats(stats);
}

function updateObjectDatafromPath(obj, path, data) {
  let current = obj;
  const pathArray = path.split("/").filter((p) => p !== "");
  for (const path of pathArray.slice(0, -1)) {
    if (isNull(current[path])) {
      current[path] = {};
    }
    current = current[path];
  }
  current[pathArray.pop()] = data;
}

async function getStatsSHAfromPath(path) {
  const stats = await getStats();
  return getObjectDatafromPath(stats.submission, path);
}

function getObjectDatafromPath(obj, path) {
  let current = obj;
  const pathArray = path.split("/").filter((p) => p !== "");
  for (const path of pathArray.slice(0, -1)) {
    if (isNull(current[path])) {
      return null;
    }
    current = current[path];
  }
  return current[pathArray.pop()];
}

async function updateLocalStorageStats() {
  const hook = await getHook();
  const token = await getToken();
  const git = new GitHub(hook, token);
  const stats = await getStats();
  const tree_items = [];

  await git.getTree().then((tree) => {
    tree.forEach((item) => {
      if (item.type === "blob") {
        tree_items.push(item);
      }
    });
  });

  const { submission } = stats;
  tree_items.forEach((item) => {
    updateObjectDatafromPath(submission, `${hook}/${item.path}`, item.sha);
  });

  const default_branch = await git.getDefaultBranchOnRepo();
  stats.branches[hook] = default_branch;
  await saveStats(stats);

  return stats;
}

async function getDirNameByOrgOption(dirName, language) {
  return dirName;
}



