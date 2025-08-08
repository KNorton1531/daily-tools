import { googleLogin, onAuth, auth } from './firebaseAuth.js';
import { saveCountdown, loadCountdowns, deleteCountdownById } from './countdown-db.js';

/* ---------- State ---------- */
const BUILT_INS = [
  { label: "Spring",    date: "03-01T00:00:00", annual: true, category: "Seasonal" },
  { label: "Summer",    date: "06-01T00:00:00", annual: true, category: "Seasonal" },
  { label: "Autumn",    date: "09-01T00:00:00", annual: true, category: "Seasonal" },
  { label: "Winter",    date: "12-01T00:00:00", annual: true, category: "Seasonal" },
  { label: "Christmas", date: "12-25T00:00:00", annual: true, category: "Holidays" },
  { label: "Halloween", date: "10-31T00:00:00", annual: true, category: "Holidays" },
];

const ADMIN_UID = "GUOg1pBxNnPZyeLCM4zHAV4Vx4C3";

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const refs = {
  pageRoot: $('#pageRoot'),
  categoriesSection: $('#categoriesSection'),
  favoritesWrap: $('#favoritesWrap'),
  favEmpty: $('#favEmpty'),
  favMeta: $('#favMeta'),
  favSortLabel: $('#favSortLabel'),
  btnFavSort: $('#btnFavSort'),
  btnAdmin: $('#btnAdmin'),
  adminPanel: $('#adminPanel'),
  adminForm: $('#adminForm'),
  fLabel: $('#fLabel'),
  fDate: $('#fDate'),
  fTime: $('#fTime'),
  fCategory: $('#fCategory'),
  fAnnual: $('#fAnnual'),
  btnCompact: $('#btnCompact'),
  btnSpacious: $('#btnSpacious'),
  searchInput: $('#searchInput'),
  categoryFilter: $('#categoryFilter'),
  tplCard: $('#countdownTemplate'),
  dlg: $('#actionsDialog'),
  dlgLabel: $('#dialogLabel'),
  dlgFavToggle: $('#btnFavToggle'),
  dlgDelete: $('#btnDelete'),
};

const LS_KEYS = {
  favorites: 'countdown_favorites_v2',
  layout: 'countdown_layout',
  favSortAsc: 'countdown_fav_sort_asc',
  filterText: 'countdown_filter_text',
  filterCategory: 'countdown_filter_cat',
};

let allCountdowns = [];       // normalized
let userDocs = [];            // firestore docs
let favorites = loadFavoritesFromStorage(); // array of keys
let favSortAsc = loadBoolean(LS_KEYS.favSortAsc, true);
let layout = loadLayout();
let filterText = localStorage.getItem(LS_KEYS.filterText) || '';
let filterCategory = localStorage.getItem(LS_KEYS.filterCategory) || 'all';
let ticking = null;
let lastTick = 0;

/* ---------- Boot ---------- */
init();

function init(){
  refs.btnCompact.addEventListener('click', () => setLayout('compact'));
  refs.btnSpacious.addEventListener('click', () => setLayout('spacious'));
  setLayout(layout);

  refs.btnFavSort.addEventListener('click', () => {
    favSortAsc = !favSortAsc;
    localStorage.setItem(LS_KEYS.favSortAsc, JSON.stringify(favSortAsc));
    refs.favSortLabel.textContent = favSortAsc ? 'Closest first' : 'Furthest first';
    render();
  });

  refs.searchInput.value = filterText;
  refs.searchInput.addEventListener('input', evt => {
    filterText = evt.currentTarget.value.trim().toLowerCase();
    localStorage.setItem(LS_KEYS.filterText, filterText);
    render();
  });

  refs.categoryFilter.value = filterCategory;
  refs.categoryFilter.addEventListener('change', evt => {
    filterCategory = evt.currentTarget.value;
    localStorage.setItem(LS_KEYS.filterCategory, filterCategory);
    render();
  });

  refs.btnAdmin.addEventListener('click', onAdminButton);
  refs.adminForm.addEventListener('submit', onAdminSubmit);

  refs.dlg.addEventListener('close', () => {
    refs.dlgDelete.hidden = true;
  });

  onAuth(async (user) => {
    const isAdmin = !!user && user.uid === ADMIN_UID;
    refs.btnAdmin.querySelector('.material-symbols-outlined').textContent = isAdmin ? 'add' : 'admin_panel_settings';
    refs.btnAdmin.lastChild.nodeValue = isAdmin ? ' Custom' : ' Admin';
    refs.adminPanel.hidden = !isAdmin;

    await hydrateCountdowns();
    render();
  });

  // Initial fetch before auth if needed
  hydrateCountdowns().then(() => {
    render();
  });

  startTicker();
}

