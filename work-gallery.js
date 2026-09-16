(() => {
  const cards = [...document.querySelectorAll('[data-lightbox]')];
  const lightbox = document.getElementById('work-lightbox');
  const image = lightbox?.querySelector('.lightbox__image');
  const title = lightbox?.querySelector('.lightbox__title');
  const tag = lightbox?.querySelector('.lightbox__tag');
  const caption = lightbox?.querySelector('.lightbox__caption');
  const status = lightbox?.querySelector('.lightbox__status');
  const closeButton = lightbox?.querySelector('.lightbox__close');
  const previousButton = lightbox?.querySelector('[data-direction="previous"]');
  const nextButton = lightbox?.querySelector('[data-direction="next"]');
  let activeIndex = 0;
  let returnFocus = null;
  let inerted = [];

  const setInert = (shouldInert) => {
    if (shouldInert) {
      inerted = [...document.body.children].filter((node) => node !== lightbox && node.tagName !== 'SCRIPT');
      inerted.forEach((node) => { node.inert = true; });
      return;
    }
    inerted.forEach((node) => { node.inert = false; });
    inerted = [];
  };

  const updateLightbox = (index) => {
    if (!cards.length || !lightbox) return;
    activeIndex = (index + cards.length) % cards.length;
    const card = cards[activeIndex];
    const source = card.dataset.full || card.querySelector('img')?.src || '';
    const cardTitle = card.dataset.title || 'Selected work';
    image.src = source;
    image.alt = card.dataset.alt || cardTitle;
    title.textContent = cardTitle;
    tag.textContent = card.dataset.tag || '';
    caption.textContent = card.dataset.caption || '';
    status.textContent = `${activeIndex + 1} / ${cards.length}`;
  };

  const openLightbox = (index, trigger) => {
    if (!lightbox) return;
    returnFocus = trigger;
    updateLightbox(index);
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    setInert(true);
    closeButton?.focus({ preventScroll: true });
  };

  const closeLightbox = () => {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    image.removeAttribute('src');
    document.body.classList.remove('lightbox-open');
    setInert(false);
    returnFocus?.focus({ preventScroll: true });
  };

  cards.forEach((card, index) => {
    if (!card.hasAttribute('aria-label')) card.setAttribute('aria-label', `View ${card.dataset.title || 'selected work'}`);
    card.addEventListener('click', () => openLightbox(index, card));
  });

  closeButton?.addEventListener('click', closeLightbox);
  previousButton?.addEventListener('click', () => updateLightbox(activeIndex - 1));
  nextButton?.addEventListener('click', () => updateLightbox(activeIndex + 1));
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox || lightbox.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') updateLightbox(activeIndex - 1);
    if (event.key === 'ArrowRight') updateLightbox(activeIndex + 1);
    if (event.key !== 'Tab') return;
    const focusable = [...lightbox.querySelectorAll('button:not([disabled]),a[href]')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const tabs = [...document.querySelectorAll('.folder-tab')];
  const sections = tabs
    .map((tab) => document.querySelector(tab.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      tabs.forEach((tab) => {
        const isCurrent = tab.getAttribute('href') === `#${visible.target.id}`;
        if (isCurrent) tab.setAttribute('aria-current', 'true');
        else tab.removeAttribute('aria-current');
      });
    }, { rootMargin: '-28% 0px -62% 0px', threshold: [0, .1, .35] });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  const revealItems = [...document.querySelectorAll('.work-section__head,.work-card,.case-link,.archive-note')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealItems.forEach((item) => item.classList.add('reveal'));
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }
})();
