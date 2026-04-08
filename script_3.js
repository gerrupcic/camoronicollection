
  // Scroll reveal animations (IntersectionObserver)
  (function () {
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    // Mark elements to reveal
    const selectors = [
      ".hero-copy", ".booking-card",
      "#experience .panel-text", "#experience .panel-media",
      "#rooms .section-head", "#roomsGrid .room-card",
      "#services .section-head", "#services .service-card",

      "#dining .feature-text", "#dining .feature-media",
      "#spa .feature-text", "#spa .feature-media",
            "#reviews .section-head", "#reviews .reviews-shell", "#reviews .review-card",
      "#gallery .section-head", "#gallery .masonry img",
      "#contact .contact-card", ".footer-inner"
    ];

    const elements = selectors.flatMap(sel => Array.from(document.querySelectorAll(sel)));

    elements.forEach((el) => {
      // Choose a variant by context
      if (el.classList.contains("room-card")) el.classList.add("reveal", "reveal--up");
      else if (el.closest(".panel-media") || el.closest(".feature-media")) el.classList.add("reveal", "reveal--zoom");
      else if (el.closest(".panel-text") || el.closest(".feature-text")) el.classList.add("reveal", "reveal--left");
      else if (el.matches(".masonry img")) el.classList.add("reveal", "reveal--up");
      else el.classList.add("reveal", "reveal--fade");
    });

    // Stagger for rooms + gallery
    const roomsGrid = document.getElementById("roomsGrid");
    if (roomsGrid) {
      roomsGrid.setAttribute("data-stagger", "1");
      Array.from(roomsGrid.querySelectorAll(".room-card")).forEach((card, idx) => {
        card.style.setProperty("--i", idx);
      });
    }
    const masonry = document.querySelector(".masonry");
    if (masonry) {
      masonry.setAttribute("data-stagger", "1");
      Array.from(masonry.querySelectorAll("img")).forEach((img, idx) => {
        img.style.setProperty("--i", idx % 9);
      });
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });

    elements.forEach(el => io.observe(el));
  })();
