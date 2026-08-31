/**
 * Sandhan Popup Script
 */

const DEFAULT_BASE_URL = 'https://www.sandhan.site';

document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('searchInput');
  const searchForm = document.getElementById('searchForm');
  const clearBtn = document.getElementById('clearBtn');
  const catChips = document.querySelectorAll('.cat-chip');
  const bangChips = document.querySelectorAll('.bang-chip');
  const previewContainer = document.getElementById('previewContainer');
  const previewResults = document.getElementById('previewResults');
  const openAllBtn = document.getElementById('openAllBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const visitSiteLink = document.getElementById('visitSiteLink');

  let activeCategory = 'all';
  let baseUrl = DEFAULT_BASE_URL;
  let debounceTimer = null;

  // 1. Load settings & Theme
  try {
    const config = await chrome.storage.sync.get(['sandhanUrl', 'sandhanTheme', 'defaultLang']);
    if (config.sandhanUrl) {
      baseUrl = config.sandhanUrl;
      visitSiteLink.href = baseUrl;
    }
    const savedTheme = config.sandhanTheme || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  } catch (_) {}

  // 2. Theme Toggle
  themeToggleBtn.addEventListener('click', async () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    themeToggleBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    try {
      await chrome.storage.sync.set({ sandhanTheme: next });
    } catch (_) {}
  });

  // 3. Options Button
  optionsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  // 4. Category Selector
  catChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      catChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.getAttribute('data-cat') || 'all';
      if (searchInput.value.trim()) {
        triggerLivePreview(searchInput.value.trim());
      }
    });
  });

  // 5. Bang Chips
  bangChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const bang = chip.getAttribute('data-bang') || '';
      searchInput.value = bang;
      searchInput.focus();
      clearBtn.style.display = 'block';
    });
  });

  // 6. Search Input & Clear
  searchInput.addEventListener('input', () => {
    const val = searchInput.value;
    clearBtn.style.display = val ? 'block' : 'none';

    clearTimeout(debounceTimer);
    if (val.trim().length >= 2 && !val.trim().startsWith('!')) {
      debounceTimer = setTimeout(() => {
        triggerLivePreview(val.trim());
      }, 300);
    } else {
      previewContainer.style.display = 'none';
    }
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    previewContainer.style.display = 'none';
    searchInput.focus();
  });

  // 7. Form Submit (Execute full search)
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    executeFullSearch(query, activeCategory);
  });

  openAllBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) executeFullSearch(query, activeCategory);
  });

  function executeFullSearch(query, cat) {
    let url = `${baseUrl}/?q=${encodeURIComponent(query)}`;
    if (cat && cat !== 'all') {
      url += `&cat=${encodeURIComponent(cat)}`;
    }
    chrome.tabs.create({ url });
    window.close();
  }

  // 8. Live Preview Suggestions
  async function triggerLivePreview(query) {
    try {
      const apiUrl = `${baseUrl}/api/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(activeCategory)}&page=1`;
      const res = await fetch(apiUrl);
      if (!res.ok) return;
      const data = await res.json();
      const items = data.results || [];

      if (items.length === 0 && !data.knowledge) {
        previewContainer.style.display = 'none';
        return;
      }

      previewResults.innerHTML = '';

      // If knowledge panel exists
      if (data.knowledge) {
        const kpDiv = document.createElement('a');
        kpDiv.className = 'preview-item';
        kpDiv.href = data.knowledge.sourceUrl || '#';
        kpDiv.target = '_blank';
        kpDiv.innerHTML = `
          <div class="preview-item-title">✨ ${escapeHtml(data.knowledge.title)}</div>
          <div class="preview-item-domain">${escapeHtml(data.knowledge.subtitle || 'উইকিপিডিয়া')}</div>
          <div class="preview-item-snippet">${escapeHtml(data.knowledge.description || '')}</div>
        `;
        kpDiv.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: data.knowledge.sourceUrl });
        });
        previewResults.appendChild(kpDiv);
      }

      // Add top 3 search results
      items.slice(0, 3).forEach((item) => {
        const itemEl = document.createElement('a');
        itemEl.className = 'preview-item';
        itemEl.href = item.url;
        itemEl.innerHTML = `
          <div class="preview-item-title">${escapeHtml(item.title)}</div>
          <div class="preview-item-domain">${escapeHtml(item.domain || item.source)}</div>
          <div class="preview-item-snippet">${escapeHtml(item.snippet)}</div>
        `;
        itemEl.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: item.url });
        });
        previewResults.appendChild(itemEl);
      });

      previewContainer.style.display = 'flex';
    } catch (_) {
      previewContainer.style.display = 'none';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
