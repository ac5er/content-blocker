/** @jsx h */

import { h, app } from 'hyperapp';
import blockManager from './blockManager';

app({
  state: {
    appName: chrome.app.getDetails().name,
    message: '',
  },
  view: (state, actions) => (
    <div className="page-container overflow-visible">
      <h3 className="app-title">{state.appName} Options</h3>
      <div className="page-content">
        <div
          className="message"
          role="button"
          tabIndex="0"
          title="Click to hide this"
          onclick={actions.hideMessage}
          onkeyup={actions.handleKeyupForMessage}
        >
          {state.message}
        </div>

        <button
          className="button action-button-2"
          onclick={actions.clearStorage}
          title="Reset the extension."
        >
          <i className="icon-trash-empty" /> Clear Storage
        </button>
      </div>
    </div>
  ),
  actions: {
    clearStorage: () => {
      const confirmMessage = 'Are you sure you want to clear the storage?';
      const updateFunction = (update) => {
        blockManager.clearStorage(() => {
          update({
            message: 'Storage has been cleared!',
          });
        });
      };
      // eslint-disable-next-line no-alert, no-restricted-globals
      return confirm(confirmMessage) ? updateFunction : () => {};
    },
    hideMessage: () => (update) => {
      update({
        message: '',
      });
    },
    handleKeyupForMessage: (state, actions, event) => {
      if ([8, 27, 46].indexOf(event.keyCode) >= 0 && state.message.length) {
        actions.hideMessage();
      }
    },
  },
  events: {
    load: (state) => {
      document.title = `${state.appName} Options`;
    },
  },
});
