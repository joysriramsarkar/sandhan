/**
 * Sandhan Options Page Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settingsForm');
  const sandhanUrlInput = document.getElementById('sandhanUrl');
  const defaultLangSelect = document.getElementById('defaultLang');
  const openInNewTabCheckbox = document.getElementById('openInNewTab');
  const saveStatus = document.getElementById('saveStatus');

  // Load saved settings
  try {
    const data = await chrome.storage.sync.get(['sandhanUrl', 'defaultLang', 'openInNewTab']);
    sandhanUrlInput.value = data.sandhanUrl || 'https://www.sandhan.site';
    defaultLangSelect.value = data.defaultLang || 'bn';
    openInNewTabCheckbox.checked = data.openInNewTab !== false;
  } catch (_) {
    sandhanUrlInput.value = 'https://www.sandhan.site';
    defaultLangSelect.value = 'bn';
    openInNewTabCheckbox.checked = true;
  }

  // Save on submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let url = sandhanUrlInput.value.trim().replace(/\/$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const defaultLang = defaultLangSelect.value;
    const openInNewTab = openInNewTabCheckbox.checked;

    try {
      await chrome.storage.sync.set({
        sandhanUrl: url,
        defaultLang,
        openInNewTab
      });

      saveStatus.textContent = '✅ সেটিংস সফলভাবে সংরক্ষিত হয়েছে!';
      saveStatus.style.color = 'var(--accent)';
      setTimeout(() => {
        saveStatus.textContent = '';
      }, 3000);
    } catch (err) {
      saveStatus.textContent = '❌ সংরক্ষণ করতে ব্যর্থ হয়েছে!';
      saveStatus.style.color = '#e03e2f';
    }
  });
});