/* ---------- Data ---------- */
function normalizeCountdown(entry){
  const key = entry.key ?? makeKey(entry.label, entry.date, entry.annual);
  const category = entry.category || 'Misc';
  return {
    key,
    label: entry.label,
    category,
    annual: !!entry.annual,
    dateISO: normalizeDateISO(entry.date),
    ownedId: entry.id || null,
  };
}

function makeKey(label, dateStr, annual){
  const base = label.trim().toLowerCase().replace(/\s+/g,'-').slice(0,60);
  const suffix = annual ? 'annual' : (dateStr || 'oneday');
  return `${base}__${suffix}`;
}

function normalizeDateISO(dateStr){
  if (!dateStr) return null;
  // Accept "MM-DDThh:mm:ss" for annuals or full "YYYY-MM-DDThh:mm"
  const hasYear = /^\d{4}-/.test(dateStr);
  if (hasYear) return dateStr;
  const now = new Date();
  return `${now.getFullYear()}-${dateStr}`;
}

function nextTargetDate(cd){
  const now = new Date();
  let d = new Date(cd.dateISO);
  if (cd.annual){
    const month = d.getMonth();
    const date = d.getDate();
    const time = d.toTimeString().split(' ')[0];
    let candidate = new Date(`${now.getFullYear()}-${String(month+1).padStart(2,'0')}-${String(date).padStart(2,'0')}T${time}`);
    if (candidate < now) candidate.setFullYear(candidate.getFullYear()+1);
    return candidate;
  }
  return d;
}

function msBreakdown(toDate, compact){
  const now = new Date();
  const diff = toDate - now;
  if (diff <= 0) return null;
  const days = compact ? Math.ceil(diff/86400000) : Math.floor(diff/86400000);
  const hours = Math.floor((diff % 86400000)/3600000);
  const mins = Math.floor((diff % 3600000)/60000);
  return {diff, days, hours, mins};
}

function formatDateForUI(d){
  const day = d.getDate();
  const m = d.toLocaleString('en-GB',{month:'short'});
  const y = d.getFullYear();
  const nth = (n)=> (n>3 && n<21) ? 'th' : ['th','st','nd','rd'][Math.min(n%10,3)];
  return `${day}${nth(day)} ${m} ${y}`;
}

async function hydrateCountdowns(){
  const docs = await loadCountdowns();
  userDocs = docs;
  const merged = [
    ...BUILT_INS,
    ...docs.map(d => ({ label:d.label, date:`${d.date}T${(d.time && d.time.trim())?d.time:'00:00'}`, annual:!!d.annual, category:d.category, id:d.id })),
  ].map(normalizeCountdown);

  allCountdowns = dedupeByKey(merged);
  migrateFavoritesIfNeeded(); // one-off migration from old schema
}

/* ---------- Favorites ---------- */
function loadFavoritesFromStorage(){
  try{
    const raw = localStorage.getItem(LS_KEYS.favorites);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  }catch{ return []; }
}

function saveFavorites(){
  localStorage.setItem(LS_KEYS.favorites, JSON.stringify(favorites));
}

