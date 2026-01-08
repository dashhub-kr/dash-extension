/* --------------------------------------------------------------------------
   TTLCache for BOJ Data
   -------------------------------------------------------------------------- */

/* eslint-disable no-unused-vars */

class TTLCacheStats {
  constructor(name) {
    this.name = name;
    this.stats = null;
    this.saveTimer = null;
  }

  async forceLoad() {
    this.stats = await getStats();
    if (isNull(this.stats[this.name])) {
      this.stats[this.name] = {};
    }
  }

  async load() {
    if (this.stats === null) {
      await this.forceLoad();
    }
  }

  async save() {
    // Save only once per second to prevent high load
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(async () => {
      const clone = this.stats[this.name];
      await this.forceLoad();
      this.stats[this.name] = clone;
      await saveStats(this.stats);
      this.saveTimer = null;
    }, 1000);
  }

  async expired() {
    await this.load();
    if (!this.stats[this.name].last_check_date) {
      this.stats[this.name].last_check_date = Date.now();
      this.save(this.stats);
      return;
    }

    const date_yesterday = Date.now() - 86400000; // 1 day
    if (date_yesterday < this.stats[this.name].last_check_date) return;

    const date_week_ago = Date.now() - 7 * 86400000;

    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(this.stats[this.name])) {
      if (!value || !value.save_date) {
        delete this.stats[this.name][key];
      } else {
        const save_date = new Date(value.save_date);
        // Delete if older than 1 week
        if (date_week_ago > save_date) {
          delete this.stats[this.name][key];
        }
      }
    }
    this.stats[this.name].last_check_date = Date.now();
    await this.save();
  }

  async update(data) {
    await this.expired();
    await this.load();
    this.stats[this.name][data.id] = {
      ...data,
      save_date: Date.now(),
    };
    await this.save();
  }

  async get(id) {
    await this.load();
    const cur = this.stats[this.name];
    if (isNull(cur)) return null;
    return cur[id];
  }
}

const problemCache = new TTLCacheStats("problem");
const submitCodeCache = new TTLCacheStats("scode");
const SolvedACCache = new TTLCacheStats("solvedac");

async function updateProblemsFromStats(problem) {
  const data = {
    id: problem.problemId,
    problem_description: problem.problem_description,
    problem_input: problem.problem_input,
    problem_output: problem.problem_output,
    memory: problem.memory,
    runtime: problem.runtime,
  };
  await problemCache.update(data);
}

async function getProblemFromStats(problemId) {
  return problemCache.get(problemId);
}

async function updateSubmitCodeFromStats(obj) {
  const data = {
    id: obj.submissionId,
    data: obj.code,
  };
  await submitCodeCache.update(data);
}

async function getSubmitCodeFromStats(submissionId) {
  return submitCodeCache.get(submissionId).then((x) => x?.data);
}

async function updateSolvedACFromStats(obj) {
  const data = {
    id: obj.problemId,
    data: obj.jsonData,
  };
  await SolvedACCache.update(data);
}

async function getSolvedACFromStats(problemId) {
  return SolvedACCache.get(problemId).then((x) => x?.data);
}
