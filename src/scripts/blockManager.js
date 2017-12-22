import helpers from './helpers';

const STORAGE_KEY = 'blockList';

const clearStorage = (callback) => {
  chrome.storage.local.clear(() => {
    callback();
  });
};

const addBlockRule = (sender, request) => {
  const pattern = helpers.trimTrailingSlash(helpers.getPatternFromURL(sender.url));
  const selector = helpers.safeSelector(request.selector);

  chrome.storage.local.get(STORAGE_KEY, (patterns) => {
    const storageObject = STORAGE_KEY in patterns ? patterns[STORAGE_KEY] : {};

    if (!(pattern in storageObject)) {
      storageObject[pattern] = {};
    }

    storageObject[pattern][selector] = { updatedAt: helpers.getTimestamp() };
    const obj = {};
    obj[STORAGE_KEY] = storageObject;

    chrome.storage.local.set(obj, () => {
      chrome.tabs.sendMessage(sender.tab.id, {
        command: 'load_block_list',
        noBadgeChange: true,
      });
    });
  });
};

const removeBlockRule = (pattern, selector, callback) => {
  const obj = {};
  obj[STORAGE_KEY] = {};

  chrome.storage.local.get(STORAGE_KEY, (storageData) => {
    if (
      STORAGE_KEY in storageData &&
      pattern in storageData[STORAGE_KEY] &&
      selector in storageData[STORAGE_KEY][pattern]
    ) {
      obj[STORAGE_KEY] = storageData[STORAGE_KEY];
      delete obj[STORAGE_KEY][pattern][selector];
      if (helpers.isEmpty(obj[STORAGE_KEY][pattern])) {
        delete obj[STORAGE_KEY][pattern];
      }

      chrome.storage.local.set(obj, () => {
        callback();
      });
    }
  });
};

const getFilteredBlockListRules = (patterns, pattern) => {
  let rules = {};

  if (patterns) {
    if (!pattern) {
      rules = patterns;
    } else if (pattern in patterns) {
      rules[pattern] = patterns[pattern];
    }
  }

  return rules;
};

const getBlockList = (url, callback) => {
  const pattern = url ? helpers.trimTrailingSlash(helpers.getPatternFromURL(url)) : '';

  chrome.storage.local.get(STORAGE_KEY, (storageData) => {
    const blockList = { rules: {}, count: 0 };

    if (STORAGE_KEY in storageData) {
      const patterns = storageData[STORAGE_KEY];
      blockList.rules = getFilteredBlockListRules(patterns, pattern);
      Object.keys(blockList.rules).forEach((key) => {
        blockList.count += Object.keys(blockList.rules[key]).length;
      });
    }

    callback(blockList);
  });
};

export default {
  addBlockRule,
  clearStorage,
  getBlockList,
  removeBlockRule,
};
