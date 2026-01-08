/* --------------------------------------------------------------------------
   Utility Functions
   -------------------------------------------------------------------------- */

/**
 * Get Extension Version
 * @returns {string}
 */
function getVersion() {
  return chrome.runtime.getManifest().version;
}

/**
 * Check if Element Exists
 * @param {DOMElement} element
 * @returns {boolean}
 */
function elementExists(element) {
  return element !== undefined && element !== null && element.hasOwnProperty("length") && element.length > 0;
}

/**
 * Check if Value is Null or Undefined
 * @param {any} value
 * @returns {boolean}
 */
function isNull(value) {
  return value === null || value === undefined;
}

/**
 * Check if Value is Empty
 * @param {any} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return isNull(value) || (value.hasOwnProperty("length") && value.length === 0);
}

/**
 * Calculate UTF-8 Length (Korean = 3 bytes)
 * @param {string} str
 * @returns {number}
 */
function utf8Length(str) {
  const normalizedStr = str.replace(/\r\n/g, "\n");
  return new TextEncoder().encode(normalizedStr).length;
}

/**
 * Ensure Default Values for Object
 * @param {Object} obj
 * @returns {Object}
 */
function ensureDefaultValues(obj) {
  if (isEmpty(obj["codeLength"]) && !isEmpty(obj["code"])) {
    const code = obj["code"];
    obj["codeLength"] = utf8Length(code);
  }
  if (isEmpty(obj["problem_tags"]) && !isEmpty(obj["code"])) {
    obj["problem_tags"] = ["분류 없음"];
  }
  return obj;
}

/**
 * Check if Object is Not Empty Recursively
 * @param {any} obj
 * @returns {boolean}
 */
function isNotEmpty(obj) {
  if (isEmpty(obj)) return false;
  if (typeof obj !== "object") return true;
  if (obj.length === 0) return false;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (!isNotEmpty(obj[key])) return false;
    }
  }
  return true;
}

/**
 * Escape HTML Characters
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

/** String Prototype: Escape HTML */
String.prototype.escapeHtml = function () {
  return escapeHtml(this);
};

/**
 * Unescape HTML Characters
 * @param {string} text
 * @returns {string}
 */
function unescapeHtml(text) {
  const unescaped = {
    "&amp;": "&",
    "&#38;": "&",
    "&lt;": "<",
    "&#60;": "<",
    "&gt;": ">",
    "&#62;": ">",
    "&apos;": "'",
    "&#39;": "'",
    "&quot;": '"',
    "&#34;": '"',
    "&nbsp;": " ",
    "&#160;": " ",
  };
  return text.replace(/&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160);/g, function (m) {
    return unescaped[m];
  });
}

/** String Prototype: Unescape HTML */
String.prototype.unescapeHtml = function () {
  return unescapeHtml(this);
};

/**
 * Convert Single Byte Characters to Double Byte (Fullwidth)
 * @param {string} text
 * @returns {string}
 */
function convertSingleCharToDoubleChar(text) {
  const map = {
    "!": "！",
    "%": "％",
    "&": "＆",
    "(": "（",
    ")": "）",
    "*": "＊",
    "+": "＋",
    ",": "，",
    "-": "－",
    ".": "．",
    "/": "／",
    ":": "：",
    ";": "；",
    "<": "＜",
    "=": "＝",
    ">": "＞",
    "?": "？",
    "@": "＠",
    "[": "［",
    "\\": "＼",
    "]": "］",
    "^": "＾",
    _: "＿",
    "`": "｀",
    "{": "｛",
    "|": "｜",
    "}": "｝",
    "~": "～",
    " ": " ", // Space to FOUR-PER-EM SPACE
  };
  return text.replace(/[!%&()*+,\-./:;<=>?@\[\\\]^_`{|}~ ]/g, function (m) {
    return map[m];
  });
}

/**
 * Base64 Encode (Unicode Support)
 * @param {string} str
 * @returns {string}
 */
function b64EncodeUnicode(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(`0x${p1}`);
    })
  );
}

/**
 * Base64 Decode (Unicode Support)
 * @param {string} b64str
 * @returns {string}
 */
function b64DecodeUnicode(b64str) {
  return decodeURIComponent(
    atob(b64str)
      .split("")
      .map(function (c) {
        return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`;
      })
      .join("")
  );
}

/**
 * Parse Number from String
 * @param {string} str
 * @returns {number}
 */
function parseNumberFromString(str) {
  const numbers = str.match(/\d+/g);
  if (isNotEmpty(numbers) && numbers.length > 0) {
    return Number(numbers[0]);
  }
  return NaN;
}

/**
 * Group Array by Key
 * @param {object[]} array
 * @param {string} key
 * @returns {object} Map of grouped items
 */
function groupBy(array, key) {
  return array.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}

/**
 * Get Max Values from Grouped Array
 * @param {object[]} arr
 * @param {string} key
 * @param {function} compare
 * @returns {object[]}
 */
function maxValuesGroupBykey(arr, key, compare) {
  const map = groupBy(arr, key);
  const result = [];
  for (const [key, value] of Object.entries(map)) {
    const maxValue = value.reduce((max, current) => {
      return compare(max, current) > 0 ? max : current;
    });
    result.push(maxValue);
  }
  return result;
}

/**
 * Filter Array by Conditions
 * @param {object[]} arr
 * @param {object} conditions
 * @returns {object[]}
 */
function filter(arr, conditions) {
  return arr.filter((item) => {
    for (const [key, value] of Object.entries(conditions)) {
      if (!item[key].includes(value)) return false;
    }
    return true;
  });
}

/**
 * Calculate Git Blob SHA
 * @param {string} content
 * @returns {string}
 */
function calculateBlobSHA(content) {
  return sha1(`blob ${new Blob([content]).size}\0${content}`);
}

/**
 * Async Pool
 * @param {number} poolLimit
 * @param {array} array
 * @param {function} iteratorFn
 */
async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

/**
 * Combine Two Arrays of Objects
 * @param {object[]} a
 * @param {object[]} b
 * @returns {object[]}
 */
function combine(a, b) {
  return a.map((x, i) => ({ ...x, ...b[i] }));
}

if (typeof __DEV__ !== "undefined") {
  var exports = (module.exports = {});
  exports.filter = filter;
}



