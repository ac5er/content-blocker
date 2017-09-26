import { h, app } from 'hyperapp';
import blockManager from './blockManager';
import helpers from './helpers';

const getRulesAsArray = state => {
  const { rules } = state.blockList,
    { blockListPageLimit, viewAll } = state;
  let ruleList = [],
    i = 0;

  patterns: for (let pattern in rules) {
    if (rules.hasOwnProperty(pattern)) {
      for (let selector in rules[pattern]) {
        if (rules[pattern].hasOwnProperty(selector)) {
          const rule = rules[pattern][selector];
          rule.pattern = pattern;
          rule.selector = selector;

          ruleList.push(rule);
          if (!viewAll && ++i === blockListPageLimit) {
            break patterns;
          }
        }
      }
    }
  }

  return ruleList;
};

app({
  state: {
    extensionIsActiveOnTab: false,
    internalPage: false,
    blockList: { rules: {}, count: 0 },
    blockListPageLimit: 5,
    viewAll: false,
    tabId: null
  },
  view: (state, actions) => (
    <div class="page-container">
      {!state.internalPage &&
      state.extensionIsActiveOnTab && (
        <section>
          <button
            onclick={actions.enterSelectionMode}
            class="button-green full-width"
            title="Start selecting elements to block on this page..."
          >
            <i class="icon-plus" />{' '}
            {0 < state.blockList.count ? (
              'Block More Elements'
            ) : (
              'Select Elements to Block'
            )}
          </button>

          <div>
            <h4 class="table-title">Blocked Elements of the Page</h4>
            {1 > state.blockList.count && (
              <p>There is no blocked elements for current page.</p>
            )}

            {0 < state.blockList.count && (
              <div>
                <table class="main-table">
                  <thead>
                    <tr>
                      <th>Selector</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getRulesAsArray(state).map(rule => (
                      <tr
                        title={rule.selector}
                        data-updated-at={helpers.getDateFromTimestamp(
                          rule.updatedAt
                        )}
                      >
                        <td>
                          <div class="selector">{rule.selector}</div>
                        </td>
                        <td>
                          <button
                            class="button-clear action-button"
                            title="Remove this"
                            onclick={e => actions.removeRule(rule)}
                          >
                            <i class="icon-trash-empty" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!state.viewAll &&
                state.blockListPageLimit < state.blockList.count && (
                  <a class="button full-width" onclick={actions.viewMoreRules}>
                    View More({state.blockList.count -
                      state.blockListPageLimit})
                  </a>
                )}
                {state.viewAll &&
                state.blockListPageLimit < state.blockList.count && (
                  <a class="button full-width" onclick={actions.viewLessRules}>
                    View Less
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {!state.internalPage &&
      !state.extensionIsActiveOnTab && (
        <section>
          <p class="fw-500 error">
            Please reload the tab because the extension is not loaded on it.
          </p>
        </section>
      )}

      {state.internalPage && (
        <section>
          <p class="fw-500 error">
            The extension does not work on internal pages.
          </p>
        </section>
      )}
    </div>
  ),
  actions: {
    enterSelectionMode: state => {
      chrome.tabs.sendMessage(
        state.tabId,
        { command: 'enter_selection_mode' },
        () => {
          window.close();
        }
      );
    },
    removeRule: (state, actions, { pattern, selector }) => {
      blockManager.removeBlockRule(pattern, selector, () => {
        actions.loadBlockList(state.tabId);
      });
    },
    viewMoreRules: state => ({ viewAll: true }),
    viewLessRules: state => ({ viewAll: false }),
    getExtensionStatusOnTab: (state, actions, tab) => {
      if (helpers.isInternalPage(tab.url)) {
        return update => {
          update({ internalPage: true });
        };
      } else {
        return update => {
          chrome.tabs.sendMessage(
            tab.id,
            { command: 'quit_selection_mode' },
            response => {
              if (response && 'selectionActive' in response) {
                if (response.selectionActive) {
                  window.close();
                } else {
                  actions.loadBlockList(tab.id);
                  update({ extensionIsActiveOnTab: true, tabId: tab.id });
                }
              }
            }
          );
        };
      }
    },
    loadBlockList: (state, actions, tabId) => {
      return update => {
        chrome.tabs.get(tabId, tab => {
          const blockListCallback = list => {
            if ('count' in list) {
              update({
                blockList: list
              });
              chrome.tabs.sendMessage(tabId, {
                command: 'block_list',
                blockList: list
              });
            }
          };

          blockManager.getBlockList(tab.url, blockListCallback);
        });
      };
    }
  },
  events: {
    load: (state, actions) => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        actions.getExtensionStatusOnTab(tabs[0]);
      });
    }
  }
});
