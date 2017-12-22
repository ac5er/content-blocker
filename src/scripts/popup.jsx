/** @jsx h */

import { h, app } from 'hyperapp';
import blockManager from './blockManager';
import helpers from './helpers';

app({
  state: {
    extensionIsActiveOnTab: false,
    internalPage: false,
    blockList: { rules: [], count: 0 },
    blockListPageLimit: 5,
    viewAll: false,
    tabId: null,
  },
  view: (state, actions) => (
    <div className="page-container">
      {!state.internalPage &&
        state.extensionIsActiveOnTab && (
          <section>
            <button
              onclick={actions.enterSelectionMode}
              className="button-green full-width"
              title="Start selecting elements to block on this page..."
            >
              <i className="icon-plus" />{' '}
              {state.blockList.count > 0 ? 'Block More Elements' : 'Select Elements to Block'}
            </button>

            <div>
              <h4 className="table-title">Blocked Elements on the Page</h4>
              {state.blockList.count < 1 && <p>There is no blocked elements on current page.</p>}

              {state.blockList.count > 0 && (
                <div>
                  <table className="main-table">
                    <thead>
                      <tr>
                        <th>Selector</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(state.viewAll
                        ? state.blockList.rules
                        : state.blockList.rules.slice(0, state.blockListPageLimit)
                      ).map(rule => (
                        <tr
                          title={rule.selector}
                          data-updated-at={helpers.getDateFromTimestamp(rule.updatedAt)}
                        >
                          <td>
                            <div className="selector">{rule.selector}</div>
                          </td>
                          <td>
                            <button
                              className="button-clear action-button"
                              title="Remove this"
                              onclick={() => actions.removeRule(rule)}
                            >
                              <i className="icon-trash-empty" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!state.viewAll &&
                    state.blockListPageLimit < state.blockList.count && (
                      <button className="button full-width" onclick={actions.viewMoreRules}>
                        View More({state.blockList.count - state.blockListPageLimit})
                      </button>
                    )}
                  {state.viewAll &&
                    state.blockListPageLimit < state.blockList.count && (
                      <button className="button full-width" onclick={actions.viewLessRules}>
                        View Less
                      </button>
                    )}
                </div>
              )}
            </div>
          </section>
        )}

      {!state.internalPage &&
        !state.extensionIsActiveOnTab && (
          <section>
            <p className="fw-500 error nomargin">
              Please reload the tab because the extension is not loaded on it.
            </p>
          </section>
        )}

      {state.internalPage && (
        <section>
          <p className="fw-500 error nomargin">The extension does not work on internal pages.</p>
        </section>
      )}
    </div>
  ),
  actions: {
    enterSelectionMode: (state) => {
      chrome.tabs.sendMessage(state.tabId, { command: 'enter_selection_mode' }, () => {
        window.close();
      });
    },
    removeRule: (state, actions, { pattern, selector }) => {
      blockManager.removeBlockRule(pattern, selector, () => {
        actions.loadBlockList(state.tabId);
      });
    },
    viewMoreRules: () => ({ viewAll: true }),
    viewLessRules: () => ({ viewAll: false }),
    getExtensionStatusOnTab: (state, actions, tab) => {
      if (helpers.isInternalPage(tab.url)) {
        return (update) => {
          update({ internalPage: true });
        };
      }
      return (update) => {
        chrome.tabs.sendMessage(tab.id, { command: 'quit_selection_mode' }, (response) => {
          if (response && 'selectionActive' in response) {
            if (response.selectionActive) {
              window.close();
            } else {
              actions.loadBlockList(tab.id);
              update({ extensionIsActiveOnTab: true, tabId: tab.id });
            }
          }
        });
      };
    },
    loadBlockList: (state, actions, tabId) => (update) => {
      chrome.tabs.get(tabId, (tab) => {
        const blockListCallback = (list) => {
          const blockList = { rules: [], count: 0 };
          if ('count' in list) {
            blockList.count = list.count;
            Object.keys(list.rules).forEach((pattern) => {
              Object.keys(list.rules[pattern]).forEach((selector) => {
                // eslint-disable-next-line max-len
                blockList.rules.push(Object.assign({}, list.rules[pattern][selector], { pattern, selector }));
              });
            });
          }

          update({
            blockList,
          });
          chrome.tabs.sendMessage(tabId, {
            command: 'block_list',
            blockList: list,
          });
        };

        blockManager.getBlockList(tab.url, blockListCallback);
      });
    },
  },
  events: {
    load: (state, actions) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        actions.getExtensionStatusOnTab(tabs[0]);
      });
    },
  },
});
