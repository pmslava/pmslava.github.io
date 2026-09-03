/*
  Click-to-enlarge lightbox for /work/ and /studio/ card images.
  Self-contained, no dependencies. Each `.project-card__media` is a <button>
  wrapping a <picture>; activating it grows the image (FLIP transform) from its
  card position to a centred, viewport-fitted enlargement over a dark backdrop.
  Close on backdrop/image click or Esc, with the reverse shrink. Focus moves to
  the dialog and returns to the trigger on close. prefers-reduced-motion gets a
  plain fade. Same picture sources are reused, so the largest variant is shown.
*/
(function () {
  'use strict';

  function init() {
    var triggers = document.querySelectorAll('.project-card__media');
    if (!triggers.length) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var EASE_MS = 320;
    var active = null;

    Array.prototype.forEach.call(triggers, function (btn) {
      btn.addEventListener('click', function () { open(btn); });
    });

    function scrollbarWidth() {
      return window.innerWidth - document.documentElement.clientWidth;
    }

    function fittedSize(natW, natH) {
      var maxW = window.innerWidth * 0.92;
      var maxH = window.innerHeight * 0.92;
      var scale = Math.min(maxW / natW, maxH / natH, 1);
      return { w: Math.round(natW * scale), h: Math.round(natH * scale) };
    }

    function open(btn) {
      if (active) return;
      var srcImg = btn.querySelector('img');
      var pic = btn.querySelector('picture');
      if (!srcImg || !pic) return;

      var natW = parseInt(btn.querySelector('img').getAttribute('width'), 10) ||
                 srcImg.naturalWidth || srcImg.clientWidth;
      var natH = parseInt(btn.querySelector('img').getAttribute('height'), 10) ||
                 srcImg.naturalHeight || srcImg.clientHeight;

      var overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', btn.getAttribute('aria-label') || 'Image');
      overlay.tabIndex = -1;

      var backdrop = document.createElement('div');
      backdrop.className = 'lightbox__backdrop';
      overlay.appendChild(backdrop);

      var picture = pic.cloneNode(true);
      picture.className = 'lightbox__picture';
      var img = picture.querySelector('img');
      if (img) {
        img.removeAttribute('loading');
        img.removeAttribute('fetchpriority');
        img.setAttribute('decoding', 'sync');
      }
      overlay.appendChild(picture);

      // Lock scroll without layout shift.
      var sw = scrollbarWidth();
      document.documentElement.classList.add('lightbox-open');
      if (sw > 0) document.body.style.paddingRight = sw + 'px';

      var size = fittedSize(natW, natH);
      picture.style.width = size.w + 'px';
      picture.style.height = size.h + 'px';

      document.body.appendChild(overlay);

      active = {
        overlay: overlay, picture: picture, trigger: btn,
        dispW: size.w, dispH: size.h, done: false
      };

      overlay.addEventListener('click', close);
      overlay.focus();

      if (reduce) {
        // Plain fade: no transform, CSS handles opacity via .is-open.
        requestAnimationFrame(function () { overlay.classList.add('is-open'); });
        return;
      }

      // FLIP: start at the trigger's rect, animate to centre.
      var tr = srcImg.getBoundingClientRect();
      picture.style.transform = flipTransform(tr, size.w);
      picture.style.transition = 'none';
      overlay.getBoundingClientRect(); // force reflow
      requestAnimationFrame(function () {
        picture.style.transition = '';
        picture.style.transform = 'translate(-50%, -50%)';
        overlay.classList.add('is-open');
      });
    }

    function flipTransform(rect, dispW) {
      var scale = rect.width / dispW;
      var dx = (rect.left + rect.width / 2) - window.innerWidth / 2;
      var dy = (rect.top + rect.height / 2) - window.innerHeight / 2;
      return 'translate(-50%, -50%) translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')';
    }

    function cleanup() {
      if (!active || active.done) return;
      active.done = true;
      var trigger = active.trigger;
      active.overlay.remove();
      document.documentElement.classList.remove('lightbox-open');
      document.body.style.removeProperty('padding-right');
      active = null;
      if (trigger) trigger.focus();
    }

    function close() {
      if (!active) return;
      var o = active;
      o.overlay.removeEventListener('click', close);

      if (reduce) {
        o.overlay.classList.remove('is-open');
        window.setTimeout(cleanup, 200);
        return;
      }

      var tr = o.trigger.querySelector('img').getBoundingClientRect();
      o.picture.style.transform = flipTransform(tr, o.dispW);
      o.overlay.classList.remove('is-open');
      o.picture.addEventListener('transitionend', cleanup, { once: true });
      window.setTimeout(cleanup, EASE_MS + 80); // fallback if transitionend misses
    }

    document.addEventListener('keydown', function (e) {
      if (!active) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { e.preventDefault(); active.overlay.focus(); }
    });

    window.addEventListener('resize', function () {
      if (!active) return;
      var img = active.trigger.querySelector('img');
      var natW = parseInt(img.getAttribute('width'), 10) || img.naturalWidth;
      var natH = parseInt(img.getAttribute('height'), 10) || img.naturalHeight;
      var size = fittedSize(natW, natH);
      active.dispW = size.w; active.dispH = size.h;
      active.picture.style.width = size.w + 'px';
      active.picture.style.height = size.h + 'px';
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
