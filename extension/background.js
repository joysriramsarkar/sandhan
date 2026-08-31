/**
 * Sandhan Search Engine - Background Service Worker
 * Omnibox integration (s <space>), Context Menu search, Bang shortcuts
 */

const DEFAULT_BASE_URL = 'https://www.sandhan.site';

async function getBaseUrl() {
  try {
    const data = await chrome.storage.sync.get(['sandhanUrl']);
    return data.sandhanUrl || DEFAULT_BASE_URL;
  } catch (_) {
    return DEFAULT_BASE_URL;
  }
}

async function getOpenInNewTab() {
  try {
    const data = await chrome.storage.sync.get(['openInNewTab']);
    return data.openInNewTab !== false; // Default true
  } catch (_) {
    return true;
  }
}

async function openSearchUrl(url) {
  const newTab = await getOpenInNewTab();
  if (newTab) {
    chrome.tabs.create({ url });
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.update(tabs[0].id, { url });
      } else {
        chrome.tabs.create({ url });
      }
    });
  }
}

// 1. Omnibox Integration (Type "s" + Space/Tab in browser address bar)
chrome.omnibox.onInputStarted.addListener(() => {
  chrome.omnibox.setDefaultSuggestion({
    description: 'সন্ধানে খুঁজুন: <match>%s</match>'
  });
});

chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const trimmed = text.trim();
  if (!trimmed) return;

  const suggestions = [];

  // Bang suggestions
  if (trimmed.startsWith('!')) {
    suggestions.push(
      { content: `!w ${trimmed.slice(1).trim()}`, description: `উইকিপিডিয়া অনুসন্ধান: <match>!w ${trimmed.slice(1).trim()}</match>` },
      { content: `!g ${trimmed.slice(1).trim()}`, description: `গুগল অনুসন্ধান: <match>!g ${trimmed.slice(1).trim()}</match>` },
      { content: `!gh ${trimmed.slice(1).trim()}`, description: `গিটহাব অনুসন্ধান: <match>!gh ${trimmed.slice(1).trim()}</match>` }
    );
  } else {
    suggestions.push(
      { content: trimmed, description: `সন্ধানে অনুসন্ধান করুন: <match>${trimmed}</match>` },
      { content: `!w ${trimmed}`, description: `উইকিপিডিয়ায় খুঁজুন: <dim>!w ${trimmed}</dim>` },
      { content: `!gh ${trimmed}`, description: `গিটহাবে খুঁজুন: <dim>!gh ${trimmed}</dim>` }
    );
  }

  suggest(suggestions);
});

chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const trimmed = text.trim();
  if (!trimmed) return;

  const baseUrl = await getBaseUrl();
  const searchUrl = `${baseUrl}/?q=${encodeURIComponent(trimmed)}`;

  if (disposition === 'currentTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.update(tabs[0].id, { url: searchUrl });
      } else {
        chrome.tabs.create({ url: searchUrl });
      }
    });
  } else {
    chrome.tabs.create({ url: searchUrl });
  }
});

// 2. Context Menu (Right-click selected text)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sandhan-search',
    title: 'সন্ধানে খুঁজুন: "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'sandhan-search-wiki',
    title: 'উইকিপিডিয়ায় খুঁজুন (!w): "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'sandhan-open-home',
    title: 'সন্ধান হোমপেজ খুলুন',
    contexts: ['page', 'action']
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  const baseUrl = await getBaseUrl();
  const query = (info.selectionText || '').trim();

  if (info.menuItemId === 'sandhan-search' && query) {
    openSearchUrl(`${baseUrl}/?q=${encodeURIComponent(query)}`);
  } else if (info.menuItemId === 'sandhan-search-wiki' && query) {
    openSearchUrl(`${baseUrl}/?q=${encodeURIComponent('!w ' + query)}`);
  } else if (info.menuItemId === 'sandhan-open-home') {
    openSearchUrl(baseUrl);
  }
});
