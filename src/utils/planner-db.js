import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
const nodeRequire = createRequire(import.meta.url);
function determineArticleStatus(art) {
  const s = (art.status || "").toLowerCase().trim();
  const isDraft = art.draft === true || s === "draft" || s.includes("draft");
  if (isDraft) return "In Progress";
  if (s === "scheduled" || s.includes("schedule")) return "Scheduled";
  if (art.publishDate) {
    const pubTime = new Date(art.publishDate).getTime();
    if (!isNaN(pubTime) && pubTime > Date.now()) {
      return "Scheduled";
    }
  }
  if (s.includes("publish") || s === "live" || !s) {
    return "Published";
  }
  return "Published";
}
function resetPlannerDB() {
  if (sqliteDbInstance) {
    try {
      if (typeof sqliteDbInstance.close === "function") {
        sqliteDbInstance.close();
      }
    } catch (_) {
    }
    sqliteDbInstance = null;
    currentDbPath = null;
  }
}
let sqliteDbInstance = null;
let currentDbPath = null;
function getDbPaths() {
  if (process.env.PLANNER_DB_PATH && process.env.PLANNER_JSON_PATH) {
    const dbPath2 = path.resolve(process.env.PLANNER_DB_PATH);
    const jsonPath2 = path.resolve(process.env.PLANNER_JSON_PATH);
    const dbDir = path.dirname(dbPath2);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    const jsonDir = path.dirname(jsonPath2);
    if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });
    return { dbPath: dbPath2, jsonPath: jsonPath2 };
  }
  const root = process.cwd();
  const dataDir = path.resolve(root, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.resolve(dataDir, "article-plans.db");
  const jsonPath = path.resolve(root, "public/admin/article-plans.json");
  const publicAdminDir = path.dirname(jsonPath);
  if (!fs.existsSync(publicAdminDir)) {
    fs.mkdirSync(publicAdminDir, { recursive: true });
  }
  return { dbPath, jsonPath };
}
function initPlannerDB() {
  const { dbPath, jsonPath } = getDbPaths();
  if (sqliteDbInstance && currentDbPath === dbPath) return sqliteDbInstance;
  if (sqliteDbInstance && currentDbPath !== dbPath) {
    try {
      if (typeof sqliteDbInstance.close === "function") {
        sqliteDbInstance.close();
      }
    } catch (_) {
    }
    sqliteDbInstance = null;
  }
  currentDbPath = dbPath;
  try {
    const { DatabaseSync } = nodeRequire("node:sqlite");
    const db = new DatabaseSync(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS article_plans (
        id TEXT PRIMARY KEY,
        focus_keyphrase TEXT NOT NULL,
        page_role TEXT NOT NULL DEFAULT 'Pillar Page',
        article_title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Planned',
        intent TEXT NOT NULL DEFAULT 'Informational',
        slug TEXT,
        live_url TEXT,
        notes TEXT,
        target_word_count INTEGER DEFAULT 2500,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_article_plans_status ON article_plans(status);
      CREATE INDEX IF NOT EXISTS idx_article_plans_slug ON article_plans(slug);
    `);
    sqliteDbInstance = db;
    const countRow = db.prepare("SELECT COUNT(*) as count FROM article_plans").get();
    if (countRow && countRow.count === 0 && fs.existsSync(jsonPath)) {
      try {
        const rawJson = fs.readFileSync(jsonPath, "utf8");
        const plans = JSON.parse(rawJson);
        if (Array.isArray(plans) && plans.length > 0) {
          const insertStmt = db.prepare(`
            INSERT INTO article_plans (
              id, focus_keyphrase, page_role, article_title, status, intent,
              slug, live_url, notes, target_word_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const p of plans) {
            insertStmt.run(
              p.id || crypto.randomUUID(),
              p.focusKeyphrase || "",
              p.pageRole || "Pillar Page",
              p.articleTitle || "",
              p.status || "Planned",
              p.intent || "Informational",
              p.slug || "",
              p.liveUrl || "",
              p.notes || "",
              p.targetWordCount || 2500,
              p.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
              p.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
            );
          }
        }
      } catch (_) {
      }
    }
    syncJsonFromDb(db);
    return db;
  } catch (err) {
    console.warn("[Planner DB] Note: node:sqlite fallback mode active:", err);
    return null;
  }
}
function syncJsonFromDb(db) {
  try {
    const { jsonPath } = getDbPaths();
    if (!db) return;
    const rows = db.prepare("SELECT * FROM article_plans ORDER BY updated_at DESC").all();
    const mapped = rows.map((r) => mapRowToPlan(r));
    fs.writeFileSync(jsonPath, JSON.stringify(mapped, null, 2), "utf8");
  } catch (err) {
    console.warn("[Planner DB] Warning syncing JSON snapshot:", err);
  }
}
function splitKeyphrases(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.map((k) => String(k).trim().replace(/^['"]+|['"]+$/g, "").trim()).filter(Boolean)));
  }
  return Array.from(new Set(
    String(raw).split(new RegExp("[,;\\n\\r]+")).map((k) => k.trim().replace(/^['"]+|['"]+$/g, "").trim()).filter(Boolean)
  ));
}
function mapRowToPlan(row) {
  const rawKeyphrase = row.focus_keyphrase || "";
  const keyphrases = splitKeyphrases(rawKeyphrase);
  return {
    id: String(row.id),
    focusKeyphrase: rawKeyphrase,
    focusKeyphrases: keyphrases,
    pageRole: row.page_role || "Pillar Page",
    articleTitle: row.article_title,
    status: row.status || "Planned",
    intent: row.intent || "Informational",
    slug: row.slug || void 0,
    liveUrl: row.live_url || void 0,
    notes: row.notes || void 0,
    targetWordCount: row.target_word_count ? Number(row.target_word_count) : 2500,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function getAllPlans() {
  const db = initPlannerDB();
  if (db) {
    try {
      const rows = db.prepare("SELECT * FROM article_plans ORDER BY updated_at DESC").all();
      return rows.map((r) => mapRowToPlan(r));
    } catch (err) {
      console.warn("[Planner DB] Error querying SQLite, reading from JSON snapshot:", err);
    }
  }
  const { jsonPath } = getDbPaths();
  if (fs.existsSync(jsonPath)) {
    try {
      return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    } catch (_) {
      return [];
    }
  }
  return [];
}
function getPlanById(id) {
  const db = initPlannerDB();
  if (db) {
    try {
      const row = db.prepare("SELECT * FROM article_plans WHERE id = ?").get(id);
      return row ? mapRowToPlan(row) : null;
    } catch (_) {
    }
  }
  return getAllPlans().find((p) => p.id === id) || null;
}
function createPlan(input) {
  const db = initPlannerDB();
  const id = input.id || crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const kps = splitKeyphrases(
    input.focusKeyphrases && input.focusKeyphrases.length > 0 ? input.focusKeyphrases : input.focusKeyphrase
  );
  const focusKeyphrase = kps.join(", ");
  const plan = {
    id,
    focusKeyphrase,
    focusKeyphrases: kps,
    pageRole: input.pageRole || "Pillar Page",
    articleTitle: (input.articleTitle || "").trim(),
    status: input.status || "Planned",
    intent: input.intent || "Informational",
    slug: (input.slug || generateSlug(input.articleTitle || "")).trim(),
    liveUrl: input.liveUrl || void 0,
    notes: input.notes || void 0,
    targetWordCount: input.targetWordCount || 2500,
    createdAt: input.createdAt || now,
    updatedAt: now
  };
  if (db) {
    try {
      const stmt = db.prepare(`
        INSERT INTO article_plans (
          id, focus_keyphrase, page_role, article_title, status, intent,
          slug, live_url, notes, target_word_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        plan.id,
        plan.focusKeyphrase,
        plan.pageRole,
        plan.articleTitle,
        plan.status,
        plan.intent,
        plan.slug || null,
        plan.liveUrl || null,
        plan.notes || null,
        plan.targetWordCount || 2500,
        plan.createdAt,
        plan.updatedAt
      );
      syncJsonFromDb(db);
      return plan;
    } catch (err) {
      console.warn("[Planner DB] Error in SQLite insert, saving to JSON snapshot:", err);
    }
  }
  const plans = getAllPlans();
  plans.unshift(plan);
  const { jsonPath } = getDbPaths();
  fs.writeFileSync(jsonPath, JSON.stringify(plans, null, 2), "utf8");
  return plan;
}
function updatePlan(id, updates) {
  const existing = getPlanById(id);
  if (!existing) return null;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let updatedKeyphrase = existing.focusKeyphrase;
  let updatedKeyphrases = existing.focusKeyphrases || splitKeyphrases(existing.focusKeyphrase);
  if (updates.focusKeyphrases !== void 0 || updates.focusKeyphrase !== void 0) {
    const kps = splitKeyphrases(
      updates.focusKeyphrases && updates.focusKeyphrases.length > 0 ? updates.focusKeyphrases : updates.focusKeyphrase
    );
    updatedKeyphrase = kps.join(", ");
    updatedKeyphrases = kps;
  }
  const updated = {
    ...existing,
    ...updates,
    focusKeyphrase: updatedKeyphrase,
    focusKeyphrases: updatedKeyphrases,
    id: existing.id,
    updatedAt: now
  };
  const db = initPlannerDB();
  if (db) {
    try {
      const stmt = db.prepare(`
        UPDATE article_plans SET
          focus_keyphrase = ?,
          page_role = ?,
          article_title = ?,
          status = ?,
          intent = ?,
          slug = ?,
          live_url = ?,
          notes = ?,
          target_word_count = ?,
          updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        updated.focusKeyphrase,
        updated.pageRole,
        updated.articleTitle,
        updated.status,
        updated.intent,
        updated.slug || null,
        updated.liveUrl || null,
        updated.notes || null,
        updated.targetWordCount || 2500,
        updated.updatedAt,
        id
      );
      syncJsonFromDb(db);
      return updated;
    } catch (err) {
      console.warn("[Planner DB] Error in SQLite update, fallback to JSON:", err);
    }
  }
  const plans = getAllPlans().map((p) => p.id === id ? updated : p);
  const { jsonPath } = getDbPaths();
  fs.writeFileSync(jsonPath, JSON.stringify(plans, null, 2), "utf8");
  return updated;
}
function deletePlan(id) {
  const db = initPlannerDB();
  if (db) {
    try {
      const stmt = db.prepare("DELETE FROM article_plans WHERE id = ?");
      const res = stmt.run(id);
      syncJsonFromDb(db);
      return res.changes > 0;
    } catch (err) {
      console.warn("[Planner DB] Error in SQLite delete:", err);
    }
  }
  const plans = getAllPlans();
  const filtered = plans.filter((p) => p.id !== id);
  if (filtered.length === plans.length) return false;
  const { jsonPath } = getDbPaths();
  fs.writeFileSync(jsonPath, JSON.stringify(filtered, null, 2), "utf8");
  return true;
}
function bulkCreatePlans(inputs) {
  const errors = [];
  const created = [];
  const db = initPlannerDB();
  if (db) {
    try {
      db.exec("BEGIN TRANSACTION");
      const insertStmt = db.prepare(`
        INSERT INTO article_plans (
          id, focus_keyphrase, page_role, article_title, status, intent,
          slug, live_url, notes, target_word_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of inputs) {
        if (!item.articleTitle && !item.focusKeyphrase) {
          errors.push("Lewati baris tanpa Judul atau Focus Keyphrase.");
          continue;
        }
        const id = item.id || crypto.randomUUID();
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const kps = splitKeyphrases(
          item.focusKeyphrases && item.focusKeyphrases.length > 0 ? item.focusKeyphrases : item.focusKeyphrase
        );
        const focusKeyphrase = kps.join(", ");
        const plan = {
          id,
          focusKeyphrase,
          focusKeyphrases: kps,
          pageRole: item.pageRole || "Pillar Page",
          articleTitle: (item.articleTitle || "").trim(),
          status: item.status || "Planned",
          intent: item.intent || "Informational",
          slug: (item.slug || generateSlug(item.articleTitle || "")).trim(),
          liveUrl: item.liveUrl || void 0,
          notes: item.notes || void 0,
          targetWordCount: item.targetWordCount || 2500,
          createdAt: item.createdAt || now,
          updatedAt: now
        };
        insertStmt.run(
          plan.id,
          plan.focusKeyphrase,
          plan.pageRole,
          plan.articleTitle,
          plan.status,
          plan.intent,
          plan.slug || null,
          plan.liveUrl || null,
          plan.notes || null,
          plan.targetWordCount || 2500,
          plan.createdAt,
          plan.updatedAt
        );
        created.push(plan);
      }
      db.exec("COMMIT");
      syncJsonFromDb(db);
      return { inserted: created.length, plans: created, errors };
    } catch (err) {
      try {
        db.exec("ROLLBACK");
      } catch (_) {
      }
      errors.push("Transaction error: " + (err.message || String(err)));
    }
  }
  for (const item of inputs) {
    if (!item.articleTitle && !item.focusKeyphrase) continue;
    try {
      created.push(createPlan(item));
    } catch (e) {
      errors.push(e.message || String(e));
    }
  }
  return { inserted: created.length, plans: created, errors };
}
function findMatchingArticle(plan, websiteArticles) {
  const pSlug = normalizeText(plan.slug || "");
  const pGenSlug = normalizeText(generateSlug(plan.articleTitle || ""));
  const pTitle = normalizeText(plan.articleTitle || "");
  const pColon = normalizeText((plan.articleTitle || "").split(":")[0]);
  const pUrl = (plan.liveUrl || "").trim().replace(/\/+$/, "");
  for (const art of websiteArticles) {
    const aSlug = normalizeText(art.slug || "");
    if (aSlug && pSlug) {
      if (aSlug === pSlug || aSlug.startsWith(pSlug) || pSlug.startsWith(aSlug)) {
        return art;
      }
    }
    if (aSlug && pGenSlug) {
      if (aSlug === pGenSlug || aSlug.startsWith(pGenSlug) || pGenSlug.startsWith(aSlug)) {
        return art;
      }
    }
  }
  if (pUrl) {
    for (const art of websiteArticles) {
      const aUrl = (art.url || "").trim().replace(/\/+$/, "");
      if (aUrl && pUrl === aUrl) {
        return art;
      }
    }
  }
  for (const art of websiteArticles) {
    const aTitle = normalizeText(art.title || "");
    if (pTitle && aTitle && pTitle === aTitle) {
      return art;
    }
  }
  for (const art of websiteArticles) {
    const aTitle = normalizeText(art.title || "");
    if (pTitle && aTitle && pTitle.length >= 8 && aTitle.length >= 8) {
      if (aTitle.startsWith(pTitle) || pTitle.startsWith(aTitle)) {
        return art;
      }
    }
  }
  if (pColon && pColon.length >= 6) {
    for (const art of websiteArticles) {
      const aColon = normalizeText((art.title || "").split(":")[0]);
      if (aColon && pColon === aColon) {
        return art;
      }
    }
  }
  const keyphrases = plan.focusKeyphrases && plan.focusKeyphrases.length > 0 ? plan.focusKeyphrases : splitKeyphrases(plan.focusKeyphrase);
  for (const kp of keyphrases) {
    const normKp = normalizeText(kp);
    if (!normKp || normKp.length < 6) continue;
    for (const art of websiteArticles) {
      const aTitle = normalizeText(art.title || "");
      const aSlug = normalizeText(art.slug || "");
      if (aTitle.includes(normKp) || aSlug.includes(normKp) || normKp.includes(aSlug)) {
        return art;
      }
    }
  }
  return void 0;
}
function syncWithWebsiteArticles(websiteArticles, autoImportMissing = true) {
  const currentPlans = getAllPlans();
  let syncedCount = 0;
  let newImportedCount = 0;
  const updatedPlanIds = [];
  const importedPlanIds = [];
  const matchedArticleSlugs = /* @__PURE__ */ new Set();
  const seenPlanSlugs = /* @__PURE__ */ new Map();
  for (const plan of currentPlans) {
    const matchedArt = findMatchingArticle(plan, websiteArticles);
    if (matchedArt) {
      const artSlugNorm = normalizeText(matchedArt.slug);
      if (seenPlanSlugs.has(artSlugNorm)) {
        deletePlan(plan.id);
        syncedCount++;
        continue;
      }
      seenPlanSlugs.set(artSlugNorm, plan.id);
      matchedArticleSlugs.add(artSlugNorm);
      let needsUpdate = false;
      const updates = {};
      const targetStatus = determineArticleStatus(matchedArt);
      if (plan.status !== targetStatus) {
        updates.status = targetStatus;
        needsUpdate = true;
      }
      if (!plan.liveUrl || plan.liveUrl !== matchedArt.url) {
        updates.liveUrl = matchedArt.url;
        needsUpdate = true;
      }
      if (!plan.slug || plan.slug !== matchedArt.slug) {
        updates.slug = matchedArt.slug;
        needsUpdate = true;
      }
      if (needsUpdate) {
        updatePlan(plan.id, updates);
        syncedCount++;
        updatedPlanIds.push(plan.id);
      }
    } else {
      if (plan.status === "Published" || plan.status === "Scheduled") {
        updatePlan(plan.id, {
          status: "Planned",
          liveUrl: void 0
        });
        syncedCount++;
        updatedPlanIds.push(plan.id);
      }
    }
  }
  if (autoImportMissing) {
    const refreshedPlans = getAllPlans();
    const existingSlugs = new Set(
      refreshedPlans.map((p) => normalizeText(p.slug || generateSlug(p.articleTitle)))
    );
    const existingTitles = new Set(refreshedPlans.map((p) => normalizeText(p.articleTitle)));
    for (const art of websiteArticles) {
      const artSlug = normalizeText(art.slug);
      const artTitle = normalizeText(art.title);
      if (matchedArticleSlugs.has(artSlug)) {
        continue;
      }
      if (!existingSlugs.has(artSlug) && !existingTitles.has(artTitle)) {
        const allTags = art.tags && art.tags.length > 0 ? art.tags.join(", ") : "";
        const focusKeyphrase = allTags || art.title.split(":")[0].trim();
        let pageRole = "Topic Cluster";
        const tLower = art.title.toLowerCase();
        if (tLower.includes("guide") || tLower.includes("blueprint") || tLower.includes("panduan") || tLower.includes("complete")) {
          pageRole = "Pillar Page";
        } else if (tLower.includes("case study") || art.type === "case-study") {
          pageRole = "Case Study";
        }
        const targetStatus = determineArticleStatus(art);
        const newPlan = createPlan({
          articleTitle: art.title,
          focusKeyphrase,
          pageRole,
          status: targetStatus,
          intent: "Informational",
          slug: art.slug,
          liveUrl: art.url,
          notes: art.description ? `Ringkasan: ${art.description}` : void 0,
          targetWordCount: 2500
        });
        newImportedCount++;
        importedPlanIds.push(newPlan.id);
        existingSlugs.add(artSlug);
        existingTitles.add(artTitle);
      }
    }
  }
  const allRefreshed = getAllPlans();
  return {
    syncedCount,
    newImportedCount,
    updatedPlanIds,
    importedPlanIds,
    statusSummary: {
      total: allRefreshed.length,
      published: allRefreshed.filter((p) => p.status === "Published").length,
      scheduled: allRefreshed.filter((p) => p.status === "Scheduled").length,
      inProgress: allRefreshed.filter((p) => p.status === "In Progress").length,
      planned: allRefreshed.filter((p) => p.status === "Planned").length
    },
    plans: allRefreshed
  };
}
function parseCSV(csvText) {
  const errors = [];
  const rows = [];
  if (!csvText || !csvText.trim()) {
    errors.push("File atau teks CSV kosong.");
    return { rows, errors };
  }
  const cleanText = csvText.replace(/^\uFEFF/, "").trim();
  if (!cleanText) {
    errors.push("File atau teks CSV kosong.");
    return { rows, errors };
  }
  const firstLine = cleanText.split(/\r?\n/)[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  let delimiter = ",";
  if (semiCount > commaCount && semiCount >= tabCount) delimiter = ";";
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = "	";
  const rawLines = parseCSVLines(cleanText, delimiter);
  if (rawLines.length === 0) {
    errors.push("Tidak ada baris data yang ditemukan dalam CSV.");
    return { rows, errors };
  }
  const headers = rawLines[0].map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
  const colMap = {
    focusKeyphrase: findHeaderIndex(headers, [
      "focus keyphrase",
      "focus_keyphrase",
      "keyphrase",
      "keyword",
      "keywords",
      "kata kunci",
      "fokus kata kunci",
      "fokus kata-kunci"
    ]),
    pageRole: findHeaderIndex(headers, [
      "page role",
      "page_role",
      "role",
      "peran halaman",
      "peran",
      "page type",
      "tipe"
    ]),
    articleTitle: findHeaderIndex(headers, [
      "article title",
      "article_title",
      "title",
      "judul artikel",
      "judul",
      "topic",
      "topik"
    ]),
    status: findHeaderIndex(headers, ["status", "state", "keadaan", "alur", "tahap"]),
    intent: findHeaderIndex(headers, [
      "intent",
      "search intent",
      "search_intent",
      "niat pencarian",
      "niat",
      "maksud"
    ]),
    notes: findHeaderIndex(headers, ["notes", "catatan", "keterangan", "description", "deskripsi"]),
    targetWordCount: findHeaderIndex(headers, ["word count", "target words", "target_word_count", "kata", "jumlah kata"])
  };
  if (colMap.articleTitle === -1 && colMap.focusKeyphrase === -1) {
    errors.push(
      'Header CSV harus menyertakan minimal kolom "Article Title" atau "Focus Keyphrase". Ditemukan: ' + headers.join(", ")
    );
    return { rows, errors };
  }
  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line.length === 0 || line.every((c) => !c.trim())) continue;
    const rawTitle = colMap.articleTitle !== -1 ? line[colMap.articleTitle] || "" : "";
    const rawKeyphrase = colMap.focusKeyphrase !== -1 ? line[colMap.focusKeyphrase] || "" : "";
    const rawRole = colMap.pageRole !== -1 ? line[colMap.pageRole] || "" : "";
    const rawStatus = colMap.status !== -1 ? line[colMap.status] || "" : "";
    const rawIntent = colMap.intent !== -1 ? line[colMap.intent] || "" : "";
    const rawNotes = colMap.notes !== -1 ? line[colMap.notes] || "" : "";
    const rawWordCount = colMap.targetWordCount !== -1 ? line[colMap.targetWordCount] || "" : "";
    if (!rawTitle.trim() && !rawKeyphrase.trim()) {
      errors.push(`Baris ${i + 1}: Diabaikan karena judul dan keyphrase kosong.`);
      continue;
    }
    const keyphrasesList = splitKeyphrases(rawKeyphrase);
    rows.push({
      articleTitle: rawTitle.trim() || (keyphrasesList[0] || ""),
      focusKeyphrase: keyphrasesList.join(", ") || rawTitle.trim(),
      focusKeyphrases: keyphrasesList.length > 0 ? keyphrasesList : [rawTitle.trim()],
      pageRole: normalizePageRole(rawRole),
      status: normalizePlanStatus(rawStatus),
      intent: normalizeIntent(rawIntent),
      notes: rawNotes.trim() || void 0,
      targetWordCount: parseInt(rawWordCount, 10) || 2500
    });
  }
  return { rows, errors };
}
function parseCSVLines(text, delimiter) {
  const result = [];
  let row = [];
  let inQuotes = false;
  let currentToken = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      row.push(currentToken.trim());
      result.push(row);
      row = [];
      currentToken = "";
    } else {
      currentToken += char;
    }
  }
  if (currentToken.length > 0 || row.length > 0) {
    row.push(currentToken.trim());
    result.push(row);
  }
  return result.filter((r) => r.length > 0 && r.some((c) => c !== ""));
}
function findHeaderIndex(headers, aliases) {
  return headers.findIndex((h) => aliases.some((a) => h === a || h.includes(a)));
}
function normalizePageRole(raw) {
  const s = raw.toLowerCase().trim();
  if (s.includes("pillar")) return "Pillar Page";
  if (s.includes("cluster")) return "Topic Cluster";
  if (s.includes("guide") || s.includes("panduan") || s.includes("support")) return "Supporting Guide";
  if (s.includes("case") || s.includes("studi")) return "Case Study";
  if (s.includes("landing") || s.includes("convert") || s.includes("product")) return "Landing Page";
  return "Topic Cluster";
}
function normalizePlanStatus(raw) {
  const s = raw.toLowerCase().trim();
  if (s.includes("pub") || s.includes("live") || s.includes("terbit")) return "Published";
  if (s.includes("sched") || s.includes("jadwal")) return "Scheduled";
  if (s.includes("review") || s.includes("siap")) return "Ready to Review";
  if (s.includes("prog") || s.includes("tulis") || s.includes("draft")) return "In Progress";
  return "Planned";
}
function normalizeIntent(raw) {
  const s = raw.toLowerCase().trim();
  if (s.includes("comm") || s.includes("komersial") || s.includes("investigasi")) return "Commercial Investigation";
  if (s.includes("trans") || s.includes("beli") || s.includes("order")) return "Transactional";
  if (s.includes("nav") || s.includes("brand")) return "Navigational";
  return "Informational";
}
function normalizeText(text) {
  return (text || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}
function generateSlug(title) {
  return (title || "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
export {
  bulkCreatePlans,
  createPlan,
  deletePlan,
  determineArticleStatus,
  findMatchingArticle,
  generateSlug,
  getAllPlans,
  getPlanById,
  initPlannerDB,
  parseCSV,
  resetPlannerDB,
  splitKeyphrases,
  syncWithWebsiteArticles,
  updatePlan
};
