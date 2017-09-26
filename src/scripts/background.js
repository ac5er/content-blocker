import blockManager from './blockManager';
import helpers from './helpers';
const appName = chrome.app.getDetails().name;

chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.command) {
    case 'get_app_details':
      sendResponse({
        data: chrome.app.getDetails()
      });
      break;

    case 'set_badge':
      setBadge(sender.tab.id, request.text, request.color);
      break;

    case 'add_block_rule':
      blockManager.addBlockRule(sender, request);
      break;

    case 'request_block_list':
      const blockListCallback = list => {
        chrome.tabs.sendMessage(sender.tab.id, {
          command: 'block_list',
          blockList: list,
          ...request.responseParams
        });
      };

      blockManager.getBlockList(sender.url, blockListCallback);
      break;

    case 'set_title':
      chrome.browserAction.setTitle({
        tabId: sender.tab.id,
        title: request.title || appName
      });
      break;
  }
});

const setBadge = (tabId, text = '', color = '#555') => {
  chrome.browserAction.setBadgeBackgroundColor({ color, tabId });
  chrome.browserAction.setBadgeText({ text, tabId });
};
