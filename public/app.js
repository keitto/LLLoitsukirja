/* eslint-disable no-undef */
const DATA_URL = './data/spells.json';

const el = {
  root: document.getElementById('root'),
  search: document.getElementById('search'),
  spellSchoolToggles: document.getElementById('spellSchoolToggles'),
  sort: document.getElementById('sort'),
  fontSize: document.getElementById('fontSize'),
  showHigher: document.getElementById('showHigher'),
  otsikkoFontti: document.getElementById('otsikkoFontti'),
  tekstiFontti: document.getElementById('tekstiFontti'),
  spellListItems: document.getElementById('spellListItems'),
};

const LYHENTEET = {
  "metriä": "m",
  "metri": "m",
  "minuuttia": "min",
  "minuutti": "min",
  "tuntia": "h",
  "tunti": "h",
};

const KOULUT = [
  { nimi_en: 'Abjuration',   nimi: 'Suojelus',      lyhyt: 'Suo', color_hsl: '210,100%,81%', border_svg: null, emoji: '🛡️' },
  { nimi_en: 'Conjuration',  nimi: 'Kutsuminen',    lyhyt: 'Kut', color_hsl: '120,100%,81%', border_svg: null, emoji: '🐺' },
  { nimi_en: 'Divination',   nimi: 'Ennustaminen',  lyhyt: 'Enn', color_hsl: '60,100%,81%',  border_svg: null, emoji: '👁️' },
  { nimi_en: 'Enchantment',  nimi: 'Lumoaminen',    lyhyt: 'Lum', color_hsl: '300,100%,81%', border_svg: null, emoji: '💖' },
  { nimi_en: 'Evocation',    nimi: 'Luominen',      lyhyt: 'Luo', color_hsl: '0,100%,81%',   border_svg: null, emoji: '🔥' },
  { nimi_en: 'Illusion',     nimi: 'Illuusio',      lyhyt: 'Ill', color_hsl: '270,100%,81%', border_svg: null, emoji: '🎭' },
  { nimi_en: 'Necromancy',   nimi: 'Kuolontaikuus', lyhyt: 'Kuo', color_hsl: '30,100%,81%',  border_svg: null, emoji: '💀' },
  { nimi_en: 'Transmutation',nimi: 'Muovaaminen',   lyhyt: 'Muo', color_hsl: '180,100%,81%', border_svg: null, emoji: '🔄' }
];
const KOULU_MAP = Object.fromEntries(KOULUT.map(k => [k.nimi.toLowerCase(), k.lyhyt]));

// ---- utilit ----
function lyhenna(str) {
  if (!str) return str;
  return str.split(/\s+/).map(w => LYHENTEET[w.toLowerCase()] ?? w).join(" ");
}
const normalize = s => (s || '').toString().toLowerCase();
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// ---- app state ----
let allSpells = [];
let drake = null; // dragula instance

