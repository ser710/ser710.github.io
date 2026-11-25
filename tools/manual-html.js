/* Builds manual/*.html from the app repo's docs/manual/*.md.
   node tools/manual-html.js <aerion-web>/docs/manual
   Plain Markdown only (headings, paragraphs, lists, tables, bold, code, links). No scripts, no tracking. */
const fs = require("fs");
const path = require("path");
const src = process.argv[2];
if (!src) throw new Error("usage: node tools/manual-html.js <docs/manual folder>");
const out = path.join(__dirname, "..", "manual");
fs.mkdirSync(out, { recursive: true });
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const link = (h) => (/^https?:/.test(h) ? h : h.replace(/^README\.md/, "index.html").replace(/\.md(#|$)/, ".html$1"));
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, h) => '<a href="' + link(h) + '">' + t + "</a>");
/* heading ids the way GitHub makes them, so links like web-app.md#link-with-my-pc land on the heading */
const slug = (h) =>
  h.replace(/\*\*|`/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim().toLowerCase()
    .replace(/[^\w\- ]/g, "").replace(/ /g, "-");
function md(text) {
  const L = text.replace(/\r/g, "").split("\n");
  const html = [];
  let i = 0,
    title = "";
  while (i < L.length) {
    const l = L[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = l.match(/^(#{1,3}) (.*)/))) {
      const n = m[1].length;
      if (n === 1 && !title) title = m[2];
      html.push("<h" + n + ' id="' + slug(m[2]) + '">' + inline(m[2]) + "</h" + n + ">");
      i++;
    } else if (/^\|/.test(l)) {
      const rows = [];
      while (i < L.length && /^\|/.test(L[i])) rows.push(L[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      html.push('<div class="tw"><table><thead><tr>' + cells(rows[0]).map((c) => "<th>" + inline(c) + "</th>").join("") + "</tr></thead><tbody>");
      for (const r of rows.slice(2)) html.push("<tr>" + cells(r).map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>");
      html.push("</tbody></table></div>");
    } else if (/^\s*(- |\d+\. )/.test(l)) {
      /* a list, items may wrap and may hold one nested list */
      const ord = /^\d+\. /.test(l.trim());
      const items = [];
      while (i < L.length && L[i].trim() && (/^(- |\d+\. )/.test(L[i]) || /^\s+/.test(L[i]))) {
        if (/^(- |\d+\. )/.test(L[i])) items.push({ t: L[i].replace(/^(- |\d+\. )/, ""), sub: [] });
        else if (/^\s+- /.test(L[i])) items[items.length - 1].sub.push(L[i].replace(/^\s+- /, ""));
        else {
          const it = items[items.length - 1];
          if (it.sub.length) it.sub[it.sub.length - 1] += " " + L[i].trim();
          else it.t += " " + L[i].trim();
        }
        i++;
      }
      const tag = ord ? "ol" : "ul";
      html.push("<" + tag + ">" + items.map((it) => "<li>" + inline(it.t) + (it.sub.length ? "<ul>" + it.sub.map((s) => "<li>" + inline(s) + "</li>").join("") + "</ul>" : "") + "</li>").join("") + "</" + tag + ">");
    } else {
      const p = [];
      while (i < L.length && L[i].trim() && !/^(#|\||- |\d+\. )/.test(L[i])) p.push(L[i++].trim());
      html.push("<p>" + inline(p.join(" ")) + "</p>");
    }
  }
  return { title, body: html.join("\n") };
}
const page = (title, body, file) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Aerion manual</title>
<link rel="stylesheet" href="../site.css">
<link rel="canonical" href="https://aerionhvacdesign.com/manual/${file}">
<link rel="icon" type="image/svg+xml" href="../img/logo.svg">
<style>.doc .tw{overflow-x:auto;margin:12px 0}.doc table{border-collapse:collapse;width:100%}.doc p,.doc li,.doc td{overflow-wrap:anywhere}.doc th,.doc td{border:1px solid rgba(128,128,128,.35);padding:6px 8px;text-align:left;vertical-align:top}.doc code{font-family:"IBM Plex Mono",monospace}</style>
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="../"><img src="../img/logo.svg" alt="">Aerion</a>
  <nav class="links"><a href="./">Manual</a><a href="../#features">Features</a><a href="../#pricing">Pricing</a></nav>
</div></header>
<main class="wrap doc">
${body}
</main>
<footer><div class="wrap">
  <span>Aerion HVAC Design Studio is part of Epic Stuff, Things &amp; Co. © 2026 Epic Stuff, Things &amp; Co. All rights reserved.</span>
  <nav><a href="./">Manual</a><a href="../terms.html">Terms</a><a href="../privacy.html">Privacy</a><a href="../refunds.html">Refunds</a></nav>
</div></footer>
</body>
</html>
`;
const files = fs.readdirSync(src).filter((f) => f.endsWith(".md"));
for (const f of files) {
  const { title, body } = md(fs.readFileSync(path.join(src, f), "utf8"));
  const name = f === "README.md" ? "index.html" : f.replace(/\.md$/, ".html");
  fs.writeFileSync(path.join(out, name), page(title || "Manual", body, name === "index.html" ? "" : name));
  console.log("wrote manual/" + name);
}
