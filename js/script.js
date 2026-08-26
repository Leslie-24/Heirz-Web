/* Heirz Holding — site interactions */
(function(){
  "use strict";

  var header = document.querySelector('.site-header');
  var body = document.body;
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelectorAll('.main-nav a');

  /* ---------- header scroll state + mobile nav ---------- */
  function onScroll(){
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');

    var topBtn = document.querySelector('.fab-top');
    if (topBtn){
      if (window.scrollY > 700) topBtn.classList.add('show');
      else topBtn.classList.remove('show');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (navToggle){
    navToggle.addEventListener('click', function(){
      body.classList.toggle('menu-open');
    });
  }
  navLinks.forEach(function(a){
    a.addEventListener('click', function(){ body.classList.remove('menu-open'); });
  });

  /* ---------- active nav link on scroll ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var navMap = {};
  navLinks.forEach(function(a){
    var href = a.getAttribute('href');
    if (href && href.charAt(0) === '#') navMap[href.slice(1)] = a;
  });
  var navObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var link = navMap[entry.target.id];
      if (!link) return;
      if (entry.isIntersecting){
        navLinks.forEach(function(l){ l.classList.remove('active'); });
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(function(s){ navObserver.observe(s); });

  /* ---------- scroll reveal (with fallbacks so content is never stuck invisible) ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window){
    var revealObserver = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function(el){ revealObserver.observe(el); });

    /* Safety net: if an element is already in view at load (or the observer
       misses it for any reason - slow layout, print/screenshot tools, etc.)
       make sure it still becomes visible within a couple of seconds. */
    setTimeout(function(){
      revealEls.forEach(function(el){ el.classList.add('in'); });
    }, 2500);
  } else {
    /* No IntersectionObserver support: show everything immediately. */
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- animated counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  var countObserver = new IntersectionObserver(function(entries, obs){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var start = 0;
      var duration = 1100;
      var startTime = null;
      function step(ts){
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(function(el){ countObserver.observe(el); });

  /* ---------- services: data ---------- */
  var services = window.HEIRZ_SERVICES || [];
  var grid = document.getElementById('servicesGrid');
  var resultsCount = document.getElementById('resultsCount');
  var noResults = document.getElementById('noResults');
  var searchInput = document.getElementById('serviceSearch');
  var pills = document.querySelectorAll('.pill');
  var activeCategory = 'all';
  var activeQuery = '';

  function iconSvg(){
    return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>';
  }

  function renderGrid(){
    if (!grid) return;
    grid.innerHTML = '';
    var visible = services.filter(function(s){
      var matchesCat = activeCategory === 'all' || s.cat === activeCategory;
      var matchesQuery = !activeQuery || (s.title + ' ' + s.blurb).toLowerCase().indexOf(activeQuery) !== -1;
      return matchesCat && matchesQuery;
    });

    visible.forEach(function(s){
      var card = document.createElement('article');
      card.className = 'service-card reveal';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'View details: ' + s.title);

      var mediaHtml = s.img
        ? '<div class="service-media"><span class="service-cat-tag">' + s.catLabel + '</span><img src="' + s.img + '" alt="' + s.title + '" loading="lazy"></div>'
        : '<div class="service-media icon-only"><span class="service-cat-tag">' + s.catLabel + '</span>' + iconSvg() + '</div>';

      card.innerHTML = mediaHtml +
        '<div class="service-body">' +
          '<h3>' + s.title + '</h3>' +
          '<p>' + s.teaser + '</p>' +
          '<span class="service-more">View details <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
        '</div>';

      card.addEventListener('click', function(){ openModal(s); });
      card.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(s); }
      });
      grid.appendChild(card);
      revealObserver.observe(card);
      requestAnimationFrame(function(){ card.classList.add('in'); });
    });

    resultsCount.textContent = visible.length + (visible.length === 1 ? ' service' : ' services') + ' shown of ' + services.length;
    noResults.classList.toggle('show', visible.length === 0);
  }

  pills.forEach(function(p){
    p.addEventListener('click', function(){
      pills.forEach(function(x){ x.classList.remove('active'); });
      p.classList.add('active');
      activeCategory = p.getAttribute('data-cat');
      renderGrid();
    });
  });

  if (searchInput){
    searchInput.addEventListener('input', function(){
      activeQuery = searchInput.value.trim().toLowerCase();
      renderGrid();
    });
  }

  renderGrid();

  /* ---------- modal ---------- */
  var overlay = document.getElementById('serviceModal');
  var modalCard = overlay ? overlay.querySelector('.modal-card') : null;
  var lastFocused = null;

  function openModal(s){
    if (!overlay) return;
    var mediaHtml = s.img
      ? '<div class="modal-media"><img src="' + s.img + '" alt="' + s.title + '"></div>'
      : '<div class="modal-media icon-only">' + iconSvg() + '</div>';

    var highlightsHtml = (s.highlights && s.highlights.length)
      ? '<div class="highlights">' + s.highlights.map(function(h){ return '<span>' + h + '</span>'; }).join('') + '</div>'
      : '';

    var rwHtml = s.rw ? '<p class="rw">' + s.rw + '</p>' : '';

    modalCard.innerHTML =
      '<button class="modal-close" aria-label="Close">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>' +
      mediaHtml +
      '<div class="modal-body">' +
        '<span class="eyebrow">' + s.catLabel + '</span>' +
        '<h3>' + s.title + '</h3>' +
        '<p>' + s.full + '</p>' +
        rwHtml +
        highlightsHtml +
        '<div class="modal-cta">' +
          '<a class="btn btn-primary btn-sm" href="tel:+250727944818">Call to enquire</a>' +
          '<a class="btn btn-outline btn-sm" href="#contact" data-close>Request a quote</a>' +
        '</div>' +
      '</div>';

    lastFocused = document.activeElement;
    overlay.classList.add('open');
    body.style.overflow = 'hidden';
    modalCard.querySelector('.modal-close').addEventListener('click', closeModal);
    modalCard.querySelectorAll('[data-close]').forEach(function(el){
      el.addEventListener('click', function(){ closeModal(); });
    });
    modalCard.querySelector('.modal-close').focus();
  }

  function closeModal(){
    overlay.classList.remove('open');
    body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  if (overlay){
    overlay.addEventListener('click', function(e){
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
  }

  /* ---------- contact form -> mailto ---------- */
  var form = document.getElementById('contactForm');
  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = form.querySelector('#cf-name').value.trim();
      var email = form.querySelector('#cf-email').value.trim();
      var subjectSel = form.querySelector('#cf-subject').value;
      var message = form.querySelector('#cf-message').value.trim();

      var subject = encodeURIComponent('Website enquiry — ' + subjectSel);
      var bodyLines = [
        'Name: ' + name,
        'Email: ' + email,
        'Interested in: ' + subjectSel,
        '',
        message
      ];
      var mailBody = encodeURIComponent(bodyLines.join('\n'));
      window.location.href = 'mailto:heirzholding@gmail.com?subject=' + subject + '&body=' + mailBody;
    });
  }

  /* ---------- back to top ---------- */
  var topBtn = document.querySelector('.fab-top');
  if (topBtn){
    topBtn.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
