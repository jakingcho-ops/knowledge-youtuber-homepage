const filterButtons = document.querySelectorAll('.filter-chip');
const videoCards = document.querySelectorAll('.video-card');
const emptyMessage = document.querySelector('.filter-empty');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;
    let visibleCount = 0;

    filterButtons.forEach(filterButton => {
      const selected = filterButton === button;
      filterButton.classList.toggle('active', selected);
      filterButton.setAttribute('aria-pressed', String(selected));
    });

    videoCards.forEach(card => {
      const visible = category === 'all' || card.dataset.category === category;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    emptyMessage.hidden = visibleCount > 0;
  });
});

const menuButton = document.querySelector('.nav-toggle');
const mobileNav = document.querySelector('.mobile-nav');

const currentPage = window.location.pathname.split('/').pop();
document.querySelectorAll('.desktop-nav a, .mobile-nav a').forEach(link => {
  const isCurrentPage = link.getAttribute('href') === currentPage;
  if (isCurrentPage) {
    link.setAttribute('aria-current', 'page');
  }
});

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  mobileNav.classList.toggle('open', open);
});

mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '메뉴 열기');
  });
});