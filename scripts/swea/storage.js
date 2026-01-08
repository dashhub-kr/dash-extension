/* --------------------------------------------------------------------------
   SWEA Local Storage Management
   -------------------------------------------------------------------------- */

/* Initialize SWEA object in local storage if not present */
getObjectFromLocalStorage("swea").then((data) => {
  if (isNull(data)) {
    saveObjectInLocalStorage({ swea: {} });
  }
});

/**
 * Update Problem Data and Clean Up Old Data
 * @param {string} problemId
 * @param {object} obj
 */
async function updateProblemData(problemId, obj) {
  return getObjectFromLocalStorage("swea").then((data) => {
    if (isNull(data)) data = {};
    if (isNull(data[problemId])) data[problemId] = {};
    data[problemId] = { ...data[problemId], ...obj, save_date: Date.now() };

    // Clean up data older than 1 week
    const date_week_ago = Date.now() - 7 * 86400000;

    for (const [key, value] of Object.entries(data)) {
      if (isNull(value) || isNull(value.save_date)) {
        delete data[key];
      } else {
        const save_date = new Date(value.save_date);
        if (date_week_ago > save_date) {
          delete data[key];
        }
      }
    }
    saveObjectInLocalStorage({ swea: data });
    return data;
  });
}

/**
 * Get Problem Data
 * @param {string} problemId
 * @returns {object}
 */
async function getProblemData(problemId) {
  return getObjectFromLocalStorage("swea").then((data) => {
    if (isNull(data)) return null;
    return data[problemId];
  });
}
