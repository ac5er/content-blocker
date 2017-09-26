import { h, app } from 'hyperapp';
import blockManager from './blockManager';
import helpers from './helpers';

app({
  state: {
    appName: chrome.app.getDetails().name,
    message: ''
  },
  view: (state, actions) => (
    <div class="page-container">
      <h3 class="app-title">{state.appName} Options</h3>
      <div class="page-content">
        <div
          class="message"
          title="Click to hide this"
          onclick={actions.hideMessage}
        >
          {state.message}
        </div>

        <a
          class="button action-button-2"
          onclick={actions.clearStorage}
          title="Reset the extension."
        >
          <i class="icon-trash-empty" /> Clear Storage
        </a>
      </div>
    </div>
  ),
  actions: {
    clearStorage: () => {
      if (confirm('Are you sure you want to clear the storage?')) {
        return update => {
          blockManager.clearStorage(() => {
            update({
              message: 'Storage has been cleared!'
            });
          });
        };
      }
    },
    hideMessage: () => update => {
      update({
        message: ''
      });
    }
  },
  events: {
    load: (state, actions) => {
      document.title = state.appName + ' Options';
    }
  }
});
