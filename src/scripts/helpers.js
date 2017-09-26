const getTimestamp = () => Math.floor(Date.now() / 1000);

const getDateFromTimestamp = timestamp => {
  const date = new Date(timestamp * 1000);
  const day = '0' + date.getDate();
  const month = '0' + (date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = '0' + date.getHours();
  const minutes = '0' + date.getMinutes();
  const seconds = '0' + date.getSeconds();

  const formattedDate = year + '-' + month.substr(-2) + '-' + day.substr(-2);
  const formattedTime =
    hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
  return formattedDate + ' ' + formattedTime;
};

const getPatternFromURL = url => {
  return parseURL(url).hostname.replace(/^www[0-9]*\.+/, '');
};

const isEmpty = obj => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
};

const isInternalPage = url => {
  return url.substr(0, 9) === 'chrome://';
};

const stripURL = prmURL => {
  const url = parseURL(prmURL);
  return trimTrailingSlash(url.hostname + url.pathname);
};

const stripURLHash = url => {
  return url.split('#')[0];
};

const parseURL = url => {
  const l = document.createElement('a');
  l.href = url;
  return l;
};

const safeSelector = str => {
  let selector = str.replace(/,/g, '');
  selector = selector.replace(/^\s+|\s+$/g, '');

  return selector;
};

const trimTrailingSlash = str => str.replace(/\/+$/g, '');

export default {
  getTimestamp,
  getDateFromTimestamp,
  getPatternFromURL,
  isEmpty,
  isInternalPage,
  parseURL,
  safeSelector,
  stripURL,
  stripURLHash,
  trimTrailingSlash
};
