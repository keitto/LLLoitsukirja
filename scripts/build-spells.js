import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { unified } from "unified";
//import { visit } from "unist-util-visit";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { toString as mdastToString } from "mdast-util-to-string";

const ROOT = process.cwd();
const SRD_DIR = path.join(ROOT, "vendor", "LnL-SRD");
const SPELLS_DIR = path.join(SRD_DIR, "Loitsut");
const OUT_DIR = path.join(ROOT, "public/data");
const OUT_FILE = path.join(OUT_DIR, "spells.json");

function textOf(node) {
  return mdastToString(node).trim();
}
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// markdown-tablet html:ksi, kuten inlineToHtml
// Hienompi ratkaisu olisi tehdä näistä jokin array jsoniin jossa nodeja tyyppeineen ja parsata se frontissa
function tableToHtml(node) {
  const rows = node.children || [];
  const aligns = node.align || [];
  if (!rows.length) return "";

  const headerCells = rows[0]?.children || [];
  const thead = `<thead><tr>${
    headerCells.map((c, i) => {
      const style = aligns[i] ? ` style="text-align:${aligns[i]};"` : "";
      const html = (c.children || []).map(inlineToHtml).join("");
      return `<th${style}>${html}</th>`;
    }).join("")
  }</tr></thead>`;

  const tbodyRows = rows.slice(1).map(r => {
    const tds = (r.children || []).map((c, i) => {
      const style = aligns[i] ? ` style="text-align:${aligns[i]};"` : "";
      const html = (c.children || []).map(inlineToHtml).join("");
      return `<td${style}>${html}</td>`;
    }).join("");
    return `<tr>${tds}</tr>`;
  }).join("");

  return `<table class="md-table">${thead}<tbody>${tbodyRows}</tbody></table>`;
}

// Nodejen käsittely, tablea lukuunottamatta
// Hienompi ratkaisu olisi tehdä näistä jokin array jsoniin jossa nodeja tyyppeineen ja parsata se frontissa
// Toistaiseksi tehdään inline-html
function inlineToHtml(node) {
  switch (node.type) {
    case "text":
      return escapeHtml(node.value || "");
    case "strong":
      return `<b>${(node.children || []).map(inlineToHtml).join("")}</b>`;
    case "emphasis":
      return `<i>${(node.children || []).map(inlineToHtml).join("")}</i>`;
    case "break":
      return "<br/>";
    //case "inlineCode":
    //  return escapeHtml(node.value || "");
    //case "link":
    //case "image":
    //case "delete":
    //case "footnoteReference":
    //case "html":
    default:
      return (node.children || []).map(inlineToHtml).join("");
  }
}

// sisältö html:ksi, inlineToHtml + rivinvaihtojen normalisointi
function contentsToHtml(p) {
  const raw = (p.children || []).map(inlineToHtml).join("");
  return normalizeLinebreaks(raw);
}

// Muuttaa CRLF ja CR rivinvaihdot LF:ksi ja siitä välilyönneiksi
function normalizeLinebreaks(s) {
  let out = s.replace(/\r\n?/g, "\n"); // CRLF, CR -> LF
  return out.replace(/\n/g, " ");
}

// tarkistaa onko paragraph muodossa 
// "**Label:**" 
//    tai 
// "**Label:** tekstiä perässä"
function isStrongLabelParagraph(node, want) {
  if (node.type !== "paragraph" || !node.children?.length) return false;
  const first = node.children[0];
  if (first?.type !== "strong") return false;
  const label = textOf(first).replace(/\s*:\s*$/, "");
  if (want) return label === want;
  return /:$/u.test(textOf(first)); // mikä tahansa **Label:**
}

function readStrongField(node) {
  // Palauttaa { label, valueText }
  console.log("readStrongField", node);
  const first = node.children[0]; // strong
  const label = textOf(first).replace(/\s*:\s*$/, "");
  // Kaikki muu teksti samasta paragraphista, strongin JÄLKEEN
  const restText = textOf({ ...node, children: node.children.slice(1) }).replace(/^:\s*/, "").trim();
  return { label, valueText: restText };
}


/**
 *  Irrotellaan  piiri, koulu, ja rituaalimerkintä loitsusta
 *  Nämä on merkitty tällä tapaa:
 *  "*Taikakonsti, luominen*"
 *    tai
 *  "*1-piirin suojelus (rituaali)*"
 *  Taikakonstit laitetaan piirille 0
 * 
 * @param {*} italicPara    ast-objekti, Löllö-md:ssä kursiivirivi
 * @returns { int piiri, string koulu, boolean rituaali }
 */
