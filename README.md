# (Simple) Content Blocker Extension for Chrome

Easily block parts of web pages you don't want to see again.
It prevents you from losing focus.

Available at **[Chrome Web Store](https://chrome.google.com/webstore/detail/content-blocker/ieklomehneppmfijedjfmahkelgoolgh)**.

## Screenshots

![Basic usage of extension](https://rawgit.com/ac5er/content-blocker/master/resources/promo/basic-usage.gif)

Select an element and press delete to block it:

![Select an element and press delete to block it](https://rawgit.com/ac5er/content-blocker/master/resources/promo/focus-overlay.png)

Use popup menu to unblock elements:

![Use popup menu to unblock elements](https://rawgit.com/ac5er/content-blocker/master/resources/promo/popup-menu.png)

## Hack It

Clone the repository:

```bash
git clone https://github.com/ac5er/content-blocker.git && cd content-blocker
```

Run following commands if you are using **yarn**:

```bash
yarn
yarn run dev
```

If you are comfortable with **npm** run these:

```bash
npm i
npm run dev
```

Enable _Developer mode_ on Chrome's extensions page and click _Load unpacked extension_ and select _dist_ folder.
