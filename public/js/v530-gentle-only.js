/* MHUR France — Gentle Criminal uniquement, V530 */
(() => {
  "use strict";

  const IMAGE =
    "/assets/home/discounts/gentle_criminal_v530.png?v=530";

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function fixGentle() {
    const discounts = window.MHUR_HOME_DATA?.discounts;

    if (Array.isArray(discounts)) {
      const gentle = discounts.find(
        item => normalize(item?.name) === "gentle criminal"
      );

      if (gentle) {
        gentle.image = IMAGE;
      }
    }

    document
      .querySelectorAll(".discountGridV296 .discountCardV296")
      .forEach(card => {
        const title = normalize(
          card.querySelector(":scope > b")?.textContent
        );

        if (title !== "gentle criminal") return;

        card.classList.add("v530-gentle-card");

        const image = card.querySelector(":scope > img");
        if (!(image instanceof HTMLImageElement)) return;

        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
        image.onerror = null;

        if (image.getAttribute("src") !== IMAGE) {
          image.setAttribute("src", IMAGE);
        }

        image.alt = "Gentle Criminal";
      });
  }

  let scheduled = false;

  function scheduleFix() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      fixGentle();
    });
  }

  function install() {
    fixGentle();

    if (!document.documentElement.dataset.v530GentleObserver) {
      document.documentElement.dataset.v530GentleObserver = "1";

      const observer = new MutationObserver(scheduleFix);
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }

  setTimeout(fixGentle, 100);
  setTimeout(fixGentle, 500);
  setTimeout(fixGentle, 1500);
})();
