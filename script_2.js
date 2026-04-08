
  // Robust image fallback: if any external image fails, replace with a stable placeholder.
  (function () {
    function fallbackFor(img) {
      const w = img.naturalWidth || img.width || 1400;
      const h = img.naturalHeight || img.height || 900;
      const seed = encodeURIComponent((img.getAttribute("alt") || "luxury").slice(0, 40) + "-" + (img.getAttribute("src") || "").slice(-12));
      img.src = `https://picsum.photos/seed/${seed}/${Math.max(600, w)}/${Math.max(400, h)}`;
      img.removeAttribute("srcset");
    }

    document.querySelectorAll("img").forEach((img) => {
      img.addEventListener("error", function () {
        // Prevent infinite loops
        if (img.dataset.fallbackApplied) return;
        img.dataset.fallbackApplied = "1";
        fallbackFor(img);
      }, { once: true });

      // If image is lazy and already broken in cache, try forcing a reload once
      if (img.complete && img.naturalWidth === 0) {
        img.dispatchEvent(new Event("error"));
      }
    });
  })();
