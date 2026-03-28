/* ConvoSphere 3D Interactions */
export function init3DInteractions() {
  /* === 1. SCROLL TILT REVEAL === */
  function initScrollTilt() {
    const cards = document.querySelectorAll('.scroll-tilt-card, .page-card-reveal');
    if (!cards.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view', 'revealed');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    cards.forEach((c) => obs.observe(c));
  }

  /* === 2. MOUSEMOVE 3D TILT === */
  function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach((cardElement) => {
      const card = cardElement as HTMLElement;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const tiltX = y * -10;
        const tiltY = x * 10;
        card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(4px)`;
        const shine = card.querySelector('.tilt-shine') as HTMLElement;
        if (shine) {
          shine.style.setProperty('--mx', ((x + 0.5) * 100) + '%');
          shine.style.setProperty('--my', ((y + 0.5) * 100) + '%');
        }
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* === 3. HERO SPHERE PARALLAX on mousemove === */
  function initSphereParallax() {
    const sphere = document.querySelector('.hero-sphere-container') as HTMLElement;
    const hero = document.querySelector('.hero-section') as HTMLElement;
    if (!sphere || !hero) return;
    let rafId: number;
    hero.addEventListener('mousemove', (e) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 24;
        const y = ((e.clientY - r.top) / r.height - 0.5) * 16;
        sphere.style.transform = `translate(calc(-50% + ${x}px), calc(-55% + ${y}px))`;
      });
    });
    hero.addEventListener('mouseleave', () => {
      sphere.style.transform = 'translate(-50%, -55%)';
      sphere.style.transition = 'transform 0.8s cubic-bezier(0.16,1,0.3,1)';
      setTimeout(() => {
        sphere.style.transition = '';
      }, 800);
    });
  }

  /* === 4. MESH BLOB PARALLAX === */
  function initBlobParallax() {
    const blobs = document.querySelectorAll('.mesh-blob');
    const hero = document.querySelector('.hero-section');
    if (!blobs.length || !hero) return;
    let rafId: number;
    hero.addEventListener('mousemove', (e: any) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 30;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        blobs.forEach((blobElement, i) => {
          const b = blobElement as HTMLElement;
          const dir = i % 2 === 0 ? 1 : -1;
          b.style.transform = `translate3d(${x * dir}px, ${y * dir}px, 0)`;
        });
      });
    });
  }

  /* === 5. STAT COUNTER === */
  function initCounters() {
    const stats = document.querySelectorAll('.stat-value[data-count]');
    if (!stats.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const target = parseFloat(el.getAttribute('data-count')!);
        const suffix = el.getAttribute('data-suffix') || '';
        const prefix = el.getAttribute('data-prefix') || '';
        const isFloat = target % 1 !== 0;
        const duration = 1800;
        const start = performance.now();

        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = target * eased;
          el.textContent = prefix + (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = prefix + target + suffix;
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    stats.forEach((s) => obs.observe(s));
  }

  /* === 6. SECTION PERSPECTIVE SCROLL === */
  function initPerspectiveSections() {
    const sections = document.querySelectorAll('.perspective-section');
    if (!sections.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.remove('is-offscreen', 'is-entering');
          e.target.classList.add('is-visible');
        } else {
          if (!e.target.classList.contains('is-visible')) {
            e.target.classList.add('is-offscreen');
          }
        }
      });
    }, { threshold: 0.1 });
    sections.forEach((s) => {
      s.classList.add('is-offscreen');
      obs.observe(s);
    });
  }

  /* === 7. ORBIT NODES FLOATING === */
  function initOrbitFloat() {
    document.querySelectorAll('.channel-node').forEach((nodeElement, i) => {
      const node = nodeElement as HTMLElement;
      node.style.animationDelay = -(i * 0.75) + 's';
      node.classList.add('float-depth');
    });
  }

  initScrollTilt();
  initTiltCards();
  initSphereParallax();
  initBlobParallax();
  initCounters();
  initPerspectiveSections();
  initOrbitFloat();
}