function migrateFavoritesIfNeeded(){
  // Old storage was an array of titles
  try{
    const legacy = JSON.parse(localStorage.getItem('favorites') || 'null');
    if (!legacy || !Array.isArray(legacy) || legacy.length === 0) return;
    const keys = [];
    for (const title of legacy){
      const match = allCountdowns.find(c => c.label === title);
      if (match) keys.push(match.key);
    }
    if (keys.length){
      favorites = Array.from(new Set([...favorites, ...keys]));
      saveFavorites();
    }
    localStorage.removeItem('favorites');
    localStorage.removeItem('favoritesSorting');
    localStorage.removeItem('isGridView');
  }catch{ /* ignore */ }
}

function toggleFavorite(key){
  const i = favorites.indexOf(key);
  if (i === -1) favorites.push(key);
  else favorites.splice(i,1);
  saveFavorites();
  render();
}

/* ---------- Layout ---------- */
function setLayout(next){
  layout = next;
  localStorage.setItem(LS_KEYS.layout, next);
  refs.btnCompact.classList.toggle('active', next === 'compact');
  refs.btnSpacious.classList.toggle('active', next === 'spacious');
  render();
}
function loadLayout(){
  const saved = localStorage.getItem(LS_KEYS.layout);
  return saved === 'spacious' ? 'spacious' : 'compact';
}

/* ---------- Rendering ---------- */
function render(){
  const compact = layout === 'compact';

  const categoryMap = groupByCategory(filterCountdowns(allCountdowns, filterText, filterCategory));
  const favSet = new Set(favorites);

  renderFavorites(compact, favSet);
  renderCategories(categoryMap, compact, favSet);

  refs.favSortLabel.textContent = favSortAsc ? 'Closest first' : 'Furthest first';
}

function filterCountdowns(list, text, cat){
  const t = text.trim().toLowerCase();
  return list.filter(c => {
    const txtOk = !t || c.label.toLowerCase().includes(t);
    const catOk = cat === 'all' || c.category === cat;
    return txtOk && catOk;
  });
}

function groupByCategory(list){
  const map = new Map();
  for (const c of list){
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category).push(c);
  }
  return map;
}

function renderFavorites(compact, favSet){
  refs.favoritesWrap.classList.toggle('compact', compact);
  refs.favoritesWrap.classList.toggle('spacious', !compact);
  refs.favoritesWrap.classList.add('wrap');

  const favs = allCountdowns.filter(c => favSet.has(c.key));
  const enriched = favs.map(c => ({ cd:c, target: nextTargetDate(c) }))
                       .filter(x => x.target && x.target > new Date())
                       .map(x => ({ ...x, parts: msBreakdown(x.target, compact) }))
                       .filter(x => x.parts);

  enriched.sort((a,b) => favSortAsc ? a.parts.diff - b.parts.diff : b.parts.diff - a.parts.diff);

  refs.favoritesWrap.replaceChildren(...enriched.map(x => createCard(x.cd, x.parts, x.target, { inFavorites:true, compact })));

  refs.favEmpty.hidden = enriched.length > 0;
  refs.favMeta.textContent = enriched.length ? `${enriched.length} saved` : 'No favorites yet';
}

function renderCategories(categoryMap, compact, favSet){
  const frag = document.createDocumentFragment();
  for (const [cat, list] of categoryMap){
    const wrap = document.createElement('section');
    wrap.className = 'category';
    wrap.innerHTML = `<div class="category-header"><h2>${cat}</h2></div>`;
    const grid = document.createElement('div');
    grid.className = 'wrap ' + (compact ? 'compact':'spacious');

    // Exclude ones that are in favorites? Keep them visible but fine to duplicate?
    for (const c of list){
      const target = nextTargetDate(c);
      const parts = target ? msBreakdown(target, compact) : null;
      grid.appendChild(createCard(c, parts, target, { inFavorites: favSet.has(c.key), compact }));
    }
    wrap.appendChild(grid);
    frag.appendChild(wrap);
  }
  refs.categoriesSection.replaceChildren(frag);
}

