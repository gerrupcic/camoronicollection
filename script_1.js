
    // Helpers
    const $ = (s, el=document) => el.querySelector(s);
    const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

    // Drawer
    const drawer = $("#drawer");
    const menuBtn = $("#menuBtn");
    const closeDrawerBtn = $("#closeDrawerBtn");
    const drawerOverlay = $("#drawerOverlay");

    function openDrawer(){
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      menuBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeDrawer(){
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      menuBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    menuBtn?.addEventListener("click", () => {
      drawer.classList.contains("is-open") ? closeDrawer() : openDrawer();
    });
    closeDrawerBtn?.addEventListener("click", closeDrawer);
    drawerOverlay?.addEventListener("click", closeDrawer);
    $$(".drawer-link").forEach(a => a.addEventListener("click", closeDrawer));
    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape"){
        if(drawer.classList.contains("is-open")) closeDrawer();
        if(modal.classList.contains("is-open")) closeModal();
      }
    });

    // Scroll down
    $("#scrollDownBtn")?.addEventListener("click", () => {
      $("#experience")?.scrollIntoView({behavior:"smooth", block:"start"});
    });

    // Booking interactions
    const bookingCard = $("#bookingCard");
    $("#openBookingBtn")?.addEventListener("click", () => {
      bookingCard?.scrollIntoView({behavior:"smooth", block:"center"});
      // pulse focus on first input
      setTimeout(() => bookingCard?.querySelector('input[type="date"]')?.focus(), 350);
    });

    const bookingForm = $("#bookingForm");
    const bookingResult = $("#bookingResult");

    function fmtDate(d){
      return window.__cmI18n?.fmtDateByLang ? window.__cmI18n.fmtDateByLang(d) : null;
    }

    bookingForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(bookingForm);
      const checkin = data.get("checkin");
      const checkout = data.get("checkout");
      const guests = data.get("guests");
      const rooms = data.get("rooms");

      const ci = fmtDate(checkin);
      const co = fmtDate(checkout);
      if(!ci || !co){
        bookingResult.textContent = window.__cmI18n?.t("booking_error_dates") || "Completá fechas válidas para simular disponibilidad.";
        return;
      }
      // Basic rule: checkout must be after checkin
      const ciD = new Date(checkin);
      const coD = new Date(checkout);
      if(coD <= ciD){
        bookingResult.textContent = window.__cmI18n?.t("booking_error_order") || "Check Out debe ser posterior a Check In.";
        return;
      }

      bookingResult.textContent = `${window.__cmI18n?.t("booking_result_prefix") || "Disponibilidad simulada:"} ${ci} → ${co} · ${guests} ${window.__cmI18n?.t("booking_guest_unit") || "huésped(es)"} · ${rooms} ${window.__cmI18n?.t("booking_room_unit") || "habitación(es)"}.`;
      showToast(window.__cmI18n?.t("toast_simulated") || "Listo. Simulamos disponibilidad (sin back-end).");
    });

    // Rooms filter (ultra-smooth: FLIP + overlay exit clones)
    const chips = $$(".chip");
    const grid = $("#roomsGrid");
    const cards = $$("#roomsGrid .room-card");

    function getRects(list){
      const rects = new Map();
      list.forEach(el => rects.set(el, el.getBoundingClientRect()));
      return rects;
    }

    function ensureOverlay(){
      if(!grid) return null;
      let ov = grid.querySelector(".rooms-overlay");
      if(!ov){
        ov = document.createElement("div");
        ov.className = "rooms-overlay";
        grid.appendChild(ov);
      }
      return ov;
    }

    function rectRelativeToGrid(rect){
      const g = grid.getBoundingClientRect();
      return { left: rect.left - g.left, top: rect.top - g.top, width: rect.width, height: rect.height };
    }

    function makeExitClone(card, overlay){
      const r = rectRelativeToGrid(card.getBoundingClientRect());
      const clone = card.cloneNode(true);
      clone.classList.remove("reveal", "is-in", "is-entering"); // keep it static
      clone.style.left = r.left + "px";
      clone.style.top = r.top + "px";
      clone.style.width = r.width + "px";
      clone.style.height = r.height + "px";
      overlay.appendChild(clone);

      // Animate clone out (smooth)
      clone.animate([
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(18px) scale(.99)" }
      ], { duration: 520, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" })
      .addEventListener("finish", () => clone.remove());
    }

    function applyFilterUltraSmooth(filter){
      if(!grid) return;

      const overlay = ensureOverlay();

      // FIRST: measure current positions of visible cards
      const visibleBefore = cards.filter(c => !c.classList.contains("is-hidden"));
      const first = getRects(visibleBefore);

      // Compute sets
      const toHide = cards.filter(c => filter !== "all" && c.dataset.type !== filter && !c.classList.contains("is-hidden"));
      const toShow = cards.filter(c => filter === "all" || c.dataset.type === filter);

      // Create exit clones for the cards that will disappear (so exit animation doesn't affect layout)
      toHide.forEach(c => makeExitClone(c, overlay));

      // Apply final layout instantly (hide originals, show targets) to get LAST rects without choppy reflow
      toHide.forEach(c => c.classList.add("is-hidden"));
      toShow.forEach(c => c.classList.remove("is-hidden"));

      // LAST: measure new positions of visible cards
      const visibleAfter = cards.filter(c => !c.classList.contains("is-hidden"));
      const last = getRects(visibleAfter);

      // INVERT: set transforms so elements appear in old positions
      grid.classList.add("is-flipping");
      visibleAfter.forEach(el => {
        const f = first.get(el);
        const l = last.get(el);
        if(!f || !l) return; // brand-new entering card
        const dx = f.left - l.left;
        const dy = f.top - l.top;
        if (dx || dy) {
          el.style.transform = `translate(${dx}px, ${dy}px)`;
        }
      });

      // PLAY: remove transforms on next frame
      requestAnimationFrame(() => {
        visibleAfter.forEach(el => el.style.transform = "");
      });

      // Enter animation for cards that were previously hidden
      const entering = visibleAfter.filter(el => !first.has(el));
      entering.forEach((el, idx) => {
        el.classList.add("is-entering");
        el.classList.remove("is-in");
        // stagger in
        setTimeout(() => {
          el.classList.add("is-in");
          setTimeout(() => el.classList.remove("is-entering"), 520);
        }, 80 + idx * 80);
      });

      // Cleanup
      setTimeout(() => grid.classList.remove("is-flipping"), 680);
    }

    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        chips.forEach(c => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        applyFilterUltraSmooth(chip.dataset.filter);
      });
    });


    // Modal
    const modal = $("#modal");
    const modalOverlay = $("#modalOverlay");
    const closeModalBtn = $("#closeModalBtn");
    const modalCloseBtn = $("#modalCloseBtn");
    const modalTitle = $("#modalTitle");
    const modalContent = $("#modalContent");
    function getRoomDetails(key){
      const lang = window.__cmI18n?.lang || 'es';
      const tables = window.__cmI18n?.roomDetails || {};
      return (tables[lang] && tables[lang][key]) || (tables.es && tables.es[key]) || null;
    }

    function openModal(key){
      const d = getRoomDetails(key);
      if(!d) return;
      modalTitle.textContent = d.title;

      const meta = d.items.map(([k,v]) => `
        <div class="kv">
          <div class="k">${k}</div>
          <div class="v">${v}</div>
        </div>
      `).join("");

      const gallery = (d.gallery && d.gallery.length ? d.gallery : [d.img]).map((src, idx) => `
        <button class="modal-thumb ${idx === 0 ? 'is-active' : ''}" type="button" data-modal-thumb="${src}" aria-label="${(window.__cmI18n?.lang === "en") ? `View image ${idx + 1} of ${d.title}` : (window.__cmI18n?.lang === "it") ? `Vedi immagine ${idx + 1} di ${d.title}` : `Ver imagen ${idx + 1} de ${d.title}`}">
          <img src="${src}" alt="${d.title} ${idx + 1}">
        </button>
      `).join("");

      modalContent.innerHTML = `
        <div class="modal-media-stack">
          <img src="${d.img}" alt="${d.title}" id="modalMainImage">
          <div class="modal-gallery">${gallery}</div>
        </div>
        <div class="modal-meta">
          ${meta}
          <div class="kv">
            <div class="k">${window.__cmI18n?.lang === "en" ? "Note" : window.__cmI18n?.lang === "it" ? "Nota" : "Nota"}</div>
            <div class="v">${d.note}</div>
          </div>
        </div>
      `;

      const mainImage = modalContent.querySelector("#modalMainImage");
      modalContent.querySelectorAll("[data-modal-thumb]").forEach(btn => {
        btn.addEventListener("click", () => {
          const src = btn.dataset.modalThumb;
          if(mainImage) mainImage.src = src;
          modalContent.querySelectorAll(".modal-thumb").forEach(t => t.classList.remove("is-active"));
          btn.classList.add("is-active");
        });
      });

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden","false");
      document.body.style.overflow = "hidden";
    }

    function closeModal(){
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden","true");
      document.body.style.overflow = "";
    }

    $$("[data-modal-open]").forEach(btn => {
      btn.addEventListener("click", () => openModal(btn.dataset.modalOpen));
    });
    modalOverlay?.addEventListener("click", closeModal);
    closeModalBtn?.addEventListener("click", closeModal);
    modalCloseBtn?.addEventListener("click", closeModal);

    $("#modalBookBtn")?.addEventListener("click", () => {
      closeModal();
      $("#rooms")?.scrollIntoView({behavior:"smooth", block:"start"});
      $("#openBookingBtn")?.click();
      showToast(window.__cmI18n?.t("toast_modal_book") || "Book your room");
    });

    // Toast
    const toast = $("#toast");
    let toastTimer = null;
    function showToast(msg){
      toast.textContent = msg;
      toast.classList.add("is-show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-show"), 2400);
    }
    $("#toastBtn")?.addEventListener("click", () => showToast("Acción simulada. Esto puede abrir WhatsApp, formulario o motor de reservas."));

    // Footer year
    $("#year").textContent = String(new Date().getFullYear());

    // Close drawer on anchor clicks (general)
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if(href && href.length > 1){
          const target = $(href);
          if(target){
            e.preventDefault();
            target.scrollIntoView({behavior:"smooth", block:"start"});
            closeDrawer();
          }
        }
      });
    });
  