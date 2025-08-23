function togglePanel(event) {
  event.stopPropagation();
  const panel = document.getElementById('sidePanel');
  const buttonIcon = document.querySelector('.burger-menu span');

  panel.classList.toggle('open');
  const isOpen = panel.classList.contains('open');
  document.body.classList.toggle('nav-open', isOpen);

  buttonIcon.textContent = isOpen ? 'close' : 'menu';
}

function closePanel(event) {
  const panel = document.getElementById('sidePanel');
  const buttonIcon = document.querySelector('.burger-menu span');

  if (panel.classList.contains('open') && !panel.contains(event.target)) {
    panel.classList.remove('open');
    document.body.classList.remove('nav-open');
    buttonIcon.textContent = 'menu';
  }
}