function parsePiiriKouluRituaaliFromAst(italicPara) {
  const s = textOf(italicPara).toLowerCase();

  const words = s.split(" ");
  const firstWord = words[0]; // piiri tai taikakonsti
  const piiriHelpompi = firstWord === "taikakonsti," ? 0 : parseInt(firstWord[0]);
  const kouluHelpompi = words[1];
  const rituaaliHelpompi = words[2] === "(rituaali)" ? true : false;

  if (!isNaN(piiriHelpompi) && kouluHelpompi) {
    return { piiri: piiriHelpompi, koulu: kouluHelpompi.trim(), rituaali: rituaaliHelpompi };
  }
  console.log("⚠️ Ei löydy piiri/koulu/rituaali:", s);
  return { piiri: null, koulu: null, rituaali: null };
}

/**
 *  Irrottaa loitsun komponentit ja materiaalikuvauksen merkkijonosta
 *  esim:
 *  "taikasana, ele, aines (verikoiran karvoja)"
 * @param {*} raw 
 * @returns { boolean verbal, boolean somatic, boolean material, string material_text }
 */
function parseKomponentitFromText(raw) {
  // "taikasana, ele, aines (xyz)"
  const lower = raw.toLowerCase();
  const verbal = /taikasana/.test(lower);
  const somatic = /ele/.test(lower);
  const material = /aines/.test(lower);
  const matMatch = raw.match(/\((.+)\)/);
  const material_text = matMatch ? matMatch[1].trim() : null;
  return { verbal, somatic, material, material_text };
}

// puuparseri
function extractKuvausFromAst(tree) {
  const metaLabels = new Set(["Loitsimisviive", "Kantama", "Komponentit", "Kesto"]);
  const paras = [];
  const upcastParas = [];

  let stage = "seekName"; // -> seekItalic -> skipMeta -> body
  let captureUpcast = false;

  for (const node of tree.children) {
    // tässä on stageja, eli loitsukuvauksen eri vaiheita.
    // TODO: tässä on turhia skippejä kun niissä kohdin voisi olla piiri-koulu-rituaali keräin ja meta-kenttien keräin
    // seekName: etsitään ###-otsikkoa, tämä on loitsun nimi
    // seekItalic: etsitään kursiiviriviä, joka kertoo piirin/koulun/rituaalin
    // skipMeta: ohitetaan meta-rivit (Loitsimisviive, Kantama, Komponentit, Kesto)
    // body: kerätään kuvausrivit
    if (stage === "seekName") {
      if (node.type === "heading" && node.depth === 3) {
        stage = "seekItalic";
        continue;
      }
      continue; // ohita ennen nimeä
    }

    if (stage === "seekItalic") {
      // TODO: piiri, koulu, rituaali keräin tähän
      if (node.type === "paragraph" && node.children?.some(ch => ch.type === "emphasis")) {
        stage = "skipMeta";
        continue;
      }
      stage = "skipMeta";
      // fall through
    }

    if (stage === "skipMeta") {
      // TODO: komponenttien keräin tähän
      if (node.type === "paragraph") {
        if (isStrongLabelParagraph(node)) {
          const { label } = readStrongField(node);
          if (metaLabels.has(label)) continue; // meta-rivi
        }
        stage = "body"; // ensimmäinen ei-meta paragraph
      } else if (node.type !== "thematicBreak") {
        stage = "body"; // mikä tahansa muu kuin hr
      } else {
        break;
      }
    }

    if (stage === "body") {
      if (node.type === "thematicBreak") break;

      if (node.type === "paragraph") {
        const tPlain = mdastToString(node);
        if (/^Korkeammilla loitsuvarauksilla\.\s*$/i.test(tPlain)) {
          captureUpcast = true;
          continue;
        }
        const html = contentsToHtml(node);
        if (captureUpcast) {
          upcastParas.push(html);
        } else {
          paras.push(html);
        }
        continue;
      }

      if (node.type === "table") {
        const html = tableToHtml(node);
        if (html) {
          if (captureUpcast) {
            upcastParas.push(html);
          } else {
            paras.push(html);
          }
        }
        continue;
      }
    } // stage body
  }

  return {
    kuvaus: paras.join("\n\n").trim() || null,
    upcast: upcastParas.join("\n\n").trim() || null,
  };
}

