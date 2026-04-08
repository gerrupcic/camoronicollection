
  // Logo swap (white on dark hero, gold on light sections) + micro entrance
  (function(){
    const header = document.querySelector(".site-header");
    const logo = document.getElementById("brandLogo");
    if(!header || !logo) return;

    // Micro entrance
    requestAnimationFrame(() => {
      header.classList.add("is-ready");
      logo.classList.add("is-ready");
    });

    const srcWhite = logo.dataset.logoWhite;
    const srcGold  = logo.dataset.logoGold;

    // Preload gold to avoid flicker
    const preload = new Image();
    preload.src = srcGold;

    function setLogo(mode){
      const next = (mode === "gold") ? srcGold : srcWhite;
      if(logo.getAttribute("src") === next) return;
      // Fade swap
      logo.classList.add("is-swapping");
      setTimeout(() => {
        logo.setAttribute("src", next);
        logo.classList.remove("is-swapping");
      }, 150);
    }

    // Determine "light" when a light-background section is near top
    const lightSentinels = ["#experience", "#rooms", "#dining", "#gallery"].map(s => document.querySelector(s)).filter(Boolean);

    const io = new IntersectionObserver((entries) => {
      // If any light section occupies the top band, switch to gold
      const anyLight = entries.some(e => e.isIntersecting && e.boundingClientRect.top < (window.innerHeight * 0.35));
      if(anyLight){
        header.classList.add("on-light");
        setLogo("gold");
      } else {
        header.classList.remove("on-light");
        setLogo("white");
      }
    }, { threshold: [0.05, 0.15, 0.3], rootMargin: "-10% 0px -75% 0px" });

    lightSentinels.forEach(el => io.observe(el));

    // Fallback: if near top of page, keep white
    window.addEventListener("scroll", () => {
      if(window.scrollY < 40){
        header.classList.remove("on-light");
        setLogo("white");
      }
    }, { passive:true });
  })();
