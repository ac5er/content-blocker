const getTimestamp = () => Math.floor(Date.now() / 1000);

const getDateFromTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const day = `0${date.getDate()}`;
  const month = `0${date.getMonth() + 1}`;
  const year = date.getFullYear();
  const hours = `0${date.getHours()}`;
  const minutes = `0${date.getMinutes()}`;
  const seconds = `0${date.getSeconds()}`;

  const formattedDate = `${year}-${month.substr(-2)}-${day.substr(-2)}`;
  const formattedTime = `${hours.substr(-2)}:${minutes.substr(-2)}:${seconds.substr(-2)}`;
  return `${formattedDate} ${formattedTime}`;
};

const isEmpty = obj => Object.keys(obj).length === 0;

const isInternalPage = url => url.startsWith('chrome://');

const trimTrailingSlash = str => str.replace(/\/+$/g, '');

const parseURL = (url) => {
  const l = document.createElement('a');
  l.href = url;
  return l;
};

const getPatternFromURL = url => parseURL(url).hostname.replace(/^www[0-9]*\.+/, '');

const stripURL = (prmURL) => {
  const url = parseURL(prmURL);
  return trimTrailingSlash(url.hostname + url.pathname);
};

const stripURLHash = url => url.split('#')[0];

const safeSelector = (str) => {
  let selector = str.replace(/,/g, '');
  selector = selector.replace(/^\s+|\s+$/g, '');

  return selector;
};

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
  trimTrailingSlash,
};
