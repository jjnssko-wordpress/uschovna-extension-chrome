(function () {
  'use strict';

  // Název souboru je v elementu `.l.title`, který je vždy uvnitř `.soubor`.
  // Vážeme se na `.soubor` kvůli odolnosti – nechytneme tak žádné nesouvisející `.title`.
  const TITLE_SELECTOR = '.soubor .title';

  // Odstraní koncovou příponu (.mp4, .jpg, …). Tečky uvnitř názvu
  // (např. v datu „18.6.2026“) zůstanou – řeže se jen poslední `.ext`.
  function stripExtension(name) {
    return name.replace(/\.[^./\\\s]+$/, '');
  }

  function getTitles() {
    const seen = new Set();
    const titles = [];

    document.querySelectorAll(TITLE_SELECTOR).forEach(function (el) {
      const text = stripExtension(el.textContent.trim());
      if (text && !seen.has(text)) {
        seen.add(text);
        titles.push(text);
      }
    });

    return titles;
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      // Fallback níže (např. když prohlížeč clipboard API v daném kontextu odmítne).
    }

    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  // Identifikátor zásilky – to, co je v „odkaz na zásilku:" za `/zasilka/`.
  // Bereme z odkazu v sekci (input/textarea/anchor), s fallbackem na URL stránky.
  function getZasilkaId() {
    const candidates = [];

    document.querySelectorAll('input, textarea').forEach(function (el) {
      if (el.value && el.value.indexOf('/zasilka/') !== -1) candidates.push(el.value);
    });
    document.querySelectorAll('a[href*="/zasilka/"]').forEach(function (a) {
      candidates.push(a.href);
    });
    candidates.push(location.href);

    for (let i = 0; i < candidates.length; i++) {
      const m = candidates[i].match(/\/zasilka\/([^/?#]+)/);
      if (m && m[1]) return m[1];
    }
    return null;
  }

  function downloadTxt(text) {
    const id = getZasilkaId();
    const fileName = 'uschovna-' + (id || 'nazvy-souboru') + '.txt';

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'uschovna-export-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Vynutíme reflow, aby naběhla CSS transition.
    void toast.offsetWidth;
    toast.classList.add('is-visible');

    setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 2200);
  }

  function openModal() {
    const titles = getTitles();
    const text = titles.join('\n');

    const overlay = document.createElement('div');
    overlay.className = 'uschovna-export-overlay';

    const modal = document.createElement('div');
    modal.className = 'uschovna-export-modal';

    const header = document.createElement('div');
    header.className = 'uschovna-export-header';
    header.textContent =
      'Nalezeno ' + titles.length + ' ' + pluralSoubor(titles.length);

    const closeX = document.createElement('button');
    closeX.className = 'uschovna-export-close';
    closeX.setAttribute('aria-label', 'Zavřít');
    closeX.textContent = '✖';
    header.appendChild(closeX);

    const textarea = document.createElement('textarea');
    textarea.className = 'uschovna-export-textarea';
    textarea.readOnly = true;
    textarea.value = text;

    const actions = document.createElement('div');
    actions.className = 'uschovna-export-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'uschovna-export-action primary';
    copyBtn.textContent = 'Kopírovat do schránky';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'uschovna-export-action';
    downloadBtn.textContent = 'Stáhnout jako .txt';

    actions.appendChild(copyBtn);
    actions.appendChild(downloadBtn);

    modal.appendChild(header);
    modal.appendChild(textarea);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function close() {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    // Zavřít jde křížkem nebo klávesou Esc – klik mimo okno okno nezavírá.
    closeX.addEventListener('click', close);
    document.addEventListener('keydown', onKey);

    copyBtn.addEventListener('click', async function () {
      const ok = await copyToClipboard(text);
      showToast(ok ? 'Zkopírováno do schránky' : 'Kopírování se nezdařilo – vyber text ručně');
    });

    downloadBtn.addEventListener('click', function () {
      downloadTxt(text);
    });
  }

  function pluralSoubor(n) {
    if (n === 1) return 'název';
    if (n >= 2 && n <= 4) return 'názvy';
    return 'názvů';
  }

  function createButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'uschovna-export-btn';
    btn.textContent = 'Exportovat názvy souborů';
    btn.addEventListener('click', openModal);
    return btn;
  }

  function injectButton() {
    if (document.querySelector('.uschovna-export-btn')) return; // už vloženo
    if (getTitles().length === 0) return; // na téhle stránce nejsou žádné soubory

    const btn = createButton();
    const anchor = document.querySelector('.package-buttons');

    if (anchor) {
      anchor.appendChild(btn); // vedle „stáhnout vše jako zip“

      // Sjednotíme šířku s tlačítkem „stáhnout vše jako zip“.
      const zipBtn = anchor.querySelector('a.button');
      if (zipBtn && zipBtn.offsetWidth) {
        btn.style.width = zipBtn.offsetWidth + 'px';
      }
    } else {
      // Fallback – plovoucí tlačítko, kdyby se layout změnil.
      btn.classList.add('uschovna-export-btn--floating');
      document.body.appendChild(btn);
    }
  }

  injectButton();

  // Obsah zásilky se může dorenderovat až po načtení – sledujeme DOM a doplníme tlačítko.
  const observer = new MutationObserver(function () {
    injectButton();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
