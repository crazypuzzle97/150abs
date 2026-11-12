// 150 Abs: small progressive enhancements. No tracking, no external requests.
(function () {
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Phone menu: close after picking a section.
  var menu = document.querySelector('.menu');
  if (menu) {
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) menu.removeAttribute('open'); });
    document.addEventListener('click', function (e) { if (!menu.contains(e.target)) menu.removeAttribute('open'); });
  }

  // Screens carousel: drifts slowly in a loop, pauses while someone looks or touches,
  // and can be swiped, dragged or stepped with the arrows.
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var rail = root.querySelector('.gallery');
    if (!rail) return;
    var originals = Array.prototype.slice.call(rail.children);
    originals.forEach(function (fig) {
      var copy = fig.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.classList.add('clone');
      rail.appendChild(copy);
    });
    var loopWidth = function () { return rail.children[originals.length].offsetLeft - rail.children[0].offsetLeft; };
    var step = function () { var f = rail.children[0]; return f.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 26); };
    var wrap = function () {
      var w = loopWidth();
      if (rail.scrollLeft >= w) rail.scrollLeft -= w;
      else if (rail.scrollLeft <= 0) rail.scrollLeft += w;
    };

    var paused = reduce, resumeTimer = null, pos = 0, visible = true;
    var pause = function () { paused = true; rail.classList.remove('auto'); clearTimeout(resumeTimer); };
    var resumeSoon = function (ms) {
      if (reduce) return;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () { pos = rail.scrollLeft; paused = false; rail.classList.add('auto'); }, ms || 2500);
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(rail);
    }
    var speed = 0.35; // px per frame, about 21 px a second
    var tick = function () {
      if (!paused && visible && !document.hidden) {
        pos += speed;
        var w = loopWidth();
        if (pos >= w) pos -= w;
        rail.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    };
    if (!reduce) { rail.classList.add('auto'); requestAnimationFrame(tick); }

    rail.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') pause(); });
    rail.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !dragging) resumeSoon(1200); });
    rail.addEventListener('touchstart', pause, { passive: true });
    rail.addEventListener('touchend', function () { resumeSoon(3500); }, { passive: true });
    rail.addEventListener('wheel', function () { pause(); resumeSoon(3000); }, { passive: true });
    rail.addEventListener('focusin', pause);
    rail.addEventListener('focusout', function () { resumeSoon(); });
    rail.addEventListener('scroll', function () { if (paused) wrap(); }, { passive: true });

    // Drag with a mouse on desktop.
    var dragging = false, startX = 0, startLeft = 0, moved = 0;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true; moved = 0; startX = e.clientX; startLeft = rail.scrollLeft;
      pause(); rail.classList.add('dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      moved = Math.max(moved, Math.abs(e.clientX - startX));
      rail.scrollLeft = startLeft - (e.clientX - startX);
    });
    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false; rail.classList.remove('dragging');
      if (!rail.matches(':hover')) resumeSoon(1500);
    });
    rail.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);

    root.querySelectorAll('.car-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        pause();
        wrap();
        rail.scrollBy({ left: Number(btn.dataset.dir) * step(), behavior: reduce ? 'auto' : 'smooth' });
        resumeSoon(4000);
      });
    });
    rail.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault(); pause(); wrap();
      rail.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * step(), behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(function (el) { io.observe(el); });
})();
