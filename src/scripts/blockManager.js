import helpers from './helpers';
const storageKey = 'blockList';

const addBlockRule = (sender, request) => {
  const pattern = helpers.trimTrailingSlash(
    helpers.getPatternFromURL(sender.url)
  );
  const selector = helpers.safeSelector(request.selector);

  chrome.storage.local.get(storageKey, patterns => {
    let storageObject = storageKey in patterns ? patterns[storageKey] : {};

    if (!(pattern in storageObject)) {
      storageObject[pattern] = {};
    }

    storageObject[pattern][selector] = { updatedAt: helpers.getTimestamp() };
    const obj = {};
    obj[storageKey] = storageObject;

    chrome.storage.local.set(obj, () => {
      chrome.tabs.sendMessage(sender.tab.id, {
        command: 'load_block_list',
        noBadgeChange: true
      });
    });
  });
};

const removeBlockRule = (pattern, selector, callback) => {
  let obj = {};
  obj[storageKey] = {};

  chrome.storage.local.get(storageKey, storageData => {
    if (
      storageKey in storageData &&
      pattern in storageData[storageKey] &&
      selector in storageData[storageKey][pattern]
    ) {
      obj[storageKey] = storageData[storageKey];
      delete obj[storageKey][pattern][selector];
      if (helpers.isEmpty(obj[storageKey][pattern])) {
        delete obj[storageKey][pattern];
      }

      chrome.storage.local.set(obj, () => {
        callback();
      });
    }
  });
};

const clearStorage = callback => {
  chrome.storage.local.clear(() => {
    callback();
  });
};

const getBlockList = (url, callback) => {
  const pattern = url
    ? helpers.trimTrailingSlash(helpers.getPatternFromURL(url))
    : '';

  chrome.storage.local.get(storageKey, storageData => {
    const blockList = { rules: {}, count: 0 };

    if (storageKey in storageData) {
      const patterns = storageData[storageKey];
      blockList.rules = filterBlockList(patterns, pattern);
      for (let key in blockList.rules) {
        if (blockList.rules.hasOwnProperty(key)) {
          blockList.count += Object.keys(blockList.rules[key]).length;
        }
      }
    }

    callback(blockList);
  });
};

const filterBlockList = (patterns, pattern) => {
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

export default { addBlockRule, clearStorage, getBlockList, removeBlockRule };
