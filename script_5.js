
  // Reviews slider
  (function(){
    const track = document.getElementById("reviewTrack");
    if(!track) return;
    const cards = Array.from(track.querySelectorAll("[data-review]"));
    const prev = document.querySelector(".review-prev");
    const next = document.querySelector(".review-next");
    const dots = Array.from(document.querySelectorAll(".reviews-dots .dot"));
    let index = 0;

    function go(i){
      index = (i + cards.length) % cards.length;
      track.style.transform = `translateX(${-index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle("is-active", di === index));
    }

    prev && prev.addEventListener("click", () => go(index - 1));
    next && next.addEventListener("click", () => go(index + 1));
  })();
