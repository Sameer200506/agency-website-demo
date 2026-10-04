(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var num = function (v, d) {
    return v.toLocaleString('en-GB', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  };

  function toast(message) {
    var host = $('#toasts');
    if (!host) return;
    var el = doc.createElement('div');
    el.className = 'toast glass';
    el.innerHTML = '<i></i><span></span>';
    el.lastChild.textContent = message;
    host.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); }, 420);
    }, 3600);
  }

  /* ---------------------------------- theme --------------------------------- */
  var Theme = (function () {
    var key = 'prisma-theme';
    var btn = $('#themeBtn');
    var stored = null;
    try { stored = localStorage.getItem(key); } catch (e) { stored = null; }
    root.setAttribute('data-theme', stored || 'dark');

    function toggle() {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(key, next); } catch (e) {}
      toast(next === 'light' ? 'Light theme on — full contrast' : 'Dark theme on — deep focus');
    }
    if (btn) btn.addEventListener('click', toggle);
    return { toggle: toggle, get: function () { return root.getAttribute('data-theme'); } };
  })();

  /* --------------------------------- cursor --------------------------------- */
  var Cursor = (function () {
    if (!finePointer) return {};
    var host = $('#cursor');
    var lens = $('.cursor__lens', host);
    var ring = $('.cursor__ring', host);
    var dot = $('.cursor__dot', host);
    var label = $('.cursor__label', host);
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    var rx = tx, ry = ty, dx = tx, dy = ty;

    doc.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      body.classList.add('has-pointer');
    }, { passive: true });

    doc.addEventListener('pointerdown', function () { host.classList.add('is-down'); }, { passive: true });
    doc.addEventListener('pointerup', function () { host.classList.remove('is-down'); }, { passive: true });
    doc.addEventListener('mouseleave', function () { host.style.opacity = '0'; });
    doc.addEventListener('mouseenter', function () { host.style.opacity = '1'; });

    var MODE_TEXT = { link: 'view', action: 'click', cta: 'talk', view: 'open' };
    var last = null;
    doc.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cursor]') : null;
      var mode = t ? t.getAttribute('data-cursor') : '';
      if (mode === last) return;
      last = mode;
      host.classList.remove('is-link', 'is-action', 'is-cta', 'is-view');
      if (mode && MODE_TEXT[mode]) {
        host.classList.add('is-' + mode);
        label.textContent = MODE_TEXT[mode];
      } else {
        label.textContent = '';
      }
    });

    function cycle() {
      var order = ['lens', 'off'];
      var i = order.indexOf(body.getAttribute('data-cursor'));
      body.setAttribute('data-cursor', order[(i + 1) % order.length]);
      toast(body.getAttribute('data-cursor') === 'off' ? 'Custom cursor off' : 'Glass lens cursor on');
    }

    return {
      cycle: cycle,
      frame: function () {
        rx = lerp(rx, tx, 0.16); ry = lerp(ry, ty, 0.16);
        dx = lerp(dx, tx, 0.42); dy = lerp(dy, ty, 0.42);
        lens.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
        ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
        dot.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0) translate(-50%,-50%)';
        label.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0) translate(-50%,-50%)';
      }
    };
  })();

  /* ------------------------------- spotlight ------------------------------- */
  (function () {
    if (!finePointer) return;
    var spot = $('#spotlight');
    var x = 0, y = 0, cx = 0, cy = 0;
    doc.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
    }, { passive: true });
    root.Spotlight = {
      frame: function () {
        cx = lerp(cx, x, 0.07); cy = lerp(cy, y, 0.07);
        spot.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      }
    };
  })();

  /* -------------------------------- magnetic -------------------------------- */
  $$('.magnetic').forEach(function (el) {
    if (!finePointer) return;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.28;
      var y = (e.clientY - r.top - r.height / 2) * 0.4;
      el.style.setProperty('--mx', x.toFixed(2) + 'px');
      el.style.setProperty('--my', y.toFixed(2) + 'px');
    }, { passive: true });
    el.addEventListener('pointerleave', function () {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    }, { passive: true });
  });

  /* ---------------------------------- tilt ---------------------------------- */
  $$('[data-tilt]').forEach(function (el) {
    if (!finePointer || reduce) return;
    var raf = null;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        el.style.transform = 'perspective(1100px) rotateX(' + ((0.5 - py) * 7).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 9).toFixed(2) + 'deg) translateY(-4px)';
      });
    }, { passive: true });
    el.addEventListener('pointerleave', function () {
      if (raf) cancelAnimationFrame(raf);
      el.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1), box-shadow .6s';
      el.style.transform = '';
      setTimeout(function () { el.style.transition = ''; }, 850);
    }, { passive: true });
  });

  /* ------------------------- glass border spotlight ------------------------ */
  doc.addEventListener('pointermove', function (e) {
    if (!finePointer) return;
    var card = e.target.closest ? e.target.closest('.glass') : null;
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  }, { passive: true });

  /* --------------------------------- reveal --------------------------------- */
  (function () {
    var items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* -------------------------------- counters -------------------------------- */
  (function () {
    var els = $$('[data-count]');
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = num(target, dec) + suffix; return; }
      var dur = 1700;
      var start = null;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = clamp((ts - start) / dur, 0, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = num(target * eased, dec) + (p === 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* -------------------------------- scramble -------------------------------- */
  (function () {
    var GLYPHS = '<>/\\|*#@$%&+=~^_01';

    function textNodesOf(node, out) {
      for (var i = 0; i < node.childNodes.length; i++) {
        var child = node.childNodes[i];
        if (child.nodeType === 3 && child.nodeValue.trim() !== '') out.push(child);
        else if (child.nodeType === 1) textNodesOf(child, out);
      }
      return out;
    }

    $$('[data-scramble]').forEach(function (el, i) {
      if (reduce) return;
      var nodes = textNodesOf(el, []);
      var finals = nodes.map(function (n) { return n.nodeValue; });
      var total = finals.join('').length;
      var start = null;

      var step = function (ts) {
        if (start === null) start = ts;
        var p = clamp((ts - start) / 780, 0, 1);
        var seen = 0;
        nodes.forEach(function (node) {
          var chars = node.nodeValue.split('');
          var at = seen / Math.max(1, total);
          var out = chars.map(function (c, idx) {
            if (c === ' ') { seen++; return ' '; }
            var here = at + (idx / Math.max(1, total)) * (node.nodeValue.length / Math.max(1, total));
            seen++;
            if (p > here + 0.16) return c;
            return GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }).join('');
          node.nodeValue = out;
        });
        if (p < 1) requestAnimationFrame(step);
        else nodes.forEach(function (node, k) { node.nodeValue = finals[k]; });
      };

      setTimeout(function () { requestAnimationFrame(step); }, 560 + i * 120);
    });
  })();

  /* ------------------------------- nav + rail ------------------------------- */
  var Nav = (function () {
    var nav = $('#nav');
    var last = 0;
    var probed = -9999;
    var links = $$('.nav__links a');
    var sections = $$('main section[id]');
    var dotsHost = $('#railDots');
    var rail = $('.rail');

    var dots = sections.map(function (s) {
      var b = doc.createElement('button');
      b.className = 'rail__dot';
      b.type = 'button';
      b.setAttribute('data-label', s.id);
      b.addEventListener('click', function () {
        s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
      dotsHost.appendChild(b);
      return { el: b, sec: s };
    });

    function update(y) {
      nav.classList.toggle('is-stuck', y > 24);
      nav.classList.toggle('is-hidden', y > last && y > 420 && !body.classList.contains('menu-open'));
      last = y;
      rail.classList.toggle('is-on', y > window.innerHeight * 0.6);

      if (Math.abs(y - probed) < 30) return;
      probed = y;

      var probe = y + window.innerHeight * 0.34;
      var active = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= probe) active = sections[i];
      }
      dots.forEach(function (d) {
        d.el.classList.toggle('is-active', d.sec === active);
      });
      links.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + active.id);
      });
    }

    var burger = $('#burger');
    burger.addEventListener('click', function () {
      body.classList.toggle('menu-open');
    });
    links.forEach(function (a) {
      a.addEventListener('click', function () { body.classList.remove('menu-open'); });
    });

    return { update: update };
  })();

  /* ---------------------------- horizontal scroll --------------------------- */
  var HScroll = (function () {
    var sec = $('#capabilities');
    var track = $('#hTrack');
    var head = $('.hscroll__head');
    var prog = $('#hProg');
    var travel = 0;
    var distance = 0;
    var vw = window.innerWidth;
    var pad = 0;

    function measure() {
      vw = window.innerWidth;
      var padStr = getComputedStyle(track).paddingLeft;
      pad = parseFloat(padStr) || 0;
      distance = Math.max(0, track.scrollWidth - vw + pad);
      travel = distance + window.innerHeight * 0.55;
      sec.style.height = travel + 'px';
    }

    function update(y) {
      var rect = sec.getBoundingClientRect();
      var scrolled = -rect.top;
      var p = clamp(scrolled / Math.max(1, travel), 0, 1);
      track.style.transform = 'translate3d(' + (-p * distance).toFixed(2) + 'px,0,0)';
      if (prog) prog.style.width = (p * 100).toFixed(2) + '%';
      if (head) head.style.opacity = clamp(1 - p * 3.4, 0.16, 1).toFixed(3);
    }

    return { measure: measure, update: update };
  })();

  /* ------------------------------ process line ------------------------------ */
  var Steps = (function () {
    var list = $('#steps');
    var items = $$('.step', list);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.target.classList.toggle('is-in', en.isIntersecting); });
      }, { threshold: 0.4, rootMargin: '-10% 0px -30% 0px' });
      items.forEach(function (el) { io.observe(el); });
    } else {
      items.forEach(function (el) { el.classList.add('is-in'); });
    }
    return {
      update: function () {
        var r = list.getBoundingClientRect();
        var vh = window.innerHeight;
        var p = clamp((vh * 0.52 - r.top) / Math.max(1, r.height), 0, 1);
        list.style.setProperty('--fill', (p * 100).toFixed(2) + '%');
      }
    };
  })();

  /* ------------------------------ scroll engine ----------------------------- */
  var Engine = (function () {
    var y = window.pageYOffset;
    var smooth = y;
    var fill = $('#scrollFill');
    var hero = $('.hero');
    var heroInner = $('.hero__grid');

    function read() { y = window.pageYOffset; }

    function frame() {
      smooth = lerp(smooth, y, reduce ? 1 : 0.11);
      if (Math.abs(smooth - y) < 0.2) smooth = y;

      var doc_h = doc.documentElement.scrollHeight - window.innerHeight;
      var p = doc_h > 0 ? clamp(y / doc_h, 0, 1) : 0;
      fill.style.width = (p * 100).toFixed(3) + '%';

      if (hero && y < window.innerHeight * 1.3) {
        var k = clamp(y / window.innerHeight, 0, 1);
        heroInner.style.transform = 'translate3d(0,' + (k * -90).toFixed(2) + 'px,0) scale(' + (1 - k * 0.09).toFixed(4) + ')';
        heroInner.style.opacity = (1 - k * 0.85).toFixed(3);
      }

      Nav.update(smooth);
      HScroll.update(smooth);
      Steps.update();
      if (Cursor.frame) Cursor.frame();
      if (root.Spotlight) root.Spotlight.frame();
    }

    window.addEventListener('scroll', read, { passive: true });
    return { frame: frame };
  })();

  (function loop() {
    Engine.frame();
    requestAnimationFrame(loop);
  })();

  /* --------------------------------- resize --------------------------------- */
  var resizeTimer;
  window.addEventListener('resize', function () {
    HScroll.measure();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { Voice.layout(); }, 160);
  }, { passive: true });

  /* ------------------------------ hero starfield ---------------------------- */
  (function () {
    var cv = $('#starfield');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var parts = [];
    var w = 0, h = 0, dpr = 1;
    var mx = -9999, my = -9999;
    var count = finePointer ? 62 : 30;

    function resize() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      parts = [];
      for (var i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: rand(-0.14, 0.14),
          vy: rand(-0.14, 0.14),
          r: rand(0.7, 2.1),
          hue: Math.random() < 0.5 ? 190 : 262
        });
      }
    }

    cv.parentElement.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    }, { passive: true });

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -12) p.x = w + 12; if (p.x > w + 12) p.x = -12;
        if (p.y < -12) p.y = h + 12; if (p.y > h + 12) p.y = -12;

        var dx = p.x - mx, dy = p.y - my;
        var d2 = dx * dx + dy * dy;
        if (d2 < 26000) {
          var f = (1 - d2 / 26000) * 0.9;
          var d = Math.sqrt(d2) || 1;
          p.x += (dx / d) * f; p.y += (dy / d) * f;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ',92%,72%,.85)';
        ctx.fill();

        for (var j = i + 1; j < parts.length; j++) {
          var q = parts[j];
          var ax = p.x - q.x, ay = p.y - q.y;
          var dist = ax * ax + ay * ay;
          if (dist < 13000) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'hsla(' + p.hue + ',88%,68%,' + (0.16 * (1 - dist / 13000)).toFixed(3) + ')';
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(tick);
  })();

  /* ------------------------------ latency toy ------------------------------- */
  (function () {
    var el = $('#latency');
    if (!el) return;
    setInterval(function () {
      el.textContent = rand(8, 26).toFixed(0) + 'ms';
    }, 2200);
  })();

  /* --------------------------------- ticker --------------------------------- */
  (function () {
    var set = $('.ticker__set');
    if (set) set.parentNode.appendChild(set.cloneNode(true));
    var foot = $('#footTrack');
    if (foot) foot.innerHTML += foot.innerHTML;
  })();

  /* --------------------------------- filters -------------------------------- */
  (function () {
    var chips = $$('.filters .chip');
    var cards = $$('#workGrid .card');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) {
          c.classList.toggle('is-active', c === chip);
          c.setAttribute('aria-selected', c === chip ? 'true' : 'false');
        });
        cards.forEach(function (card) {
          var match = f === 'all' || card.getAttribute('data-cat') === f;
          if (match) {
            card.classList.remove('is-filtered', 'is-fading');
          } else {
            card.classList.add('is-fading');
            setTimeout(function () { card.classList.add('is-filtered'); }, 380);
          }
        });
        var visible = cards.filter(function (c) { return !c.classList.contains('is-filtered'); }).length;
        toast(f === 'all' ? 'Showing all ' + visible + ' projects' : visible + ' projects · ' + f);
      });
    });
  })();

  /* -------------------------------- accordion -------------------------------- */
  $$('.acc__item').forEach(function (item) {
    var btn = $('.acc__btn', item);
    btn.addEventListener('click', function () {
      var open = item.classList.contains('is-open');
      $$('.acc__item').forEach(function (i) {
        i.classList.remove('is-open');
        $('.acc__btn', i).setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* --------------------------------- pricing -------------------------------- */
  (function () {
    var wrap = $('.toggle');
    if (!wrap) return;
    var btns = $$('.toggle__btn', wrap);
    var thumb = $('.toggle__thumb', wrap);

    function move() {
      var active = wrap.querySelector('.toggle__btn.is-active');
      thumb.style.width = active.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + (active.offsetLeft - 5) + 'px)';
    }

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cycle = btn.getAttribute('data-cycle');
        btns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        move();
        $$('[data-price]').forEach(function (p) {
          var to = parseInt(p.getAttribute('data-' + cycle), 10);
          var from = parseInt(p.textContent.replace(/[^\d]/g, ''), 10) || 0;
          var t0 = null;
          var anim = function (ts) {
            if (t0 === null) t0 = ts;
            var k = clamp((ts - t0) / 520, 0, 1);
            var eased = 1 - Math.pow(1 - k, 3);
            p.textContent = num(from + (to - from) * eased);
            if (k < 1) requestAnimationFrame(anim);
          };
          requestAnimationFrame(anim);
        });
      });
    });
    requestAnimationFrame(move);
    window.addEventListener('resize', move, { passive: true });
  })();

  /* --------------------------------- voices --------------------------------- */
  var Voice = (function () {
    var track = $('#voiceTrack');
    var dotsHost = $('#voiceDots');
    var pages = 1;
    var index = 0;
    var step = 0;

    function layout() {
      var first = track.children[0];
      if (!first) return;
      var gap = parseFloat(getComputedStyle(track).gap) || 0;
      step = first.offsetWidth + gap;
      var view = $('.rail-wrap').clientWidth;
      pages = Math.max(1, Math.round((track.scrollWidth - view) / step) + 1);
      dotsHost.innerHTML = '';
      for (var i = 0; i < pages; i++) {
        var b = doc.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
        b.addEventListener('click', function (e) { go($$('button', dotsHost).indexOf(e.currentTarget)); });
        dotsHost.appendChild(b);
      }
      go(clamp(index, 0, pages - 1), true);
    }

    function go(i, instant) {
      index = clamp(i, 0, pages - 1);
      var x = -index * step;
      if (instant || reduce) {
        track.style.transition = 'none';
        track.style.transform = 'translate3d(' + x + 'px,0,0)';
        requestAnimationFrame(function () { track.style.transition = ''; });
      } else {
        track.style.transition = 'transform .65s cubic-bezier(.22,1,.36,1)';
        track.style.transform = 'translate3d(' + x + 'px,0,0)';
      }
      $$('button', dotsHost).forEach(function (b, k) { b.classList.toggle('is-active', k === index); });
    }

    $('#nextVoice').addEventListener('click', function () { go(index + 1); });
    $('#prevVoice').addEventListener('click', function () { go(index - 1); });

    var down = false, startX = 0, startPos = 0, moved = 0;
    track.addEventListener('pointerdown', function (e) {
      down = true; moved = 0;
      startX = e.clientX;
      startPos = -index * step;
      track.classList.add('is-dragging');
      track.style.transition = 'none';
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      moved = dx;
      track.style.transform = 'translate3d(' + (startPos + dx) + 'px,0,0)';
    });
    function release() {
      if (!down) return;
      down = false;
      track.classList.remove('is-dragging');
      if (Math.abs(moved) > step * 0.25) go(index + (moved < 0 ? 1 : -1));
      else go(index);
    }
    track.addEventListener('pointerup', release);
    track.addEventListener('pointercancel', release);
    track.addEventListener('click', function (e) { if (Math.abs(moved) > 6) e.preventDefault(); });

    window.addEventListener('resize', function () { layout(); }, { passive: true });
    return { layout: layout };
  })();

  /* ------------------------------ contact form ------------------------------ */
  (function () {
    var form = $('#contactForm');
    if (!form) return;
    var select = $('.field--select', form);

    select.addEventListener('change', function () {
      select.classList.toggle('is-filled', !!select.querySelector('select').value);
    });

    var validate = function (field) {
      var input = $('input,textarea,select', field);
      var ok = input.checkValidity() && String(input.value).trim().length > 0;
      field.classList.toggle('is-invalid', !ok);
      return ok;
    };

    $$('.field', form).forEach(function (field) {
      var input = $('input,textarea,select', field);
      input.addEventListener('input', function () { field.classList.remove('is-invalid'); });
      input.addEventListener('blur', function () { if (input.value) validate(field); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('.field', form);
      var ok = true;
      fields.forEach(function (f) { if (!validate(f)) ok = false; });
      if (!ok) { toast('A couple of fields need attention'); return; }

      var btn = $('button[type="submit"]', form);
      var txt = $('#submitTxt');
      btn.disabled = true;
      txt.textContent = 'Sending…';

      setTimeout(function () {
        btn.disabled = false;
        txt.textContent = 'Send the brief';
        form.reset();
        select.classList.remove('is-filled');
        toast('Brief received — we reply within one working day');
      }, 1200);
    });
  })();

  /* ---------------------------------- clock --------------------------------- */
  (function () {
    var t = $('#clockTime');
    var z = $('#clockZone');
    var f = $('#footTime');
    if (!t) return;
    var zone = (Intl.DateTimeFormat().resolvedOptions().timeZone || 'local').split('/').pop().replace(/_/g, ' ');
    z.textContent = zone;
    var tick = function () {
      var d = new Date();
      var hh = String(d.getHours()).padStart(2, '0');
      var mm = String(d.getMinutes()).padStart(2, '0');
      var ss = String(d.getSeconds()).padStart(2, '0');
      t.textContent = hh + ':' + mm;
      if (f) f.textContent = hh + ':' + mm + ':' + ss;
    };
    tick();
    setInterval(tick, 1000);
  })();

  /* ----------------------------- command palette ---------------------------- */
  var Palette = (function () {
    var host = $('#palette');
    var input = $('#paletteInput');
    var list = $('#paletteList');
    var items = [];
    var pool = [];
    var sel = 0;

    function build() {
      items = [];
      $$('main section[id]').forEach(function (s) {
        items.push({
          label: 'Go to ' + s.id,
          sub: 'section',
          ico: s.id.slice(0, 2).toUpperCase(),
          run: function () { s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
        });
      });
      items.push({ label: 'Toggle colour theme', sub: 'action', ico: '◐', run: Theme.toggle });
      items.push({ label: 'Toggle glass lens cursor', sub: 'action', ico: '◎', run: function () { Cursor.cycle(); } });
      items.push({
        label: 'Copy studio email', sub: 'clipboard', ico: '@',
        run: function () {
          if (navigator.clipboard) navigator.clipboard.writeText('hello@prisma.studio');
          toast('hello@prisma.studio copied');
        }
      });
      items.push({
        label: 'Show annual pricing', sub: 'action', ico: '€',
        run: function () {
          var annual = $('.toggle__btn[data-cycle="annual"]');
          if (annual) annual.click();
          $('#pricing').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        }
      });
      items.push({
        label: 'Filter work: all', sub: 'filter', ico: '×',
        run: function () {
          var chip = $('.filters .chip[data-filter="all"]');
          if (chip) chip.click();
          $('#work').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        }
      });
      items.push({
        label: 'Surprise me with a project', sub: 'shuffle', ico: '↻',
        run: function () {
          var cards = $$('#workGrid .card:not(.is-filtered)');
          if (!cards.length) return;
          cards[Math.floor(Math.random() * cards.length)]
            .scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        }
      });
    }

    function score(item, q) {
      var l = item.label.toLowerCase();
      var idx = l.indexOf(q);
      if (idx === -1) return item.sub.toLowerCase().indexOf(q) >= 0 ? 0.4 : -1;
      return 1 - idx / l.length * 0.5;
    }

    function paint() {
      $$('li', list).forEach(function (li, i) { li.classList.toggle('is-sel', i === sel); });
      var cur = list.children[sel];
      if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
    }

    function run(i) {
      var item = pool[i];
      if (!item) return;
      close();
      item.run();
    }

    function render(q) {
      q = (q || '').trim().toLowerCase();
      pool = q
        ? items.filter(function (it) { return score(it, q) >= 0; })
        : items.slice();

      list.innerHTML = '';
      if (!pool.length) {
        var empty = doc.createElement('li');
        empty.className = 'palette__empty';
        empty.textContent = 'No match for “' + q + '”';
        list.appendChild(empty);
        return;
      }
      pool.forEach(function (item, i) {
        var li = doc.createElement('li');
        var ico = doc.createElement('span');
        ico.className = 'palette__ico';
        ico.textContent = item.ico;
        var txt = doc.createElement('span');
        txt.className = 'palette__txt';
        var b = doc.createElement('b');
        b.textContent = item.label;
        var small = doc.createElement('small');
        small.textContent = item.sub;
        txt.appendChild(b);
        txt.appendChild(small);
        li.appendChild(ico);
        li.appendChild(txt);
        li.addEventListener('click', function () { run(i); });
        li.addEventListener('pointerenter', function () { sel = i; paint(); });
        list.appendChild(li);
      });
      sel = 0;
      paint();
    }

    function open() {
      build();
      host.hidden = false;
      body.classList.add('is-locked');
      input.value = '';
      render('');
      setTimeout(function () { input.focus(); }, 40);
    }

    function close() {
      host.hidden = true;
      body.classList.remove('is-locked');
    }

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, pool.length - 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
      else if (e.key === 'Escape') { close(); }
    });
    $$('[data-close]', host).forEach(function (el) { el.addEventListener('click', close); });
    $('#paletteBtn').addEventListener('click', open);
    $('#footPalette').addEventListener('click', open);

    return { open: open, close: close };
  })();

  /* ------------------------------ keyboard map ------------------------------ */
  doc.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select';

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      $('#palette').hidden ? Palette.open() : Palette.close();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key.toLowerCase() === 'c' && Cursor.cycle) Cursor.cycle();
    if (e.key.toLowerCase() === 't') Theme.toggle();
    if (e.key === '/') { e.preventDefault(); Palette.open(); }
  });

  /* -------------------------------- preloader -------------------------------- */
  (function () {
    var pre = $('#preloader');
    var count = $('#preCount');
    var bar = $('#preBar');
    var task = $('#preTask');
    var marks = $$('.preloader__mark span');
    var TASKS = ['initialising glass shaders', 'compiling scroll timelines', 'sprinkling particles', 'measuring contrast', 'ready'];

    if (reduce) {
      if (pre) pre.classList.add('is-gone');
      return;
    }

    var pct = 0;
    var t0 = performance.now();
    marks.forEach(function (m, i) {
      setTimeout(function () { m.classList.add('on'); }, 180 + i * 70);
    });

    var timer = setInterval(function () {
      var elapsed = performance.now() - t0;
      var ceiling = clamp(elapsed / 1750, 0, 0.94);
      pct = Math.min(ceiling, pct + rand(0.015, 0.075));
      count.textContent = String(Math.round(pct * 100)).padStart(2, '0');
      bar.style.width = (pct * 100).toFixed(1) + '%';
      task.textContent = TASKS[Math.min(TASKS.length - 1, Math.floor(pct * TASKS.length))];
      if (pct >= 0.94) clearInterval(timer);
    }, 70);

    var finish = function () {
      clearInterval(timer);
      count.textContent = '100';
      bar.style.width = '100%';
      task.textContent = 'ready';
      marks.forEach(function (m) { m.classList.add('on'); });
      setTimeout(function () {
        pre.classList.add('is-done');
        document.body.classList.add('is-ready');
        setTimeout(function () { pre.classList.add('is-gone'); }, 900);
        $$('[data-reveal]').forEach(function (el, i) {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            setTimeout(function () { el.classList.add('is-in'); }, 120 + i * 45);
          }
        });
      }, 260);
    };

    if (doc.readyState === 'complete') setTimeout(finish, 1150);
    else window.addEventListener('load', function () { setTimeout(finish, 1150); });
    setTimeout(finish, 4200);
  })();

  /* ---------------------------------- boot ---------------------------------- */
  HScroll.measure();
  Voice.layout();
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = doc.querySelector(id);
      if (!target) return;
      e.preventDefault();
      body.classList.remove('menu-open');
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();