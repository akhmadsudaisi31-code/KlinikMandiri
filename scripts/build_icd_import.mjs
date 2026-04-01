import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const WHO_CODES_TXT = "/tmp/icd_who_2019/icd102019syst_codes.txt";
const CDC_CODES_TXT = "/tmp/icd10cm_2026/icd10cm-codes-2026.txt";
const OUTPUT_SQL = "/home/naya/Documents/DevApp/KlinikMandiri/.codex_tmp/import_icd_codes.sql";

function escapeSql(value) {
  return String(value).replace(/'/g, "''");
}

function normalizeCode(code) {
  if (!code) return "";
  const raw = String(code).trim().replace(/\s+/g, "");
  if (raw.includes(".")) return raw;
  if (raw.length <= 3) return raw;
  return `${raw.slice(0, 3)}.${raw.slice(3)}`;
}

function buildWhoRows() {
  const content = readFileSync(WHO_CODES_TXT, "utf8");
  const rows = [];
  const seen = new Set();

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parts = line.split(";");
    if (parts.length < 9) continue;
    const type = parts[1];
    const rawCode = (parts[6] || parts[5] || "").replace(/-\s*$/, "").replace(/\. -$/, "").replace(/-\.$/, "");
    const code = normalizeCode(rawCode.replace(/-\s*$/, "").replace(/\.-$/, ""));
    const title = (parts[8] || "").trim();
    if (!code || !title) continue;
    const key = `who_icd10_2019:${code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      id: `who_icd10_2019:${code}`,
      source: "who_icd10_2019",
      code,
      codeCompact: code.replace(/\./g, ""),
      title,
      searchText: `${code} ${title}`.toLowerCase(),
      isTerminal: type === "T" ? 1 : 0,
    });
  }

  return rows;
}

function buildCdcRows() {
  const content = readFileSync(CDC_CODES_TXT, "utf8");
  const rows = [];
  const seen = new Set();

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^([A-Z0-9]+)\s+(.+)$/);
    if (!match) continue;
    const [, compactCode, title] = match;
    const code = normalizeCode(compactCode);
    const key = `icd10cm_2026:${code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      id: `icd10cm_2026:${code}`,
      source: "icd10cm_2026",
      code,
      codeCompact: compactCode,
      title: title.trim(),
      searchText: `${code} ${title}`.toLowerCase(),
      isTerminal: 1,
    });
  }

  return rows;
}

function buildInsertStatements(rows) {
  const chunks = [];
  const chunkSize = 250;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const values = slice
      .map(
        (row) =>
          `('${escapeSql(row.id)}','${escapeSql(row.source)}','${escapeSql(row.code)}','${escapeSql(
            row.codeCompact,
          )}','${escapeSql(row.title)}','${escapeSql(row.searchText)}',${row.isTerminal})`,
      )
      .join(",\n");
    chunks.push(
      `INSERT INTO icd_codes (id, source, code, code_compact, title, search_text, is_terminal)\nVALUES\n${values};`,
    );
  }
  return chunks.join("\n");
}

const whoRows = buildWhoRows();
const cdcRows = buildCdcRows();
const allRows = [...whoRows, ...cdcRows];

mkdirSync("/home/naya/Documents/DevApp/KlinikMandiri/.codex_tmp", { recursive: true });

const sql = `
DELETE FROM icd_codes WHERE source IN ('who_icd10_2019', 'icd10cm_2026');
${buildInsertStatements(allRows)}
`;

writeFileSync(OUTPUT_SQL, sql, "utf8");
console.log(
  JSON.stringify(
    {
      whoRows: whoRows.length,
      cdcRows: cdcRows.length,
      totalRows: allRows.length,
      output: OUTPUT_SQL,
    },
    null,
    2,
  ),
);
