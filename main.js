
(function () {
  'use strict';

  /* ============================================================
     YEAR
     ============================================================ */
  document.getElementById('yr').textContent = new Date().getFullYear();

  /* ============================================================
     TOPBAR scroll class
     ============================================================ */
  const topbar = document.getElementById('topbar');
  window.addEventListener('scroll', function () {
    topbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ============================================================
     CUSTOM CURSOR (fine-pointer devices only)
     ============================================================ */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (finePointer && !reduceMotion) {
    const dot = document.getElementById('cursor-dot');
    const ret = document.getElementById('reticle');
    const lerp = (a, b, t) => a + (b - a) * t;

    let mx = 0, my = 0;
    let rx = 0, ry = 0, rw = 30, rh = 30;
    let tx = 0, ty = 0, tw = 30, th = 30;
    let locked = null;

    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      document.body.classList.add('cursor-ready');
      if (!locked) { tx = mx; ty = my; tw = 30; th = 30; }
    }, { passive: true });

    document.addEventListener('pointerover', function (e) {
      const hit = e.target.closest('a, button');
      if (!hit) return;
      locked = hit;
      ret.classList.add('locked');
    });
    document.addEventListener('pointerout', function (e) {
      if (locked && !e.relatedTarget?.closest?.('a, button')) {
        locked = null;
        ret.classList.remove('locked');
      }
    });
    document.addEventListener('pointerleave', function () {
      document.body.classList.remove('cursor-ready');
    });
    window.addEventListener('pointerdown', function (e) {
      const hit = e.target.closest('a, button');
      if (hit) {
        hit.classList.add('btn-active-glow');
        setTimeout(() => hit.classList.remove('btn-active-glow'), 350);
      }
      if (ret) {
        ret.classList.add('clicking');
        setTimeout(() => ret.classList.remove('clicking'), 250);
      }
    });

    (function retTick() {
      if (locked) {
        const b = locked.getBoundingClientRect();
        tx = b.left + b.width / 2;
        ty = b.top + b.height / 2;
        tw = b.width + 14;
        th = b.height + 14;
      }
      rx = lerp(rx, tx, 0.28);
      ry = lerp(ry, ty, 0.28);
      rw = lerp(rw, tw, 0.22);
      rh = lerp(rh, th, 0.22);
      ret.style.width = rw + 'px';
      ret.style.height = rh + 'px';
      ret.style.transform = 'translate(' + (rx - rw / 2) + 'px,' + (ry - rh / 2) + 'px)';
      requestAnimationFrame(retTick);
    })();
  }

  /* ============================================================
     REVEAL ON SCROLL (IntersectionObserver)
     ============================================================ */
  if (!reduceMotion) {
    const revels = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    revels.forEach(function (el) { obs.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ============================================================
     SIGNATURE INTERACTION: DataEngine Terminal
     Three branches: [y] proceed, [n] abort, [c] customize
     Keyboard accessible: y / n / c keys when terminal in view
     ============================================================ */
  const termBody = document.getElementById('term-body');
  const termReset = document.getElementById('term-reset');

  /* Simulated dataset facts (consistent across all branches) */
  const DS = {
    file: 'customer_churn_raw.csv',
    rows: 10480,
    dupes: 42,
    missing: [
      { col: 'tenure_months',   n: 312, fix: 'impute → train median (18.0)' },
      { col: 'monthly_charges', n: 88,  fix: 'impute → train median ($64.80)' },
      { col: 'contract_type',   n: 45,  fix: 'impute → train mode ("Month-to-month")' }
    ],
    types: [
      { col: 'total_charges', issue: 'object with blank strings → coerce float64' }
    ],
    outliers: [
      { col: 'monthly_charges', issue: '3 values ≥ $9,990 → clip at 99.5th pct' }
    ]
  };

  /* State */
  let step = 'diagnosed';
  let customOpts = { dups: true, types: true, tenure: true, charges: true, outliers: true };

  function line(cls, text) {
    return '<div class="t-line' + (cls ? ' ' + cls : '') + '">' + text + '</div>';
  }

  function diagnosisLines() {
    return [
      line('t-dim', '$ dataengine profile --file ' + DS.file + ' --interactive'),
      line('t-dim', '─'.repeat(62)),
      line('t-acc', 'DATAENGINE  PRE-CLEANING DIAGNOSIS REPORT  ·  zero-mutation mode'),
      line('t-dim', 'Source: ' + DS.file + '  |  Rows: ' + DS.rows.toLocaleString() + '  |  Cols: 14  |  Memory: 1.12 MB'),
      line('t-dim', '─'.repeat(62)),
      line('',      '<span class="t-cyn">[!] Duplicates</span>   ' + DS.dupes + ' exact duplicate rows detected (0.40%)'),
      line('',      '<span class="t-cyn">[!] Missing values</span>'),
      line('',      '    • tenure_months   312 nulls (2.98%)  →  ' + DS.missing[0].fix),
      line('',      '    • monthly_charges  88 nulls (0.84%)  →  ' + DS.missing[1].fix),
      line('',      '    • contract_type    45 nulls (0.43%)  →  ' + DS.missing[2].fix),
      line('',      '<span class="t-cyn">[!] Type issues</span>'),
      line('',      '    • total_charges: stored as object (blank whitespace) → cast float64'),
      line('',      '<span class="t-cyn">[!] Outliers</span>'),
      line('',      '    • monthly_charges: 3 records ≥ $9,990  →  clip at 99.5th percentile'),
      line('t-dim', '─'.repeat(62)),
      line('t-wht', '5 operations planned.  No data has been modified.')
    ].join('');
  }

  function renderDiagnosed() {
    step = 'diagnosed';
    termBody.innerHTML = diagnosisLines() + '\n' +
      '<div class="t-prompt-box">' +
        '<span class="t-prompt-label">Proceed with transformations? [y / n / c]</span>' +
        '<div class="t-btn-row">' +
          '<button class="t-btn" id="btn-y" type="button"><kbd>y</kbd> Proceed (apply all)</button>' +
          '<button class="t-btn" id="btn-n" type="button"><kbd>n</kbd> Abort (return original)</button>' +
          '<button class="t-btn" id="btn-c" type="button"><kbd>c</kbd> Customize steps</button>' +
        '</div>' +
      '</div>';

    document.getElementById('btn-y').onclick = doY;
    document.getElementById('btn-n').onclick = doN;
    document.getElementById('btn-c').onclick = doC;
  }

  function doY() {
    step = 'proceeded';
    termBody.innerHTML = diagnosisLines() +
      line('t-dim', '─'.repeat(62)) +
      line('',      '$ <span class="t-wht">y</span>  ·  applying 5 operations…') +
      line('t-grn', '[✓] 1/5  Dropped 42 duplicate rows') +
      line('t-grn', '[✓] 2/5  Coerced total_charges → float64') +
      line('t-grn', '[✓] 3/5  Imputed tenure_months with frozen median 18.0') +
      line('t-grn', '[✓] 4/5  Imputed monthly_charges with frozen median $64.80') +
      line('t-grn', '[✓] 5/5  Clipped monthly_charges outliers at 99.5th pct ($118.75)') +
      line('t-dim', '─'.repeat(62)) +
      line('t-acc', 'SUMMARY') +
      line('',      '  Rows          10,480  →  10,438   (−42,  −0.40%)') +
      line('',      '  Missing cells    445  →       0   (−445, −100%)') +
      line('',      '  Outliers           3  →       0   (clipped)') +
      line('',      '  Leakage risk    0.00%              verified') +
      line('t-grn', '→ Pipeline saved: dataengine_pipeline.joblib') +
      line('t-dim', '  Call engine.transform(X_test) to apply frozen params.') +
      '<div class="t-btn-row" style="margin-top:.85rem"><button class="t-btn" id="btn-again" type="button"><kbd>r</kbd> Test other options</button></div>';

    document.getElementById('btn-again').onclick = renderDiagnosed;
  }

  function doN() {
    step = 'aborted';
    termBody.innerHTML = diagnosisLines() +
      line('t-dim', '─'.repeat(62)) +
      line('',      '$ <span class="t-wht">n</span>  ·  ABORT requested') +
      line('t-red', '✗  All operations cancelled.  Zero cells were modified.') +
      line('t-dim', '─'.repeat(62)) +
      line('',      'DataFrame integrity check:') +
      line('',      '  Input  MD5: a8f9c1e04b92d773e218c504e9a3b610') +
      line('',      '  Output MD5: a8f9c1e04b92d773e218c504e9a3b610') +
      line('t-grn', '  MATCH  ·  100% identical  ·  0 rows touched') +
      '<div class="t-btn-row" style="margin-top:.85rem"><button class="t-btn" id="btn-again" type="button"><kbd>r</kbd> Reset terminal</button></div>';

    document.getElementById('btn-again').onclick = renderDiagnosed;
  }

  function doC() {
    step = 'customizing';
    termBody.innerHTML = diagnosisLines() +
      line('t-dim', '─'.repeat(62)) +
      line('',      '$ <span class="t-wht">c</span>  ·  customize — select which steps to authorise:') +
      '<div class="t-custom-panel">' +
        '<label><input type="checkbox" id="ck-dups"     ' + (customOpts.dups ? 'checked' : '') + '> Step 1 · Drop 42 duplicate rows</label>' +
        '<label><input type="checkbox" id="ck-types"    ' + (customOpts.types ? 'checked' : '') + '> Step 2 · Coerce total_charges → float64</label>' +
        '<label><input type="checkbox" id="ck-tenure"   ' + (customOpts.tenure ? 'checked' : '') + '> Step 3 · Impute tenure_months (median 18.0)</label>' +
        '<label><input type="checkbox" id="ck-charges"  ' + (customOpts.charges ? 'checked' : '') + '> Step 4 · Impute monthly_charges (median $64.80)</label>' +
        '<label><input type="checkbox" id="ck-outliers" ' + (customOpts.outliers ? 'checked' : '') + '> Step 5 · Clip monthly_charges outliers</label>' +
        '<div class="t-custom-apply">' +
          '<button class="t-btn" id="btn-apply" type="button"><kbd>↵</kbd> Apply selected</button>' +
          '<button class="t-btn" id="btn-cancel" type="button"><kbd>Esc</kbd> Cancel</button>' +
        '</div>' +
      '</div>';

    document.getElementById('btn-apply').onclick = function () {
      customOpts.dups     = document.getElementById('ck-dups').checked;
      customOpts.types    = document.getElementById('ck-types').checked;
      customOpts.tenure   = document.getElementById('ck-tenure').checked;
      customOpts.charges  = document.getElementById('ck-charges').checked;
      customOpts.outliers = document.getElementById('ck-outliers').checked;

      const selected = Object.values(customOpts).filter(Boolean).length;
      termBody.innerHTML += line('t-dim', '─'.repeat(62)) +
        line('',      'Applying ' + selected + ' of 5 selected operations…');

      /* echo results for each selected step */
      const steps = [
        { key: 'dups',     label: 'Dropped 42 duplicate rows' },
        { key: 'types',    label: 'Coerced total_charges → float64' },
        { key: 'tenure',   label: 'Imputed tenure_months with frozen median 18.0' },
        { key: 'charges',  label: 'Imputed monthly_charges with frozen median $64.80' },
        { key: 'outliers', label: 'Clipped monthly_charges at 99.5th pct' }
      ];
      let applied = steps.filter(s => customOpts[s.key]);
      let skipped = steps.filter(s => !customOpts[s.key]);

      applied.forEach(function (s, i) {
        termBody.innerHTML += line('t-grn', '[✓] ' + s.label);
      });
      skipped.forEach(function (s) {
        termBody.innerHTML += line('t-dim', '[—] Skipped: ' + s.label);
      });

      termBody.innerHTML += line('t-grn', '→ Partial pipeline applied.  ' + skipped.length + ' operations were not run.') +
        '<div class="t-btn-row" style="margin-top:.85rem"><button class="t-btn" id="btn-again" type="button"><kbd>r</kbd> Reset terminal</button></div>';
      document.getElementById('btn-again').onclick = renderDiagnosed;
    };

    document.getElementById('btn-cancel').onclick = doN;
  }

  /* Keyboard shortcuts — only when terminal is roughly in viewport */
  window.addEventListener('keydown', function (e) {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    const k = e.key.toLowerCase();
    if (step === 'diagnosed') {
      if (k === 'y') { e.preventDefault(); doY(); }
      if (k === 'n') { e.preventDefault(); doN(); }
      if (k === 'c') { e.preventDefault(); doC(); }
    }
    if (k === 'r') { renderDiagnosed(); }
  });

  termReset.addEventListener('click', renderDiagnosed);

  /* Initial render */
  renderDiagnosed();

})();


/* ============================================================
   MOBILE NAV — hamburger toggle
   ============================================================ */
(function () {
  var toggle = document.getElementById('nav-toggle');
  var nav = document.querySelector('.topbar-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('open', !expanded);
    document.body.style.overflow = expanded ? '' : 'hidden';
  });

  // Close on nav link click
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on resize back to desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();
