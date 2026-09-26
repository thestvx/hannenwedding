(function () {
  "use strict";

  var root = document.documentElement;
  var targets = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function showAll() {
    targets.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  if (!("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.08
    }
  );

  targets.forEach(function (el, index) {
    if (index < 2 && !reduceMotion.matches) {
      el.style.transitionDelay = (index * 0.14).toFixed(2) + "s";
    }
    observer.observe(el);
  });

  var syncMotion = function () {
    if (!reduceMotion.matches) return;
    showAll();
  };

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", syncMotion);
  } else if (typeof reduceMotion.addListener === "function") {
    reduceMotion.addListener(syncMotion);
  }

  root.classList.add("is-ready");
})();
