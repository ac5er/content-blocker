import contentStyle from '../styles/content.scss';
import Simmer from 'simmerjs';
const simmer = new Simmer(window, {
  depth: 20
});

const informationOverlayElementId = 'cbextinformationoverlay';
const mouseOverlayElementId = 'cbextmouseoverlay';
const focusOverlayElementId = 'cbextfocusoverlay';
let focusTree = [];
let focusTreeCurrentIndex = -1;
let selectionActive = false;
let blockListCount = 0;
let informationOverlayElementHeight = 45;
let informationOverlayElementHideAt = informationOverlayElementHeight + 100;
let blockingStyleElement,
  extensionStyleElement,
  currentMouseoverElement,
  mouseOverlayElement,
  focusOverlayElement,
  informationOverlayElement;

const enterSelectionMode = () => {
  loadBlockList(true);

  selectionActive = true;
  addExtensionStyles();
  addInformationOverlay();
  setBadge('on', '#2ec4b6');

  chrome.extension.sendMessage({
    command: 'set_title',
    title: 'Click to quit selection mode...'
  });

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('click', onClick);
  window.addEventListener('resize', onResizeOrScroll);
  window.addEventListener('scroll', onResizeOrScroll, true);
  window.addEventListener('mouseout', onMouseOut);
};

const quitSelectionMode = () => {
  selectionActive = false;

  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('keyup', onKeyUp);
  document.removeEventListener('click', onClick);
  window.removeEventListener('resize', onResizeOrScroll);
  window.removeEventListener('scroll', onResizeOrScroll, true);
  window.removeEventListener('mouseout', onMouseOut);

  hideMouseOverlay();
  cancelFocus();
  hideInformationOverlay();
  setBadgeAsBlockCount();

  chrome.extension.sendMessage({
    command: 'set_title'
  });
};

const addExtensionStyles = () => {
  if (extensionStyleElement) {
    return;
  }

  extensionStyleElement = document.createElement('style');
  extensionStyleElement.type = 'text/css';
  extensionStyleElement.appendChild(document.createTextNode(contentStyle));
  document.head.appendChild(extensionStyleElement);
};

const addBlockRuleForCurrentElement = () => {
  if (!focusTree[focusTreeCurrentIndex]) {
    return;
  }

  const selector = getSelector(focusTree[focusTreeCurrentIndex]);
  if (!selector) {
    return;
  }

  cancelFocus();
  chrome.extension.sendMessage({
    command: 'add_block_rule',
    selector
  });
};

const applyBlockList = (blockList, noBadgeChange) => {
  if (!blockList) {
    return;
  }

  blockListCount = blockList.count;
  if (!noBadgeChange) {
    setBadgeAsBlockCount();
  }

  if (1 > blockListCount) {
    if (blockingStyleElement) {
      blockingStyleElement.parentNode.removeChild(blockingStyleElement);
      blockingStyleElement = null;
    }
    return;
  }

  const rules = blockList.rules;
  let selectors = [];
  for (let pattern in rules) {
    if (rules.hasOwnProperty(pattern)) {
      for (let selector in rules[pattern]) {
        if (rules[pattern].hasOwnProperty(selector)) {
          selectors.push(selector);
        }
      }
    }
  }

  const cssElement = document.createTextNode(
    selectors.join(', ') + '{display: none !important;}'
  );

  if (!blockingStyleElement) {
    blockingStyleElement = document.createElement('style');
    blockingStyleElement.type = 'text/css';
    document.head.appendChild(blockingStyleElement);
  }

  if (blockingStyleElement.hasChildNodes()) {
    blockingStyleElement.replaceChild(
      cssElement,
      blockingStyleElement.firstChild
    );
  } else {
    blockingStyleElement.appendChild(cssElement);
  }
};

const setBadgeAsBlockCount = () => {
  setBadge(blockListCount ? String(blockListCount) : ''); // No badge for no rules
};

const setBadge = (text, color) => {
  chrome.extension.sendMessage({ command: 'set_badge', text, color });
};

