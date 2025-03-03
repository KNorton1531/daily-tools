function togglePanel(event) {
  event.stopPropagation();
  const panel = document.getElementById('sidePanel');
  const buttonIcon = document.querySelector('.burger-menu span');

  panel.classList.toggle('open');

  if (panel.classList.contains('open')) {
    buttonIcon.textContent = 'close';
  } else {
    buttonIcon.textContent = 'menu';
  }
}

function closePanel(event) {
  const panel = document.getElementById('sidePanel');
  const buttonIcon = document.querySelector('.burger-menu span');

  if (panel.classList.contains('open') && !panel.contains(event.target)) {
    panel.classList.remove('open');
    buttonIcon.textContent = 'menu';
  }
}
