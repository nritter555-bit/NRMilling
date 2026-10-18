'use strict';
const projects = window.NRMillingProjects || [];

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Ouvrir le menu');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });

const gallery = document.querySelector('#gallery');
projects.forEach((project, index) => {
  const article = document.createElement('article');
  article.className = `project-card ${project.image ? 'has-photo' : `illustration-${project.illustration}`}`;
  const visual = document.createElement('div');
  visual.className = 'project-visual';
  const image = document.createElement('img');
  image.src = project.image || (project.illustration === 'drawing' ? './public/images/technical-drawing.svg' : './public/images/precision-part.svg');
  image.alt = project.image ? project.alt : 'Illustration de présentation — photo de réalisation à venir';
  image.loading = 'lazy';
  image.width = 850;
  image.height = 650;
  visual.append(image);
  if (!project.image) {
    const badge = document.createElement('span');
    badge.className = 'project-badge';
    badge.textContent = 'PHOTOS À VENIR';
    visual.append(badge);
  }
  const caption = document.createElement('div');
  caption.className = 'project-caption';
  const text = document.createElement('div');
  const category = document.createElement('span');
  category.textContent = project.category;
  const title = document.createElement('h3');
  title.textContent = project.title;
  text.append(category, title);
  const number = document.createElement('span');
  number.className = 'project-number';
  number.textContent = String(index + 1).padStart(2, '0');
  caption.append(text, number);
  article.append(visual, caption);
  gallery.append(article);
});
const caption = document.querySelector('.gallery-caption');
if (projects.every(project => project.image)) {
  caption.firstElementChild.innerHTML = '<span class="status-dot"></span> RÉALISATIONS NR MILLING';
  caption.lastElementChild.textContent = 'Conception & usinage sur mesure';
  document.querySelector('.projects-section .section-heading > p').textContent = 'Découvrez les projets qui prennent forme dans l’atelier. Chaque pièce raconte un besoin, un échange et un savoir-faire.';
}

const form = document.querySelector('#quote-form');
document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    const radio = Array.from(form.elements.service).find(input => input.value === link.dataset.service);
    if (radio) radio.checked = true;
  });
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = data.get('name').trim();
  const message = data.get('message').trim();
  if (!name || message.length < 10) {
    const input = !name ? form.elements.name : form.elements.message;
    input.setCustomValidity(!name ? 'Veuillez saisir votre nom.' : 'Décrivez votre projet en au moins 10 caractères.');
    input.reportValidity();
    input.addEventListener('input', () => input.setCustomValidity(''), { once: true });
    return;
  }
  const subject = `Demande de devis — ${data.get('service')} — ${name.replace(/[\r\n]/g, ' ')}`;
  const body = `Bonjour NR Milling,\n\nJe souhaite obtenir un devis pour mon projet.\n\nNom / entreprise : ${name}\nE-mail : ${data.get('email')}\nTéléphone : ${data.get('phone').trim() || 'Non renseigné'}\nPrestation : ${data.get('service')}\nQuantité : ${data.get('quantity')} pièce(s)\n\nMon projet :\n${message}\n\n[Je peux joindre mes plans, photos ou fichiers 3D à cet e-mail.]\n\nCordialement,\n${name}`;
  const gmail = `https://mail.google.com/mail/?${new URLSearchParams({ view: 'cm', fs: '1', to: 'nrmilling@gmail.com', su: subject, body })}`;
  const mailto = `mailto:nrmilling@gmail.com?${new URLSearchParams({ subject, body }).toString().replace(/\+/g, '%20')}`;
  window.open(gmail, '_blank', 'noopener,noreferrer');
  const result = document.querySelector('#form-result');
  result.replaceChildren();
  const text = document.createElement('p');
  text.textContent = 'Votre demande est prête. Vérifiez-la dans Gmail, ajoutez vos fichiers, puis cliquez sur « Envoyer ». Rien n’a encore été envoyé.';
  const gmailLink = document.createElement('a');
  gmailLink.href = gmail;
  gmailLink.target = '_blank';
  gmailLink.rel = 'noopener noreferrer';
  gmailLink.textContent = 'Ouvrir Gmail';
  const alternative = document.createElement('a');
  alternative.href = mailto;
  alternative.textContent = 'Utiliser mon application e-mail';
  result.append(text, gmailLink, alternative);
  result.hidden = false;
});
document.querySelector('#year').textContent = new Date().getFullYear();
const dialog = document.querySelector('#legal-dialog');
document.querySelector('#legal-open').addEventListener('click', () => dialog.showModal());
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });

// Load the decorative video only when motion and the connection allow it.
(() => {
  const hero = document.querySelector('.hero');
  const video = document.querySelector('.hero-video');
  const toggle = document.querySelector('.hero-video-toggle');
  const source = video.querySelector('source');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let userPaused = false;
  let failed = false;
  let loaded = false;
  let inView = hero.getBoundingClientRect().bottom > 0 && hero.getBoundingClientRect().top < innerHeight;

  function updateControl() {
    const paused = video.paused;
    toggle.setAttribute('aria-label', paused ? 'Lire la vidéo' : 'Mettre la vidéo en pause');
    toggle.querySelector('span').textContent = paused ? 'Lire' : 'Pause';
    toggle.querySelector('path').setAttribute('d', paused ? 'm8 5 11 7-11 7V5Z' : 'M9 5v14m6-14v14');
  }

  function usePoster() {
    video.pause();
    video.classList.remove('is-visible');
    toggle.hidden = true;
  }

  function synchronizePlayback() {
    if (failed || reducedMotion.matches || connection?.saveData) {
      usePoster();
      if (loaded) {
        source.removeAttribute('src');
        video.load();
        loaded = false;
      }
      return;
    }
    if (!inView || document.hidden || userPaused) {
      video.pause();
      return;
    }
    if (!loaded) {
      video.muted = true;
      source.src = source.dataset.src;
      video.load();
      loaded = true;
    }
    toggle.hidden = false;
    video.play().catch(() => {
      // An autoplay restriction leaves the image and a manual play button.
      updateControl();
    });
  }

  toggle.addEventListener('click', () => {
    userPaused = !video.paused;
    synchronizePlayback();
  });
  video.addEventListener('playing', () => { video.classList.add('is-visible'); updateControl(); });
  video.addEventListener('pause', updateControl);
  const handleError = () => { failed = true; usePoster(); };
  video.addEventListener('error', handleError);
  source.addEventListener('error', handleError);
  reducedMotion.addEventListener('change', synchronizePlayback);
  connection?.addEventListener('change', synchronizePlayback);
  document.addEventListener('visibilitychange', synchronizePlayback);
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    synchronizePlayback();
  }, { threshold: 0 }).observe(hero);
  synchronizePlayback();
})();