// Attribuutio per loitsu..? Ehkä tämä tarvitaan jos aletaan tukea ulkoisia lähteitä tai kotipolttoisia.
function readGitMeta() {
  try {
    const rev = fs.readFileSync(path.join(SRD_DIR, ".git", "HEAD"), "utf8").trim();
    if (rev.startsWith("ref:")) {
      const refPath = rev.split(" ")[1].trim();
      const hash = fs.readFileSync(path.join(SRD_DIR, ".git", refPath), "utf8").trim();
      return { srd_commit: hash };
    }
    return { srd_commit: rev };
  } catch {
    return { srd_commit: null };
  }
}

function parseSpellMarkdown(md, relPath) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(md);

  // debug-json ast-puusta
  /* 
  const removePositionNodes = (node) => {
    if (node.position) delete node.position;
    for (const child of node.children || []) {
      removePositionNodes(child);
    }
  };
  removePositionNodes(tree);
  fs.writeFileSync(path.join(OUT_DIR, "spelldebug.json"), JSON.stringify(tree, null, 2), "utf8");
  */

  // Nimi (###)
  let nimi = null;
  for (const n of tree.children) {
    if (n.type === "heading" && n.depth === 3) { nimi = textOf(n); break; }
  }

  // Kursiivirivi -> piiri/koulu/rituaali
  let italicPara = null;
  for (const n of tree.children) {
    if (n.type === "paragraph" && n.children?.some(ch => ch.type === "emphasis")) {
      italicPara = n;
      break;
    }

    if (
      (n.type === "heading" && n.depth !== 3) // tarkastettava depth=3, ettei suoritus lopu ensimmäiseen riviin
      || n.type === "thematicBreak") {
        break;
    }
  }
  const { piiri, koulu, rituaali } = italicPara ? parsePiiriKouluRituaaliFromAst(italicPara) : { piiri: null, koulu: null, rituaali: null };

  // Meta-kentät
  let loitsimisviive = null, kantama = null, komponentit = null, kesto = null;

  for (const n of tree.children) {
    if (!isStrongLabelParagraph(n)) continue;
    const { label, valueText } = readStrongField(n);
    switch (label) {
      case "Loitsimisviive": loitsimisviive = valueText; break;
      case "Kantama":        kantama = valueText; break;
      case "Komponentit":    komponentit = parseKomponentitFromText(valueText || ""); break;
      case "Kesto":          kesto = valueText; break;
      default: break; // jos joskus tulee lisää label-kenttiä
    }
  }

  // Kuvaus + upcast TODO: upcast-kuvaus on ihan tavallinen elementti, voisi varmaan parsia nätimminkin
  const { kuvaus, upcast } = extractKuvausFromAst(tree);

  return {
    nimi,
    relPath,
    piiri,
    koulu,
    rituaali: !!rituaali,
    loitsimisviive,
    kantama,
    komponentit: komponentit ?? { verbal: false, somatic: false, material: false, material_text: null },
    kesto,
    kuvaus,
    upcast_md: upcast,
    source_path: relPath,
    license: "CC-BY-4.0",
    source_repo: "https://github.com/Myrrys/LnL-SRD",
  };
}

async function main() {
  if (!fs.existsSync(SPELLS_DIR)) {
    console.error("Ei löydy Loitsut-kansiota:", SPELLS_DIR);
    process.exit(1);
  }

  const files = await fg(["**/*.md"], { cwd: SPELLS_DIR, absolute: true, dot: false });
  const meta = readGitMeta();

  const maxLoop = 0; // 0 = ei rajaa, 1 = käsittele vain yksi loitsu
  let count = 0;

  const spells = [];
  for (const absPath of files) {
    const rel = path.relative(SRD_DIR, absPath).replaceAll(path.sep, "/");
    const md = fs.readFileSync(absPath, "utf8");
    const spell = parseSpellMarkdown(md, rel);
    if(!spell.nimi) continue;
    spells.push({ ...spell});
    count++;
    if (maxLoop > 0 && count >= maxLoop) break; // katkaise silmukka
  }

  spells.forEach(s => {
    if (!s.nimi) console.warn("⚠️ Loitsulla ei ole nimeä:", s.source_path);
  });

  spells.sort((a, b) => a.nimi.localeCompare(b.nimi, "fi"));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ 
    generated_at: new Date().toISOString(), 
    count: spells.length, 
    spells 
  }, null, 2), "utf8");

  console.log(`Kirjoitettu ${spells.length} loitsua -> ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