const loadBlockList = (noBadgeChange = false) => {
  chrome.extension.sendMessage({
    command: 'request_block_list',
    responseParams: { noBadgeChange }
  });
};

const getSelector = el => {
  if (!el || el === document.documentElement || el === document.body) {
    return;
  }

  const style = window.getComputedStyle(el);
  if ('none' === style.display || 'hidden' === style.visibility) {
    return;
  }

  let selector = simmer(el);
  if (
    !selector ||
    (1 > selector.indexOf(' ') &&
      1 > selector.indexOf('>') &&
      (0 <= selector.indexOf('BODY') || 0 <= selector.indexOf('HTML')))
  ) {
    return;
  }

  return selector;
};

const cancelFocus = () => {
  focusTreeCurrentIndex = -1;
  focusTree = [];
  hideFocusOverlay();
  loadInformationOverlayContent();
};

const focusElement = el => {
  const selector = getSelector(el);
  if (selector) {
    addFocusOverlay(el);
  }
  loadInformationOverlayContent();
};

const elementOffset = el => {
  const rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
};

const addInformationOverlay = () => {
  if (!informationOverlayElement) {
    informationOverlayElement = document.createElement('div');
    informationOverlayElement.id = informationOverlayElementId;
    loadInformationOverlayContent();
    document.body.appendChild(informationOverlayElement);
  } else if ('none' === informationOverlayElement.style.display) {
    showInformationOverlay();
  }
};

const hideInformationOverlay = () => {
  if (informationOverlayElement) {
    informationOverlayElement.style.display = 'none';
  }
};

const loadInformationOverlayContent = () => {
  if (!informationOverlayElement) {
    return;
  }

  const shortcuts = getAvailableShortcuts();
  let innerHTML = '';
  for (let key in shortcuts) {
    if (
      shortcuts.hasOwnProperty(key) &&
      (4 > shortcuts[key].length || !shortcuts[key][3])
    ) {
      innerHTML += ` <b>${shortcuts[key][1]}:</b> ${shortcuts[key][2]}`;
    }
  }
  informationOverlayElement.innerHTML = innerHTML;
};

const showInformationOverlay = () => {
  informationOverlayElement.style.display = 'block';
};

const addFocusOverlay = el => {
  if (!focusOverlayElement) {
    focusOverlayElement = document.createElement('div');
    focusOverlayElement.id = focusOverlayElementId;
    document.body.appendChild(focusOverlayElement);
  } else if ('none' === focusOverlayElement.style.display) {
    focusOverlayElement.style.display = 'block';
  }

  recalculateFocusOverlay();
};

const hideFocusOverlay = () => {
  if (focusOverlayElement) {
    focusOverlayElement.style.display = 'none';
  }
};

const addMouseOverlay = el => {
  if (!mouseOverlayElement) {
    mouseOverlayElement = document.createElement('div');
    mouseOverlayElement.id = mouseOverlayElementId;
    document.body.appendChild(mouseOverlayElement);
  } else if ('none' === mouseOverlayElement.style.display) {
    mouseOverlayElement.style.display = 'block';
  }

  if (currentMouseoverElement === el) {
    return;
  }

  if (document.documentElement === el || document.body === el) {
    hideMouseOverlay();
    return;
  }

  const elOffset = elementOffset(el);
  mouseOverlayElement.style.width = el.offsetWidth + 'px';
  mouseOverlayElement.style.height = el.offsetHeight + 'px';
  mouseOverlayElement.style.top = elOffset.top + 'px';
  mouseOverlayElement.style.left = elOffset.left + 'px';

  currentMouseoverElement = el;
};

const hideMouseOverlay = () => {
  if (mouseOverlayElement) {
    mouseOverlayElement.style.display = 'none';
    currentMouseoverElement = null;
  }
};