// ---------------- Data ----------------
async function loadData() {
  const res = await fetch(DATA_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('spells.json ei löytynyt');
  const json = await res.json();
  return json.spells ?? [];
}

function filterSpells(spells) {
  const filteredBySchool = spells.filter(sp => {
    const koulu = sp.koulu?.toLowerCase() || '';
    for (const k of KOULUT) {
      if (k.nimi.toLowerCase() === koulu) {
        const checkbox = document.getElementById('show-' + k.lyhyt);
        if (checkbox && !checkbox.checked) return false;
      }
    }
    return true;
  });
  
  const q = normalize(el.search?.value);
  if (!q) return filteredBySchool;
  return filteredBySchool.filter(sp => {
    const hay = `${normalize(sp.nimi)} ${(sp.piiri ?? '')} ${normalize(sp.koulu)} ${normalize(sp.kuvaus)}`;
    return hay.includes(q);
  });

}
function sortSpells(spells) {
  const mode = el.sort?.value;
  if (mode === 'circle') {
    return [...spells].sort((a,b) => {
      const ca = a.piiri ?? 99, cb = b.piiri ?? 99;
      if (ca !== cb) return ca - cb;
      return a.nimi.localeCompare(b.nimi, 'fi');
    });
  }
  return [...spells].sort((a,b) => a.nimi.localeCompare(b.nimi, 'fi'));
}

// ---------------- Kortin renderöinti ----------------
function getKomponentitEmoji(sp) {
  if (!sp.komponentit) return '';
  return `${sp.komponentit.verbal ? '💬' : ''}${sp.komponentit.somatic ? '🙌' : ''}${sp.komponentit.material ? '🫚' : ''}`;
}
function addFact(dl, label, value) {
  if (!value) return;
  const dt = document.createElement('dt'); dt.textContent = label;
  const dd = document.createElement('dd'); dd.textContent = value;
  dl.append(dt, dd);
}
function renderCard(sp) {
  const card = document.createElement('article');
  card.className = 'card';
  card._spell = sp;
  if (sp.nimi) card.dataset.nimi = sp.nimi;
  if (sp.piiri !== undefined) card.dataset.piiri = sp.piiri;
  if (sp.koulu) card.classList.add('koulu-' + sp.koulu);
  if (sp.kesto) card.dataset.kesto = sp.kesto.toLowerCase().replace(/\s+/g, '-');
  const keskittyminen = sp.kesto?.toLowerCase().startsWith('keskittyminen');

  const header = document.createElement('header');
  header.className = 'card__header';
  const mutkaPiiri = `<div class="mutkaPiiri"><span>P</span><span>I</span><span>I</span><span>R</span><span>I</span></div>`;
  header.innerHTML = `
    <div class="title">${escapeHtml(sp.nimi || '')}</div>
    <div class="titlePiiri">
      ${Number.isInteger(sp.piiri)
        ? (sp.piiri === 0 ? "<span class='konstiSmaller'>taika konsti</span>" : sp.piiri)
        : "?"}
    </div>
    <div class="meta">
      ${sp.koulu ? `<span class="pill">${escapeHtml(capitalize(sp.koulu))}</span>` : ''}
      ${keskittyminen ? `<span class="pill pill--keskittyminen">Keskittyminen</span>` : ''}
      ${sp.rituaali ? `<span class="pill pill--rituaali">Rituaali</span>` : ''}
    </div>
  `;

  const body = document.createElement('div');
  body.className = 'card__body';
  body.innerHTML = marked.parse((sp.kuvaus || '').trim());

  const meta = document.createElement('dl');
  meta.className = 'card__facts';
  addFact(meta, 'Viive',   lyhenna(sp.loitsimisviive));
  addFact(meta, 'Kantama', lyhenna(sp.kantama));
  if (sp.komponentit) {
    addFact(meta, 'Komponentit', getKomponentitEmoji(sp) || null);
    if (sp.komponentit.material_text) addFact(meta, 'Materiaalit', sp.komponentit.material_text);
  }
  addFact(meta, 'Kesto', sp.kesto);

  card.append(header, meta, body);
  return card;
}

// ---------------- A4-pohja ja vyöhykkeet ----------------
function buildA4Sheet() {
  const sheet = document.createElement('section');
  sheet.className = 'sheetA4';

  // Uusi sivu, poista sivu kontrollit
  const ctrls = document.createElement('div');
  ctrls.className = 'pageControls';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'pageAddBtn';
  addBtn.title = 'Lisää uusi sivu tämän jälkeen';
  addBtn.textContent = '+';
  addBtn.dataset.action = 'add-page-after';

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'pageDelBtn';
  delBtn.title = 'Poista tämä tyhjä sivu';
  delBtn.textContent = '✕';
  delBtn.dataset.action = 'delete-page';

  ctrls.append(addBtn, delBtn);
  sheet.appendChild(ctrls);

  // vasen ja oikea puoli A4:stä
  sheet.appendChild(buildHalf('left'));
  sheet.appendChild(buildHalf('right'));

  return sheet;
}

/**
 *  Tämä on vaakasuuntaisen A4:n puolikas, jossa 2x2 slottia joihin 
 *  saa jokaiseen pienen loitsun, tai niitä voi käyttää enemmän isolle
 *  loitsulle.
 * 
 * @param {*} side 
 * @returns 
 */
function buildHalf(side) {
  const half = document.createElement('div');
  half.className = 'half';
  half.dataset.side = side;

  // 2×2 slotit
  for (let r = 1; r <= 2; r++) {
    for (let c = 1; c <= 2; c++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.type = 'slot';
      slot.dataset.r = String(r);
      slot.dataset.c = String(c);
      slot.style.setProperty('--r', r);
      slot.style.setProperty('--c', c);
      half.appendChild(slot);
    }
  }

  // Tekee erikoisemmat dropzonet
  const mkDZ = (cls, type, extra) => {
    const dz = document.createElement('div');
    dz.className = `dz ${cls}`;
    dz.dataset.type = type;
    Object.entries(extra || {}).forEach(([k,v]) => dz.dataset[k]=v);
    return dz;
  };

  // Erikoiset dropzonet, jotka on slottien välissä
  half.appendChild(mkDZ('dz-row top',    'row',  { pos: 'top' }));
  half.appendChild(mkDZ('dz-row bottom', 'row',  { pos: 'bottom' }));
  half.appendChild(mkDZ('dz-col left',   'col',  { pos: 'left' }));
  half.appendChild(mkDZ('dz-col right',  'col',  { pos: 'right' }));
  half.appendChild(mkDZ('dz-quad center','quad', {}));

  return half;
}

// Solu-alueiden laskenta & päällekkäisten blokkien korvaus
function cellsFor(kind, meta) {
  if (kind === 'slot') return [{ r: meta.r, c: meta.c }];
  if (kind === 'row')  return meta.pos === 'top'
    ? [{r:1,c:1},{r:1,c:2}] : [{r:2,c:1},{r:2,c:2}];
  if (kind === 'col')  return meta.pos === 'left'
    ? [{r:1,c:1},{r:2,c:1}] : [{r:1,c:2},{r:2,c:2}];
  return [{r:1,c:1},{r:1,c:2},{r:2,c:1},{r:2,c:2}]; // quad
}
const packCells   = arr => arr.map(({r,c}) => `${r},${c}`).join(';');
const unpackCells = str => (str||'').split(';').filter(Boolean)
                      .map(s => { const [r,c]=s.split(',').map(Number); return {r,c}; });
const overlaps = (a, b) => {
  const set = new Set(a.map(({r,c}) => `${r},${c}`));
  return b.some(({r,c}) => set.has(`${r},${c}`));
};

function halfUsedCellsSet(halfEl) {
  const set = new Set();
  halfEl.querySelectorAll('.block').forEach(bl => {
    unpackCells(bl.dataset.cells).forEach(({r,c}) => set.add(`${r},${c}`));
  });
  return set;
}
function isCellsFree(halfEl, cells) {
  const used = halfUsedCellsSet(halfEl);
  return !cells.some(({r,c}) => used.has(`${r},${c}`));
}
function firstFitForKind(halfEl, kind) {
  if (kind === 'slot') {
    const order = [{r:1,c:1},{r:1,c:2},{r:2,c:1},{r:2,c:2}];
    for (const meta of order) {
      if (isCellsFree(halfEl, cellsFor('slot', meta))) return { kind:'slot', meta };
    }
  } else if (kind === 'row') {
    for (const meta of [{pos:'top'},{pos:'bottom'}]) {
      if (isCellsFree(halfEl, cellsFor('row', meta))) return { kind:'row', meta };
    }
  } else if (kind === 'col') {
    for (const meta of [{pos:'left'},{pos:'right'}]) {
      if (isCellsFree(halfEl, cellsFor('col', meta))) return { kind:'col', meta };
    }
  } else if (kind === 'quad') {
    const meta = {};
    if (isCellsFree(halfEl, cellsFor('quad', meta))) return { kind:'quad', meta };
  }
  return null;
}
function blockKindFromEl(block) {
  if (block.classList.contains('block--slot')) return { kind:'slot' };
  if (block.classList.contains('block--row'))  return { kind:'row'  };
  if (block.classList.contains('block--col'))  return { kind:'col'  };
  return { kind:'quad' };
}

// Luo/siirrä blokki johon sijoitetaan kortti
function placeBlock(halfEl, kind, meta, spellOrExistingBlock) {
  const newCells = cellsFor(kind, meta);

  // poista kaikki blokit, jotka peittävät samoja soluja
  halfEl.querySelectorAll('.block').forEach(bl => {
    const cells = unpackCells(bl.dataset.cells);
    if (overlaps(cells, newCells)) bl.remove();
  });

  let block, card;
  if (spellOrExistingBlock instanceof HTMLElement && spellOrExistingBlock.classList.contains('block')) {
    // siirretään olemassa olevaa blokkia
    block = spellOrExistingBlock;
    card  = block.querySelector('.card');
  } else {
    // luodaan uusi
    const sp = spellOrExistingBlock;
    card = renderCard(sp);
    block = document.createElement('div');
    block.className = 'block';
    block.appendChild(card);
  }

  // luokitus & dataset sijoitusta varten
  block.dataset.cells = packCells(newCells);
  block.classList.remove('block--slot','block--row','block--col','block--quad','top','bottom','left','right');
  switch (kind) {
    case 'slot':
      block.classList.add('block--slot');
      block.style.setProperty('--r', meta.r);
      block.style.setProperty('--c', meta.c);
      break;
    case 'row':
      block.classList.add('block--row', meta.pos);
      block.style.removeProperty('--r'); block.style.removeProperty('--c');
      break;
    case 'col':
      block.classList.add('block--col', meta.pos);
      block.style.removeProperty('--r'); block.style.removeProperty('--c');
      break;
    case 'quad':
      block.classList.add('block--quad');
      block.style.removeProperty('--r'); block.style.removeProperty('--c');
      break;
  }

  // siirrä (tai lisää) blokki halfiin
  halfEl.appendChild(block);
  return block;
}

// ---------------- Sidebarin loitsut ----------------
function renderSidebar(spells) {
  const list = el.spellListItems;
  list.innerHTML = '';
  spells.forEach((sp, idx) => {
    const row = document.createElement('div');
    row.className = 'sidebar__item';
    //row.className = `sidebar__item koulu-${sp.koulu?.toLowerCase() || 'unknown'}`;
    row.dataset.kind = 'spell-source';
    row.dataset.spellIndex = String(idx);
    row.dataset.spellName = sp.nimi || '';
    const kouluShort = KOULU_MAP[sp.koulu?.toLowerCase()] ?? '';
    const piiri = Number.isInteger(sp.piiri) ? sp.piiri : '–';
    //row.textContent = `${sp.nimi} (${piiri} ${kouluShort})`;
    //      <span class="sidebar__item-meta koulu-${sp.koulu}">(${piiri} ${kouluShort})</span>

    row.innerHTML = `
      <span class="sidebar__item-name">${sp.nimi}</span>
      <span class="sidebar__item-meta bg-${sp.koulu?.toLowerCase() || 'unknown'}">${piiri} ${kouluShort}</span>
    `;
    
    list.appendChild(row);
  });
}

// ---------------- Sivuoperaatiot ----------------
function getSheets() {
  return Array.from(el.root.querySelectorAll('.sheetA4'));
}
function isSheetEmpty(sheet) {
  return sheet.querySelectorAll('.block').length === 0;
}
function updatePageControlVisibility() {
  const sheets = getSheets();
  sheets.forEach((sheet, i) => {
    const delBtn = sheet.querySelector('.pageDelBtn');
    if (!delBtn) return;
    const canDelete = i > 0 && isSheetEmpty(sheet);
    delBtn.style.display = canDelete ? '' : 'none';
  });
}
function createAddPageSentinel() {
  // siivoa vanha
  el.root.querySelectorAll('.addPageSentinel').forEach(n => n.remove());
  const sent = document.createElement('div');
  sent.className = 'addPageSentinel';
  sent.dataset.type = 'add-page';
  //sent.textContent = 'Uusi sivu'; // olkoon näkymätön, joko käyttäjä keksii tai painaa lisäysnappulaa
  el.root.appendChild(sent);
}
function addSheetAfter(targetSheet = null) {
  const newSheet = buildA4Sheet();
  if (targetSheet && targetSheet.parentElement === el.root) {
    targetSheet.after(newSheet);
  } else {
    el.root.appendChild(newSheet);
  }
  createAddPageSentinel();
  setupDragula(); // uudelleenrekisteröi alueet
  updatePageControlVisibility();
  return newSheet;
}
function removeSheet(sheet) {
  if (!sheet) return;
  const sheets = getSheets();
  const idx = sheets.indexOf(sheet);
  if (idx <= 0) return;
  if (!isSheetEmpty(sheet)) return;
  sheet.remove();
  createAddPageSentinel();
  setupDragula();
  updatePageControlVisibility();
}

// ---------------- Dragula ----------------
function dropInfoFromEl(t) {
  if (!t) return null;
  if (t.dataset && t.dataset.type === 'add-page') return { kind: 'add-page', meta: {}, sentinel: t };
  const halfEl = t.closest?.('.half');
  if (!halfEl) return null;

  const type = t.dataset.type || (t.classList.contains('slot') ? 'slot' : '');
  if (type === 'slot') {
    return { kind: 'slot', meta: { r: Number(t.dataset.r), c: Number(t.dataset.c) }, halfEl };
  }
  if (type === 'row')  return { kind: 'row',  meta: { pos: t.dataset.pos }, halfEl };
  if (type === 'col')  return { kind: 'col',  meta: { pos: t.dataset.pos }, halfEl };
  if (type === 'quad') return { kind: 'quad', meta: {}, halfEl };
  return null;
}

// Palauttaa loitsu-datan nimen tai indeksin perusteella
function findSpellByDragEl(dragEl) {
  // 1) jos .block → kortista löytyy _spell
  if (dragEl.classList.contains('block')) {
    const card = dragEl.querySelector('.card');
    return card?._spell || null;
  }
  // 2) sivupalkin lähde
  if (dragEl.dataset.kind === 'spell-source') {
    const name = dragEl.dataset.spellName || '';
    return allSpells.find(s => s.nimi === name) || null;
  }
  return null;
}

function setupDragula() {
  // siivoa vanha instanssi
  if (drake) {
    try { drake.destroy(); } catch(e) {}
    drake = null;
  }

  const containers = [];
  if (el.spellListItems) containers.push(el.spellListItems);

  // lähde-kontit (tärkeä Firefoxille)
  el.root.querySelectorAll('.sheetA4 .half').forEach(n => containers.push(n));
  // kohdevyöhykkeet
  el.root.querySelectorAll('.sheetA4 .slot, .sheetA4 .dz').forEach(n => containers.push(n));
  // lisäyssentinel
  el.root.querySelectorAll('.addPageSentinel').forEach(n => containers.push(n));

  drake = dragula(containers, {
    mirrorContainer: document.body,
    ignoreInputTextSelection: true,
    revertOnSpill: true,
    removeOnSpill: false,

    copy: (elDragged, source) => source === el.spellListItems,

    moves: (elDragged) =>
      elDragged.classList.contains('sidebar__item') ||
      elDragged.classList.contains('block'),

    // hyväksy myös sentinel (add-page)
    accepts: (elDragged, target /*, source, sibling */) => {
      if (!target) return false;
      if (target.dataset && target.dataset.type === 'add-page') return true;
      return !!dropInfoFromEl(target);
    },
  });

  // visuaalinen tila
  drake.on('drag',    () => document.body.classList.add('dragging'));
  drake.on('cancel',  () => document.body.classList.remove('dragging'));
  drake.on('dragend', () => {
    document.body.classList.remove('dragging');
    updatePageControlVisibility();
  });

  // varsinainen pudotuslogiikka
  drake.on('drop', (elDragged, target, source /* , sibling */) => {
    if (!target) return;

    // 1) Pudotus sentinel-alueelle → luo sivu ja sijoita siihen
    if (target.dataset && target.dataset.type === 'add-page') {
      const newSheet = addSheetAfter(getSheets().at(-1) || null);
      const leftHalf = newSheet.querySelector('.half[data-side="left"]');

      if (source === el.spellListItems) {
        const sp = findSpellByDragEl(elDragged);
        // oletus: slot 1,1 on vapaa uudella sivulla
        if (sp) placeBlock(leftHalf, 'slot', { r:1, c:1 }, sp);
        // poista Dragulan lisäämä “peilikopio” jos se jäi
        if (elDragged && elDragged.parentElement === target) target.removeChild(elDragged);
      } else {
        const block = elDragged.classList.contains('block') ? elDragged : elDragged.closest('.block');
        if (block) {
          const kindObj = blockKindFromEl(block);
          // koita first fit uudelle sivulle
          const fit = firstFitForKind(leftHalf, kindObj.kind) || { kind:'slot', meta:{r:1,c:1} };
          placeBlock(leftHalf, fit.kind, fit.meta, block);
        }
        if (elDragged && elDragged.isConnected && elDragged.parentElement === target) {
          try { elDragged.remove(); } catch(_) {}
        }
      }

      updatePageControlVisibility();
      return;
    }

    // 2) Normaali pudotus slottiin / dz:aan
    const info = dropInfoFromEl(target);
    if (!info) return;

    let placedBlock = null;

    if (source === el.spellListItems) {
      // UUSI kortti sivupalkista
      const sp = findSpellByDragEl(elDragged);
      if (sp) placedBlock = placeBlock(info.halfEl, info.kind, info.meta, sp);

      // dragula pudotti "peilikopion" targetiin → poista se
      if (elDragged && elDragged.parentElement === target) {
        target.removeChild(elDragged);
      }
    } else {
      // OLEMASSA OLEVAN blokin siirto
      const block = elDragged.classList.contains('block') ? elDragged : elDragged.closest('.block');
      if (block) {
        placedBlock = placeBlock(info.halfEl, info.kind, info.meta, block);
      }

      // jos dragula ehti siirtää DOMissa "väärään paikkaan", poista väliaikainen
      if (elDragged && elDragged !== placedBlock && elDragged.isConnected) {
        try { elDragged.remove(); } catch (_) {}
      }
    }

    // siivoa hoverit ja päivitä poistonapit
    document.querySelectorAll('.drop-hover').forEach(n => n.classList.remove('drop-hover'));
    updatePageControlVisibility();
  });

  // hover-korostus (myös sentinelille)
  drake.on('over', (elDragged, container) => {
    const isSentinel = container?.dataset?.type === 'add-page';
    if (isSentinel) container.classList.add('drop-hover');
    else {
      const info = dropInfoFromEl(container);
      if (info && info.kind !== 'add-page') container.classList.add('drop-hover');
    }
  });
  drake.on('out', (elDragged, container) => {
    if (container) container.classList.remove('drop-hover');
  });
}

// ---------------- Workbench ----------------
function renderWorkbench({ rebuildSheet = false } = {}) {
  const filtered = filterSpells(sortSpells(allSpells));
  renderSidebar(filtered);

  // Alussa: jos ei ole yhtään sivua, lisää ensimmäinen
  const hasSheet = !!el.root.querySelector('.sheetA4');
  if (rebuildSheet || !hasSheet) {
    el.root.innerHTML = '';
    const sheet = buildA4Sheet();
    el.root.appendChild(sheet);
    createAddPageSentinel();
    setupDragula();
    updatePageControlVisibility();
  } else {
    // päivitys vain kontrollien/sentinelin osalta
    createAddPageSentinel();
    setupDragula();
    updatePageControlVisibility();
  }
}

// ---------------- sivun lisäys- ja poistonapit ----------------
el.root.addEventListener('click', (e) => {
  const addBtn = e.target.closest('[data-action="add-page-after"]');
  if (addBtn) {
    const sheet = addBtn.closest('.sheetA4');
    addSheetAfter(sheet);
    e.preventDefault();
    return;
  }
  const delBtn = e.target.closest('[data-action="delete-page"]');
  if (delBtn) {
    const sheet = delBtn.closest('.sheetA4');
    if (isSheetEmpty(sheet)) removeSheet(sheet);
    e.preventDefault();
  }
});

// ---------------- Init ----------------
(async function initWorkbench() {
  try {
    allSpells = await loadData();
  } catch (e) {
    console.error(e);
    el.root.textContent = 'Virhe: spells.json ei latautunut.';
    return;
  }
  // fonttikoko
  el.fontSize?.addEventListener('input', (e) => {
    const v = e.target.value;
    document.documentElement.style.setProperty('--body-font-size', v + 'px');
  });
  // otsikon fontti
  el.otsikkoFontti?.addEventListener('change', (e) => {
    const v = e.target.value;
    document.documentElement.style.setProperty('--title-font', v);
  });
  // tekstin fontti
  el.tekstiFontti?.addEventListener('change', (e) => {
    const v = e.target.value;
    document.documentElement.style.setProperty('--font', v);
  });
  // hakukenttä: rajaa sidebarin listaa
  el.search?.addEventListener('input', () => {
    const filtered = filterSpells(sortSpells(allSpells));
    renderSidebar(filtered);
  });
  // koulu-suodattimet: shift-click piilottaa muut kuin klikatin
  el.spellSchoolToggles?.addEventListener('click', (e) => {
    const clickedCheckbox = e.target.closest?.('input[type="checkbox"]');
    const clickedLabel = e.target.closest?.('label');
    const checkbox = clickedCheckbox || clickedLabel?.control;
    if (!checkbox || !e.shiftKey) return;

    e.preventDefault();
    el.spellSchoolToggles.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = cb === checkbox;
    });

    const filtered = filterSpells(sortSpells(allSpells));
    renderSidebar(filtered);
  });
  el.spellSchoolToggles?.addEventListener('change', (e) => {
    if (e.target?.type !== 'checkbox') return;
    const filtered = filterSpells(sortSpells(allSpells));
    renderSidebar(filtered);
  });
  // sorttaus: järjestää vain sidebarin listaa
  el.sort?.addEventListener('change', () => {
    const filtered = filterSpells(sortSpells(allSpells));
    renderSidebar(filtered);
  });


  renderWorkbench({ rebuildSheet: true });
})();
