/**
 * ============================================================================
 * PERFECT LIFESTYLE 24 — STANDALONE WEB-APP & ANDROID APK CONTROLLER (app.js)
 * Author: Md. Mostafa Kamal Raju (DOI: 10.5281/zenodo.23438665)
 * Package ID: com.mostafakamalraju.perfectlifestyle24
 * ============================================================================
 */
(function() {
  'use strict';

  var htmlEl = document.documentElement;
  var LANG_KEY = 'pl24_monograph_lang';
  var THEME_KEY = 'pl24_monograph_theme';

  // 0. Dynamic Inline Manifest Fallback (when opened without manifest.json server)
  try {
    var existingManifest = document.querySelector('link[rel="manifest"]');
    if (!existingManifest || window.location.protocol === 'file:') {
      var svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#0d2b20" stroke="#c59b27" stroke-width="20"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="250">🌿</text></svg>';
      var iconDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgIcon);
      var currentOrigin = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'https://perfectlifestyle24.blogspot.com';
      var pwaManifest = {
        "id": "/?app_id=perfect_lifestyle_24_monograph_v1",
        "name": "প্রতিরোধই সর্বোত্তম চিকিৎসা | Tibb-an-Nabawi Health App",
        "short_name": "Perfect Lifestyle 24",
        "description": "A 21-Page Bilingual Research Monograph & Interactive Health App by Md. Mostafa Kamal Raju.",
        "start_url": currentOrigin + "/?utm_source=pl24_pwa_app",
        "scope": currentOrigin + "/",
        "display": "standalone",
        "orientation": "portrait-primary",
        "background_color": "#0d2b20",
        "theme_color": "#0d2b20",
        "icons": [{
          "src": iconDataUrl,
          "sizes": "192x192 512x512",
          "type": "image/svg+xml",
          "purpose": "any maskable"
        }]
      };
      if (!existingManifest) {
        var manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pwaManifest));
        document.head.appendChild(manifestLink);
      }
    }
  } catch(e) {}

  // Detect if running inside compiled Android APK / Capacitor / Standalone Mode
  var isRunningInsideApkOrStandalone = (
    window.location.protocol === 'file:' ||
    window.Capacitor !== undefined ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );

  // Hide the "Install App" button automatically when the user is already inside the installed APK
  if (isRunningInsideApkOrStandalone) {
    var installBtnEl = document.getElementById('btn-install-app');
    if (installBtnEl) {
      installBtnEl.style.display = 'none';
    }
  }

  // ==================== 1. LANGUAGE & THEME CONTROLLER ====================
  function applyLanguage(lang) {
    htmlEl.setAttribute('data-lang', lang);
    htmlEl.setAttribute('lang', lang);
    var btnBn = document.getElementById('btn-lang-bn');
    var btnEn = document.getElementById('btn-lang-en');
    if (btnBn && btnEn) {
      if (lang === 'en') {
        btnEn.classList.add('active');
        btnBn.classList.remove('active');
      } else {
        btnBn.classList.add('active');
        btnEn.classList.remove('active');
      }
    }
    try { localStorage.setItem(LANG_KEY, lang); } catch(e) {}
  }

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    var iconEl = document.getElementById('theme-icon');
    var labelEl = document.getElementById('theme-label');
    var metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (iconEl && labelEl) {
      if (theme === 'night') {
        iconEl.textContent = '☀️';
        labelEl.textContent = 'Day';
      } else {
        iconEl.textContent = '🌙';
        labelEl.textContent = 'Night';
      }
    }
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'night' ? '#081a13' : '#0d2b20');
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch(e) {}
  }

  window.toggleJournalLanguage = function() {
    var currentLang = htmlEl.getAttribute('data-lang') || 'bn';
    var nextLang = (currentLang === 'bn') ? 'en' : 'bn';
    applyLanguage(nextLang);
  };

  window.toggleJournalTheme = function() {
    var currentTheme = htmlEl.getAttribute('data-theme') || 'day';
    var nextTheme = (currentTheme === 'day') ? 'night' : 'day';
    applyTheme(nextTheme);
  };

  // ==================== 2. OFFLINE SERVICE WORKER & APK INSTALLER ====================
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js').catch(function() {});
    });
  }

  try {
    if ('caches' in window) {
      caches.open('perfect-lifestyle-24-offline-v2').then(function(cache) {
        cache.add(window.location.href);
      });
    }
  } catch(err) {}

  var deferredPwaPrompt = null;

  // PASTE YOUR GITHUB RELEASE DIRECT .APK DOWNLOAD URL HERE ONCE PUBLISHED:
  var fallbackDirectApkUrl = 'https://github.com/MKRWeb/perfect-lifestyle-24-app/releases/download/v1.0.0/Perfect_Lifestyle_24.apk
    ';

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPwaPrompt = e;
    var installBtn = document.getElementById('btn-install-app');
    if (installBtn && !isRunningInsideApkOrStandalone) {
      installBtn.style.display = 'inline-flex';
    }
  });

  window.addEventListener('appinstalled', function() {
    deferredPwaPrompt = null;
    var installBtn = document.getElementById('btn-install-app');
    if (installBtn) {
      installBtn.innerHTML = '<span>✅</span><span class="lang-bn">ইনস্টল সম্পন্ন</span><span class="lang-en">Installed</span>';
      setTimeout(function() { installBtn.style.display = 'none'; }, 3000);
    }
  });

  window.triggerAppInstallation = function() {
    var currentLang = htmlEl.getAttribute('data-lang') || 'bn';

    // 1. Direct GitHub APK Download (if fallbackDirectApkUrl is set)
    if (fallbackDirectApkUrl && fallbackDirectApkUrl.indexOf('http') === 0) {
      window.location.href = fallbackDirectApkUrl;
      return;
    }

    // 2. Native Browser PWA Install Prompt
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      deferredPwaPrompt.userChoice.then(function() {
        deferredPwaPrompt = null;
      });
      return;
    }

    // 3. Fallback Manual Instructions
    if (currentLang === 'bn') {
      alert('📲 অফলাইন অ্যাপ হিসেবে ইনস্টল করতে:\n\n১. আপনার ব্রাউজারের উপরের ডান কোণায় (⋮) থ্রি-ডট মেনুতে ট্যাপ করুন।\n২. "Install App" অথবা "Add to Home Screen" অপশনটিতে ক্লিক করুন।\n\nএটি আপনার ফোনে স্বতন্ত্র অফলাইন অ্যাপ হিসেবে সেভ হয়ে যাবে!');
    } else {
      alert('📲 To Install as an Offline App:\n\n1. Tap the browser menu (⋮ or Share icon).\n2. Select "Install App" or "Add to Home Screen".\n\nThe full 21-page monograph will be saved as a standalone offline app on your device!');
    }
  };

  // ==================== 3. SMOOTH SCROLL & BACK-TO-TOC NAVIGATION ====================
  function scrollToTargetElement(el, highlight) {
    if (!el) return;
    var topbar = document.querySelector('.sticky-journal-topbar');
    var offset = (topbar ? topbar.offsetHeight : 56) + 16;
    var elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
      top: elementPosition - offset,
      behavior: 'smooth'
    });
    if (highlight) {
      el.classList.remove('topic-highlight-pulse');
      void el.offsetWidth;
      el.classList.add('topic-highlight-pulse');
    }
  }

  function scrollToMonographTOC() {
    var tocEl = document.getElementById('monograph-toc') || document.querySelector('.toc-box') || document.getElementById('page-2');
    scrollToTargetElement(tocEl, true);
  }

  if (window.history && window.history.pushState) {
    try {
      if (!window.history.state || !window.history.state.monographView) {
        window.history.replaceState({ monographView: 'toc' }, '', window.location.pathname + window.location.search);
        window.history.pushState({ monographView: 'reading' }, '', window.location.href);
      }
    } catch(err) {}

    window.addEventListener('popstate', function() {
      scrollToMonographTOC();
      try {
        window.history.pushState({ monographView: 'reading' }, '', window.location.pathname + window.location.search + '#monograph-toc');
      } catch(err) {}
    });
  }

  document.addEventListener('click', function(e) {
    var link = e.target.closest('.toc-link');
    if (!link) return;
    var targetId = link.getAttribute('href');
    if (targetId && targetId.charAt(0) === '#') {
      var targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        if (window.history && window.history.pushState) {
          try {
            window.history.pushState({ monographView: 'topic', target: targetId }, '', targetId);
          } catch(err) {}
        }
        scrollToTargetElement(targetEl, true);
      }
    }
  });

  // ==================== 4. INTERACTIVE BIO-CLOCK & HEALTH SCORE DASHBOARD ====================
  window.switchBioClock = function(phaseIndex) {
    var tabs = document.querySelectorAll('.bio-tab-btn');
    var panels = document.querySelectorAll('.bio-clock-panel');
    for (var i = 0; i < tabs.length; i++) {
      if (i === (phaseIndex - 1)) {
        tabs[i].classList.add('active');
        panels[i].classList.add('active');
      } else {
        tabs[i].classList.remove('active');
        panels[i].classList.remove('active');
      }
    }
  };

  window.calculateSunnahScore = function() {
    var checkboxes = document.querySelectorAll('#sunnah-habit-checklist input[type="checkbox"]');
    var checkedCount = 0;
    for (var i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) checkedCount++;
    }
    var score = Math.round((checkedCount / checkboxes.length) * 100);
    var valEl = document.getElementById('health-score-val');
    var barEl = document.getElementById('health-score-bar');
    var statusEl = document.getElementById('health-score-status');

    if (valEl) valEl.textContent = score + '%';
    if (barEl) barEl.style.width = score + '%';

    if (statusEl) {
      if (score >= 85) {
        statusEl.innerHTML = '<span class="lang-bn" style="color:#1e6b4e;">স্ট্যাটাস: আলহামদুলিল্লাহ! সর্বোচ্চ স্তরের মেটাবলিক ও প্রিভেন্টিভ সুরক্ষা (Optimal Prophetic Shield)।</span><span class="lang-en" style="color:#1e6b4e;">Status: Alhamdulillah! Optimal Metabolic &amp; Preventive Shield Achieved.</span>';
      } else if (score >= 50) {
        statusEl.innerHTML = '<span class="lang-bn">স্ট্যাটাস: মধ্যম প্রতিরোধ ক্ষমতা — পূর্ণাঙ্গ সুস্থতার জন্য বাকি সুন্নাহ অভ্যাসগুলো যুক্ত করুন।</span><span class="lang-en">Status: Moderate Preventive Resilience — Incorporate the remaining Sunnah habits for optimal longevity.</span>';
      } else {
        statusEl.innerHTML = '<span class="lang-bn" style="color:var(--danger-red);">স্ট্যাটাস: মেটাবলিক ঝুঁকিপূর্ণ — আজ থেকেই সুন্নাহ ডায়েট ও ঘুমের রুটিন শুরু করুন।</span><span class="lang-en" style="color:var(--danger-red);">Status: Elevated Metabolic Risk — Begin implementing the Prophetic diet and circadian sleep protocol today.</span>';
      }
    }
  };

  // Sync UI buttons with saved state on load
  try {
    var savedLang = localStorage.getItem(LANG_KEY) || 'bn';
    var savedTheme = localStorage.getItem(THEME_KEY) || 'day';
    applyLanguage(savedLang);
    applyTheme(savedTheme);
  } catch(e) {}
})();