const recalculateFocusOverlay = () => {
  if (
    !focusOverlayElement ||
    'none' === focusOverlayElement.style.display ||
    !focusTree[focusTreeCurrentIndex]
  ) {
    return;
  }

  const el = focusTree[focusTreeCurrentIndex];
  const elOffset = elementOffset(el);

  focusOverlayElement.style.width = el.offsetWidth + 'px';
  focusOverlayElement.style.height = el.offsetHeight + 'px';
  focusOverlayElement.style.top = elOffset.top + 'px';
  focusOverlayElement.style.left = elOffset.left + 'px';
};

const selectChild = () => {
  if (focusTreeCurrentIndex > 0) {
    if (getSelector(focusTree[focusTreeCurrentIndex - 1])) {
      focusElement(focusTree[--focusTreeCurrentIndex]);
    }
  } else if (
    focusTree[focusTreeCurrentIndex] &&
    focusTree[focusTreeCurrentIndex].children.length > 0 &&
    getSelector(focusTree[focusTreeCurrentIndex].children[0])
  ) {
    focusTree.unshift(focusTree[focusTreeCurrentIndex].children[0]);
    focusElement(focusTree[focusTreeCurrentIndex]);
  }
};

const selectParent = () => {
  let parentElement;

  if (!focusTree[focusTreeCurrentIndex]) {
    return;
  }

  if (1 < focusTree.length - focusTreeCurrentIndex) {
    parentElement = focusTree[focusTreeCurrentIndex + 1];
    if (!getSelector(parentElement)) {
      return;
    }
    focusTreeCurrentIndex++;
  } else {
    parentElement = focusTree[focusTreeCurrentIndex].parentNode;
    if (!getSelector(parentElement)) {
      return;
    }

    focusTree.push(parentElement);
    focusTreeCurrentIndex = focusTree.length - 1;
  }

  focusElement(parentElement);
};

const getAvailableShortcuts = () => {
  const key = 'with' + (0 > focusTreeCurrentIndex ? 'out' : '') + 'Focus';
  return shortcuts[key];
};

const onClick = e => {
  e.preventDefault();
  e.stopPropagation();

  if (getSelector(e.target)) {
    const focusTreeIndexOfTarget = focusTree.indexOf(e.target);
    if (0 <= focusTreeIndexOfTarget) {
      focusTreeCurrentIndex = focusTreeIndexOfTarget;
    } else {
      focusTreeCurrentIndex = 0;
      focusTree = [e.target];
    }
    focusElement(e.target);
  }
};

const onKeyUp = e => {
  if (e.ctrlKey || e.altKey || e.shiftKey) {
    return;
  }

  const shortcuts = getAvailableShortcuts();
  if (e.code in shortcuts) {
    shortcuts[e.code][0]();
  }
};

const onMouseMove = e => {
  if (e.target) {
    addMouseOverlay(e.target);
  }

  if (informationOverlayElement) {
    if (e.clientY <= informationOverlayElementHideAt) {
      hideInformationOverlay();
    } else if ('none' === informationOverlayElement.style.display) {
      showInformationOverlay();
    }
  }
};

const onMouseOut = e => {
  hideMouseOverlay();
};

const onResizeOrScroll = e => {
  recalculateFocusOverlay();
};

const shortcuts = {
  withFocus: {
    KeyW: [selectParent, 'W', 'Select parent'],
    KeyS: [selectChild, 'S', 'Select child'],
    Delete: [addBlockRuleForCurrentElement, 'Delete', 'Block selected element'],
    Enter: [
      addBlockRuleForCurrentElement,
      'Enter',
      'Block selected element',
      true
    ],
    Escape: [cancelFocus, 'ESC', 'Deselect']
  },
  withoutFocus: { Escape: [quitSelectionMode, 'ESC', 'Quit selection mode'] }
};

// Start listening messages
chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.command) {
    case 'enter_selection_mode':
      enterSelectionMode();
      break;
    case 'quit_selection_mode':
      sendResponse({
        selectionActive: selectionActive
      });
      quitSelectionMode();
      break;
    case 'load_block_list':
      loadBlockList(request.noBadgeChange);
      break;
    case 'block_list':
      applyBlockList(request.blockList, request.noBadgeChange);
      break;
  }
});

loadBlockList();
