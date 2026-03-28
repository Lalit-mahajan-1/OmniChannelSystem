export function initReveal() {
  if (typeof window === 'undefined') return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}
