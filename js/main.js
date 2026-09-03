(function () {
  'use strict';

  function init() {
    var headings = document.querySelectorAll('.post-content h2[id], .post-content h3[id]');
    if (!headings.length) return;

    var tocAnchors = document.querySelectorAll('.toc a[href^="#"]');
    if (!tocAnchors.length) return;

    var anchorsById = {};
    Array.prototype.forEach.call(tocAnchors, function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      if (!anchorsById[id]) anchorsById[id] = [];
      anchorsById[id].push(a);
    });

    var headingsArr = Array.prototype.slice.call(headings);

    function findActiveId() {
      var threshold = 100;
      var docHeight = document.documentElement.scrollHeight;
      var canScroll = docHeight > window.innerHeight + 10;
      var atBottom = canScroll && (window.innerHeight + window.scrollY) >= (docHeight - 80);
      if (atBottom) return headingsArr[headingsArr.length - 1].id;

      var activeId = null;
      for (var i = 0; i < headingsArr.length; i++) {
        var top = headingsArr[i].getBoundingClientRect().top;
        if (top <= threshold) activeId = headingsArr[i].id;
        else break;
      }
      return activeId;
    }

    var currentId = null;
    function refreshActive() {
      var newId = findActiveId();
      if (newId === currentId) return;
      currentId = newId;
      Object.keys(anchorsById).forEach(function (id) {
        anchorsById[id].forEach(function (a) {
          if (id === currentId) a.setAttribute('data-active', 'true');
          else a.removeAttribute('data-active');
        });
      });
    }

    refreshActive();

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        refreshActive();
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fab = document.querySelector('.toc-fab');

    function handleTocClick(e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
      if (fab && fab.open && fab.contains(a)) fab.open = false;
    }

    Array.prototype.forEach.call(document.querySelectorAll('.toc'), function (toc) {
      toc.addEventListener('click', handleTocClick);
    });

    if (fab) {
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && fab.open) {
          fab.open = false;
          var summary = fab.querySelector('summary');
          if (summary) summary.focus();
        }
      });
      document.addEventListener('pointerdown', function (e) {
        if (fab.open && !fab.contains(e.target)) fab.open = false;
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
