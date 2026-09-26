(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var SEEN = "hanene.gate.opened";

  /* ------------------------------------------------------------------ *
   * The gate: a sealed envelope, once per visit. Without JavaScript the
   * gate stays hidden, so the card is simply there from the start.
   * ------------------------------------------------------------------ */
  var gate = document.getElementById("gate");
  var seal = document.getElementById("seal");
  var envelope = document.getElementById("envelope");
  var bloom = document.getElementById("bloom");
  var opened = false;

  function armReveals() {
    var targets = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.06 });

    targets.forEach(function (el, i) {
      if (i < 2 && !reduceMotion.matches) {
        el.style.transitionDelay = (i * 0.14).toFixed(2) + "s";
      }
      io.observe(el);
    });
  }

  function openGate() {
    if (opened) return;
    opened = true;
    try { sessionStorage.setItem(SEEN, "1"); } catch (e) { /* private mode */ }

    envelope.classList.add("is-opening");
    seal.disabled = true;

    var sealPoint = seal.getBoundingClientRect();
    bloom.style.left = (sealPoint.left + sealPoint.width / 2) + "px";
    bloom.style.top = (sealPoint.top + sealPoint.height / 2) + "px";

    var flapMs = reduceMotion.matches ? 20 : 760;
    var bloomAt = reduceMotion.matches ? 20 : 420;

    setTimeout(function () {
      bloom.classList.add("is-blooming");
    }, bloomAt);

    setTimeout(function () {
      gate.classList.add("is-dissolving");
    }, bloomAt + (reduceMotion.matches ? 320 : 900));

    setTimeout(function () {
      gate.hidden = true;
      gate.remove();
      body.classList.remove("is-sealed");
      body.classList.add("is-open");
      armReveals();
      var h = document.querySelector(".names");
      if (h) {
        h.setAttribute("tabindex", "-1");
        h.focus({ preventScroll: true });
      }
    }, bloomAt + (reduceMotion.matches ? 700 : 1500));
  }

  if (gate && seal) {
    var alreadySeen = false;
    try { alreadySeen = sessionStorage.getItem(SEEN) === "1"; } catch (e) { /* ignore */ }

    if (alreadySeen) {
      gate.remove();
      body.classList.add("is-open");
      armReveals();
    } else {
      gate.hidden = false;
      body.classList.add("is-sealed");
      seal.addEventListener("click", openGate);
    }
  } else {
    armReveals();
  }

  root.classList.add("is-ready");
})();