function createCard(cd, parts, targetDate, opts){
  const node = refs.tplCard.content.firstElementChild.cloneNode(true);
  node.dataset.key = cd.key;
  node.dataset.ownedId = cd.ownedId || '';
  node.querySelector('.card-title').textContent = cd.label;

  const dEl = node.querySelector('[data-part="days"]');
  const hEl = node.querySelector('[data-part="hours"]');
  const mEl = node.querySelector('[data-part="minutes"]');
  const dateEl = node.querySelector('[data-part="date"]');

  if (parts){
    dEl.textContent = parts.days;
    hEl.textContent = parts.hours;
    mEl.textContent = parts.mins;
    dateEl.textContent = formatDateForUI(targetDate);
  } else {
    dEl.textContent = '—';
    hEl.textContent = '—';
    mEl.textContent = '—';
    dateEl.textContent = 'Ended';
    node.classList.add('ended');
  }

  const deleteBtn = node.querySelector('.delete-btn');
  if (cd.ownedId) {
    onAuth(user => {
      const isAdmin = !!user && user.uid === ADMIN_UID;
      deleteBtn.hidden = !isAdmin;
    });
  }

  node.addEventListener('click', (e) => openActionsDialog(cd));
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openActionsDialog(cd);
    }
  });

  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!cd.ownedId) return;
    if (!confirm(`Delete "${cd.label}"?`)) return;
    await deleteCountdownById(cd.ownedId);
    await hydrateCountdowns();
    render();
  });

  return node;
}

/* ---------- Dialog ---------- */
function openActionsDialog(cd){
  const isFav = favorites.includes(cd.key);
  refs.dlgLabel.textContent = cd.label;
  refs.dlgFavToggle.textContent = isFav ? 'Remove from Favorites' : 'Add to Favorites';
  refs.dlgFavToggle.onclick = () => { toggleFavorite(cd.key); refs.dlg.close(); };
  refs.dlgDelete.hidden = !cd.ownedId;
  refs.dlgDelete.onclick = async () => {
    if (!cd.ownedId) return;
    if (!confirm(`Delete "${cd.label}"?`)) return;
    await deleteCountdownById(cd.ownedId);
    await hydrateCountdowns();
    render();
    refs.dlg.close();
  };
  refs.dlg.showModal();
}

/* ---------- Admin ---------- */
async function onAdminButton(){
  const user = auth.currentUser;
  if (!user){
    try { await googleLogin(); }
    catch { /* ignore */ }
    return;
  }
  const isAdmin = user.uid === ADMIN_UID;
  if (!isAdmin) return;
  refs.adminPanel.hidden = !refs.adminPanel.hidden;
  if (!refs.adminPanel.hidden) $('#fLabel').focus();
}

async function onAdminSubmit(e){
  e.preventDefault();
  const user = auth.currentUser;
  if (!user || user.uid !== ADMIN_UID) return;

  const data = {
    label: refs.fLabel.value.trim(),
    date: refs.fDate.value,
    time: refs.fTime.value || '00:00',
    category: refs.fCategory.value || 'Misc',
    annual: !!refs.fAnnual.checked,
  };
  if (!data.label || !data.date) return;

  await saveCountdown(data);
  refs.adminForm.reset();
  refs.adminPanel.hidden = true;

  await hydrateCountdowns();
  render();
}

/* ---------- Ticker ---------- */
function startTicker(){
  if (ticking) clearInterval(ticking);
  ticking = setInterval(() => {
    const now = Date.now();
    if (now - lastTick < 30_000) return; // throttle updates
    lastTick = now;
    render();
  }, 30_000);
}

/* ---------- Utils ---------- */
function dedupeByKey(list){
  const map = new Map();
  for (const item of list) {
    map.set(item.key, item);
  }
  return Array.from(map.values());
}
function loadBoolean(key, def){
  try{ const v = JSON.parse(localStorage.getItem(key) || 'null'); return typeof v === 'boolean' ? v : def; }catch{ return def; }
}
