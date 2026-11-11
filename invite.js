// 150 Abs invite pages (friend / duel / crew).
// Reads a 6-character code from the path (/friend/ABC234) or from ?code=ABC234.
// No tracking, no external requests.
(function () {
  var kind = document.body.getAttribute('data-kind'); // "friend" | "duel" | "crew"
  var VALID = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

  function clean(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

  function readCode() {
    var q = new URLSearchParams(window.location.search).get('code');
    if (q) return clean(q);
    var parts = window.location.pathname.split('/').filter(Boolean);
    var i = parts.lastIndexOf(kind);
    if (i >= 0 && parts[i + 1] && !/\.html?$/i.test(parts[i + 1])) {
      try { return clean(decodeURIComponent(parts[i + 1])); } catch (e) { return clean(parts[i + 1]); }
    }
    return '';
  }

  var code = readCode();
  var valid = VALID.test(code);

  var codeEl = document.getElementById('code');
  var copyBtn = document.getElementById('copy');
  var status = document.getElementById('copy-status');
  var openBtn = document.getElementById('open');
  var warn = document.getElementById('warn');

  if (valid) {
    codeEl.textContent = code;
    codeEl.classList.remove('missing');
    codeEl.setAttribute('aria-label', 'Code: ' + code.split('').join(' '));
    openBtn.href = 'abs150://' + kind + '/' + code;
    document.querySelectorAll('[data-code]').forEach(function (el) { el.textContent = code; });
    document.title = code + ' · ' + document.title;
    var meta = document.querySelector('meta[name="apple-itunes-app"]');
    if (meta) meta.setAttribute('content', 'app-id=6832132004, app-argument=abs150://' + kind + '/' + code);
  } else {
    warn.hidden = false;
    openBtn.hidden = true;
    copyBtn.hidden = true;
  }

  function copied() {
    copyBtn.classList.add('done');
    copyBtn.setAttribute('aria-label', 'Copied');
    status.textContent = 'Copied ' + code;
    setTimeout(function () {
      copyBtn.classList.remove('done');
      copyBtn.setAttribute('aria-label', 'Copy code');
      status.textContent = '';
    }, 2200);
  }

  function fallbackCopy() {
    var t = document.createElement('textarea');
    t.value = code;
    t.setAttribute('readonly', '');
    t.style.position = 'fixed';
    t.style.opacity = '0';
    document.body.appendChild(t);
    t.select();
    try { if (document.execCommand('copy')) copied(); } catch (e) { /* ignore */ }
    document.body.removeChild(t);
  }

  copyBtn.addEventListener('click', function () {
    if (!valid) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code).then(copied, fallbackCopy);
    } else {
      fallbackCopy();
    }
  });
})();
