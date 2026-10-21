/**
 * Article Planner (Rencana Artikel & Kalender Konten) Client Engine
 * 
 * Features:
 * - SQLite & API persistence via /api/article-plans
 * - Columns: Focus Keyphrase, Page Role, Article Title, Status, Intent, Action
 * - Live synchronization with website articles (src/content/articles/)
 * - Bulk CSV import with drag-drop, delimiter detection, and template download
 * - Seamless integration with AI Article Studio
 */

(function () {
  'use strict';

  // Global State
  const state = {
    plans: [],
    filterSearch: '',
    filterStatus: 'all',
    filterRole: 'all',
    filterIntent: 'all',
    editingPlanId: null,
    pendingCsvRows: [],
    isOpen: false,
  };

  const API_URL = '/api/article-plans';

  // =========================================================================
  // 1. Data Fetching & Sync
  // =========================================================================

  async function fetchPlans() {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        state.plans = await res.json();
      } else {
        // Fallback to static JSON mirror
        const fallbackRes = await fetch('/admin/article-plans.json');
        if (fallbackRes.ok) {
          state.plans = await fallbackRes.json();
        }
      }
    } catch (err) {
      console.warn('[Article Planner] Offline/fallback mode:', err);
      try {
        const local = localStorage.getItem('ap_article_plans');
        if (local) state.plans = JSON.parse(local);
      } catch (_) {}
    }
    updateLauncherBadge();
    renderTable();
    updateStats();
  }

  async function savePlanToDb(planData) {
    try {
      const isEdit = !!planData.id;
      const res = await fetch(API_URL, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.plans) state.plans = data.plans;
        else await fetchPlans();
        renderTable();
        updateStats();
        return true;
      }
    } catch (err) {
      console.error('[Article Planner] Error saving plan:', err);
    }
    // Optimistic client fallback
    if (!planData.id) {
      planData.id = 'plan-' + Date.now();
      planData.createdAt = new Date().toISOString();
      planData.updatedAt = new Date().toISOString();
      state.plans.unshift(planData);
    } else {
      const idx = state.plans.findIndex((p) => p.id === planData.id);
      if (idx !== -1) {
        state.plans[idx] = { ...state.plans[idx], ...planData, updatedAt: new Date().toISOString() };
      }
    }
    try {
      localStorage.setItem('ap_article_plans', JSON.stringify(state.plans));
    } catch (_) {}
    renderTable();
    updateStats();
    return true;
  }

  async function deletePlanFromDb(id) {
    try {
      const res = await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.plans) state.plans = data.plans;
        else await fetchPlans();
        renderTable();
        updateStats();
        return true;
      }
    } catch (err) {
      console.error('[Article Planner] Error deleting plan:', err);
    }
    state.plans = state.plans.filter((p) => p.id !== id);
    try {
      localStorage.setItem('ap_article_plans', JSON.stringify(state.plans));
    } catch (_) {}
    renderTable();
    updateStats();
    return true;
  }

  async function syncWebsiteArticles() {
    showToast('🔄 Menyelaraskan dengan artikel website...', true);
    try {
      const res = await fetch(API_URL + '/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', autoImport: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.plans) state.plans = data.plans;
        else await fetchPlans();
        renderTable();
        updateStats();
        showToast(
          `✓ Sinkronisasi selesai: ${data.syncedCount || 0} status diperbarui, ${data.newImportedCount || 0} artikel baru diimpor dari website!`,
          true
        );
        return;
      }
    } catch (err) {
      console.warn('[Article Planner] Direct sync API failed, attempting client articles-index:', err);
    }

    // Client-side fallback sync using /api/articles-index.json
    try {
      const res = await fetch('/api/articles-index.json');
      if (res.ok) {
        const articles = await res.json();
        let synced = 0;
        let imported = 0;
        for (const art of articles) {
          const match = state.plans.find((p) => {
            const pSlug = (p.slug || '').toLowerCase();
            const aSlug = (art.slug || '').toLowerCase();
            const pTitle = (p.articleTitle || '').toLowerCase();
            const aTitle = (art.title || '').toLowerCase();
            return pSlug === aSlug || pTitle === aTitle;
          });
          if (match) {
            if (match.status !== 'Published') {
              match.status = 'Published';
              match.liveUrl = art.url;
              synced++;
            }
          } else {
            state.plans.push({
              id: 'art-' + Date.now() + Math.random().toString(36).slice(2, 6),
              articleTitle: art.title,
              focusKeyphrase: (art.tags && art.tags[0]) || art.title.split(':')[0],
              pageRole: art.title.toLowerCase().includes('guide') ? 'Pillar Page' : 'Topic Cluster',
              status: 'Published',
              intent: 'Informational',
              slug: art.slug,
              liveUrl: art.url,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            imported++;
          }
        }
        renderTable();
        updateStats();
        showToast(`✓ Berhasil menyelaraskan ${synced} artikel & mengimpor ${imported} artikel baru!`, true);
      }
    } catch (e) {
      showToast('✕ Gagal menyinkronkan data website: ' + e.message, false);
    }
  }

  async function bulkImportCsv(csvText) {
    showToast('📥 Memproses impor CSV ke database...', true);
    try {
      const res = await fetch(API_URL + '/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', csvText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.plans) state.plans = data.plans;
        else await fetchPlans();
        renderTable();
        updateStats();
        showToast(`✓ Berhasil mengimpor ${data.inserted || 0} rencana artikel ke database!`, true);
        closeSubmodal('ap-csv-modal');
        return true;
      }
    } catch (err) {
      console.warn('[Article Planner] Bulk API error, client parser fallback:', err);
    }

    // Client fallback parsing
    const parsed = parseClientCSV(csvText);
    if (parsed.length === 0) {
      showToast('✕ Tidak ada baris CSV yang valid.', false);
      return false;
    }
    for (const row of parsed) {
      row.id = 'plan-' + Date.now() + Math.random().toString(36).slice(2, 6);
      row.createdAt = new Date().toISOString();
      row.updatedAt = new Date().toISOString();
      state.plans.unshift(row);
    }
    try {
      localStorage.setItem('ap_article_plans', JSON.stringify(state.plans));
    } catch (_) {}
    renderTable();
    updateStats();
    showToast(`✓ Berhasil mengimpor ${parsed.length} rencana artikel!`, true);
    closeSubmodal('ap-csv-modal');
    return true;
  }

  // =========================================================================
  // 2. Client CSV Parsing Utilities
  // =========================================================================

  function parseClientCSV(text) {
    if (!text || !text.trim()) return [];
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const findIdx = (aliases) => headers.findIndex((h) => aliases.some((a) => h.includes(a)));

    const colKeyphrase = findIdx(['focus keyphrase', 'keyphrase', 'keyword', 'kata kunci']);
    const colRole = findIdx(['page role', 'role', 'peran']);
    const colTitle = findIdx(['article title', 'title', 'judul']);
    const colStatus = findIdx(['status', 'keadaan']);
    const colIntent = findIdx(['intent', 'niat']);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());
      const title = colTitle !== -1 ? parts[colTitle] : '';
      const keyphrase = colKeyphrase !== -1 ? parts[colKeyphrase] : '';
      if (!title && !keyphrase) continue;

      rows.push({
        articleTitle: title || keyphrase,
        focusKeyphrase: keyphrase || title,
        pageRole: normalizePageRole(colRole !== -1 ? parts[colRole] : ''),
        status: normalizeStatus(colStatus !== -1 ? parts[colStatus] : ''),
        intent: normalizeIntent(colIntent !== -1 ? parts[colIntent] : ''),
      });
    }
    return rows;
  }

  function normalizePageRole(raw) {
    const s = (raw || '').toLowerCase();
    if (s.includes('pillar')) return 'Pillar Page';
    if (s.includes('cluster')) return 'Topic Cluster';
    if (s.includes('guide') || s.includes('panduan')) return 'Supporting Guide';
    if (s.includes('case') || s.includes('studi')) return 'Case Study';
    if (s.includes('landing')) return 'Landing Page';
    return 'Topic Cluster';
  }

  function normalizeStatus(raw) {
    const s = (raw || '').toLowerCase();
    if (s.includes('pub') || s.includes('live') || s.includes('terbit')) return 'Published';
    if (s.includes('sched') || s.includes('jadwal')) return 'Scheduled';
    if (s.includes('review') || s.includes('siap')) return 'Ready to Review';
    if (s.includes('prog') || s.includes('tulis') || s.includes('draft')) return 'In Progress';
    return 'Planned';
  }

  function normalizeIntent(raw) {
    const s = (raw || '').toLowerCase();
    if (s.includes('comm') || s.includes('komersial')) return 'Commercial Investigation';
    if (s.includes('trans') || s.includes('beli')) return 'Transactional';
    if (s.includes('nav')) return 'Navigational';
    return 'Informational';
  }

  // =========================================================================
  // 3. UI Construction & Mounting
  // =========================================================================

  function initUI() {
    // 1. Floating Launcher Button
    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'ap-launcher-btn';
    launcher.id = 'ap-btn-launcher';
    launcher.innerHTML = `
      <span>📅 Rencana Artikel</span>
      <span class="ap-launcher-badge" id="ap-launcher-count">0</span>
    `;
    launcher.addEventListener('click', () => openPlanner());
    document.body.appendChild(launcher);

    // 2. Main Modal Backdrop & Window
    const backdrop = document.createElement('div');
    backdrop.className = 'ap-modal-backdrop';
    backdrop.id = 'ap-main-modal';
    backdrop.innerHTML = `
      <div class="ap-window">
        <!-- Header -->
        <div class="ap-header">
          <div class="ap-header-title">
            <span style="font-size:20px;">📅</span>
            <div>
              <h2>Rencana Artikel & Kalender Konten</h2>
              <div style="font-size:11px; color:#94A3B8;">Arsitektur SEO, Peran Halaman, & Sinkronisasi Website Terkini</div>
            </div>
          </div>
          <div class="ap-header-stats">
            <div class="ap-stat-pill" id="ap-stat-total">Total: <strong>0</strong></div>
            <div class="ap-stat-pill active-planned" id="ap-stat-planned">Planned: <strong>0</strong></div>
            <div class="ap-stat-pill active-progress" id="ap-stat-progress">In Progress: <strong>0</strong></div>
            <div class="ap-stat-pill active-published" id="ap-stat-published">Published: <strong>0</strong></div>
          </div>
          <div class="ap-header-actions">
            <button type="button" class="ap-close-btn" id="ap-btn-close-main" title="Tutup">✕</button>
          </div>
        </div>

        <!-- Toolbar & Filter Bar -->
        <div class="ap-toolbar">
          <div class="ap-toolbar-filters">
            <input type="text" class="ap-search-input" id="ap-filter-search" placeholder="🔍 Cari judul, keyphrase, catatan..." />
            
            <select class="ap-select" id="ap-filter-status">
              <option value="all">Semua Status</option>
              <option value="Planned">⏳ Planned (Rencana)</option>
              <option value="In Progress">✍️ In Progress</option>
              <option value="Ready to Review">👀 Ready to Review</option>
              <option value="Scheduled">⏰ Scheduled</option>
              <option value="Published">🚀 Published (Live)</option>
            </select>

            <select class="ap-select" id="ap-filter-role">
              <option value="all">Semua Peran Halaman</option>
              <option value="Pillar Page">🏛️ Pillar Page</option>
              <option value="Topic Cluster">🌿 Topic Cluster</option>
              <option value="Supporting Guide">📘 Supporting Guide</option>
              <option value="Case Study">📊 Case Study</option>
              <option value="Landing Page">🎯 Landing Page</option>
            </select>

            <select class="ap-select" id="ap-filter-intent">
              <option value="all">Semua Intent</option>
              <option value="Informational">Informational</option>
              <option value="Commercial Investigation">Commercial</option>
              <option value="Transactional">Transactional</option>
              <option value="Navigational">Navigational</option>
            </select>
          </div>

          <div class="ap-toolbar-actions">
            <button type="button" class="ap-btn ap-btn-primary" id="ap-btn-add-plan">
              <span>➕ Tambah Rencana</span>
            </button>
            <button type="button" class="ap-btn ap-btn-csv" id="ap-btn-open-csv">
              <span>📥 Impor CSV</span>
            </button>
            <button type="button" class="ap-btn ap-btn-sync" id="ap-btn-sync-website" title="Sinkronkan status dengan artikel website (src/content/articles)">
              <span>🔄 Sinkronkan Website</span>
            </button>
            <button type="button" class="ap-btn ap-btn-secondary" id="ap-btn-export-csv" title="Unduh CSV">
              <span>📤 Ekspor</span>
            </button>
          </div>
        </div>

        <!-- Table View -->
        <div class="ap-table-container">
          <table class="ap-table">
            <thead>
              <tr>
                <th style="width:20%;">Focus Keyphrase</th>
                <th style="width:14%;">Page Role</th>
                <th style="width:32%;">Article Title</th>
                <th style="width:12%;">Status</th>
                <th style="width:10%;">Intent</th>
                <th style="width:12%; text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody id="ap-table-body">
              <!-- Dynamically populated -->
            </tbody>
          </table>
          <div id="ap-empty-state" style="display:none; text-align:center; padding:50px 20px; color:#94A3B8;">
            <div style="font-size:36px; margin-bottom:10px;">📝</div>
            <div style="font-size:15px; font-weight:600; color:#F8FAFC;">Belum ada rencana artikel yang cocok</div>
            <div style="font-size:12px; margin-top:4px;">Klik "Tambah Rencana", "Impor CSV", atau "Sinkronkan Website" di atas.</div>
          </div>
        </div>

        <!-- Submodal: Add / Edit Plan -->
        <div class="ap-submodal" id="ap-form-modal">
          <div class="ap-submodal-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 id="ap-form-title" style="margin:0; font-size:16px; font-weight:700;">Tambah Rencana Artikel</h3>
              <button type="button" class="ap-close-btn" id="ap-btn-close-form">✕</button>
            </div>

            <form id="ap-plan-form">
              <input type="hidden" id="ap-input-id" value="" />

              <div class="ap-form-group">
                <label class="ap-form-label">Judul Artikel (Article Title) *</label>
                <input type="text" class="ap-form-input" id="ap-input-title" placeholder="e.g. Panduan Lengkap Generative Engine Optimization 2026" required />
              </div>

              <div class="ap-form-group">
                <label class="ap-form-label">Focus Keyphrase *</label>
                <input type="text" class="ap-form-input" id="ap-input-keyphrase" placeholder="e.g. Generative Engine Optimization" required />
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="ap-form-group">
                  <label class="ap-form-label">Peran Halaman (Page Role)</label>
                  <select class="ap-form-input" id="ap-input-role">
                    <option value="Pillar Page">🏛️ Pillar Page (Panduan Komprehensif)</option>
                    <option value="Topic Cluster" selected>🌿 Topic Cluster (Topik Pendukung)</option>
                    <option value="Supporting Guide">📘 Supporting Guide (Tutorial Teknis)</option>
                    <option value="Case Study">📊 Case Study (Studi Kasus)</option>
                    <option value="Landing Page">🎯 Landing Page (Halaman Konversi)</option>
                  </select>
                </div>

                <div class="ap-form-group">
                  <label class="ap-form-label">Status Artikel</label>
                  <select class="ap-form-input" id="ap-input-status">
                    <option value="Planned" selected>⏳ Planned (Rencana)</option>
                    <option value="In Progress">✍️ In Progress (Sedang Ditulis)</option>
                    <option value="Ready to Review">👀 Ready to Review</option>
                    <option value="Scheduled">⏰ Scheduled (Terjadwal)</option>
                    <option value="Published">🚀 Published (Sudah Terbit)</option>
                  </select>
                </div>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="ap-form-group">
                  <label class="ap-form-label">Search Intent</label>
                  <select class="ap-form-input" id="ap-input-intent">
                    <option value="Informational" selected>Informational (Edukasi / Konseptual)</option>
                    <option value="Commercial Investigation">Commercial (Evaluasi / Perbandingan)</option>
                    <option value="Transactional">Transactional (Konversi / Order)</option>
                    <option value="Navigational">Navigational (Brand / Identitas)</option>
                  </select>
                </div>

                <div class="ap-form-group">
                  <label class="ap-form-label">Target Kata (Estimasi)</label>
                  <input type="number" class="ap-form-input" id="ap-input-words" value="2500" min="500" step="100" />
                </div>
              </div>

              <div class="ap-form-group">
                <label class="ap-form-label">Catatan & Sudut Pandang (Notes / Angles)</label>
                <textarea class="ap-form-textarea" id="ap-input-notes" rows="3" placeholder="Sudut pandang artikel, target audiens, poin-poin yang wajib dimasukkan..."></textarea>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                <button type="button" class="ap-btn ap-btn-secondary" id="ap-btn-cancel-form">Batal</button>
                <button type="submit" class="ap-btn ap-btn-primary" id="ap-btn-submit-form">Simpan Rencana</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Submodal: CSV Bulk Import -->
        <div class="ap-submodal" id="ap-csv-modal">
          <div class="ap-submodal-card" style="max-width:750px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <h3 style="margin:0; font-size:16px; font-weight:700;">📥 Impor Rencana Artikel Massal (CSV)</h3>
              <button type="button" class="ap-close-btn" id="ap-btn-close-csv">✕</button>
            </div>

            <p style="font-size:12px; color:#94A3B8; margin-top:0;">
              Impor puluhan rencana artikel sekaligus dari file CSV. Format header yang didukung:
              <code style="background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; color:#FBBF24;">Focus Keyphrase, Page Role, Article Title, Status, Intent</code>.
            </p>

            <div class="ap-dropzone" id="ap-csv-dropzone">
              <input type="file" id="ap-csv-file-input" accept=".csv,text/csv" style="display:none;" />
              <div style="font-size:32px; margin-bottom:6px;">📄</div>
              <div style="font-size:14px; font-weight:600; color:#F8FAFC;">Tarik & lepaskan file .CSV ke sini, atau klik untuk memilih file</div>
              <div style="font-size:11px; color:#94A3B8; margin-top:4px;">Mendukung pemisah koma (,), titik koma (;), atau tab</div>
            </div>

            <div style="margin-top:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label class="ap-form-label" style="margin:0;">Atau Tempel (Paste) Teks CSV Langsung:</label>
                <button type="button" class="ap-btn ap-btn-secondary" id="ap-btn-download-template" style="padding:4px 8px; font-size:11px;">
                  📋 Unduh Contoh Template CSV
                </button>
              </div>
              <textarea class="ap-form-textarea" id="ap-csv-paste-area" rows="4" placeholder="Focus Keyphrase,Page Role,Article Title,Status,Intent&#10;Generative Engine Optimization,Pillar Page,Panduan GEO Lengkap 2026,Planned,Informational&#10;Technical SEO Audit,Topic Cluster,Cara Audit SEO Teknis,In Progress,Informational"></textarea>
            </div>

            <!-- CSV Preview Table -->
            <div id="ap-csv-preview-container" style="display:none; margin-top:16px;">
              <div style="font-size:12px; font-weight:700; color:#10B981; margin-bottom:6px;" id="ap-csv-preview-count">Pratinjau Data:</div>
              <div style="max-height:160px; overflow-y:auto; border:1px solid var(--ap-border); border-radius:6px;">
                <table class="ap-table" style="font-size:11px;">
                  <thead>
                    <tr>
                      <th>Focus Keyphrase</th>
                      <th>Role</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Intent</th>
                    </tr>
                  </thead>
                  <tbody id="ap-csv-preview-tbody"></tbody>
                </table>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
              <button type="button" class="ap-btn ap-btn-secondary" id="ap-btn-cancel-csv">Batal</button>
              <button type="button" class="ap-btn ap-btn-primary" id="ap-btn-confirm-import" disabled>
                🚀 Konfirmasi & Simpan ke Database
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
    document.body.appendChild(backdrop);

    // 3. Toast
    const toast = document.createElement('div');
    toast.className = 'ap-toast';
    toast.id = 'ap-toast';
    document.body.appendChild(toast);

    bindEvents();
    fetchPlans();
  }

  // =========================================================================
  // 4. Event Listeners & Interactions
  // =========================================================================

  function bindEvents() {
    // Open/Close main modal
    document.getElementById('ap-btn-close-main')?.addEventListener('click', () => closePlanner());
    document.getElementById('ap-main-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'ap-main-modal') closePlanner();
    });

    // Filters
    document.getElementById('ap-filter-search')?.addEventListener('input', (e) => {
      state.filterSearch = e.target.value.toLowerCase().trim();
      renderTable();
    });

    document.getElementById('ap-filter-status')?.addEventListener('change', (e) => {
      state.filterStatus = e.target.value;
      renderTable();
    });

    document.getElementById('ap-filter-role')?.addEventListener('change', (e) => {
      state.filterRole = e.target.value;
      renderTable();
    });

    document.getElementById('ap-filter-intent')?.addEventListener('change', (e) => {
      state.filterIntent = e.target.value;
      renderTable();
    });

    // Add Plan Button
    document.getElementById('ap-btn-add-plan')?.addEventListener('click', () => {
      openAddForm();
    });

    // Form Modal Actions
    document.getElementById('ap-btn-close-form')?.addEventListener('click', () => closeSubmodal('ap-form-modal'));
    document.getElementById('ap-btn-cancel-form')?.addEventListener('click', () => closeSubmodal('ap-form-modal'));

    document.getElementById('ap-plan-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('ap-input-id').value;
      const title = document.getElementById('ap-input-title').value.trim();
      const keyphrase = document.getElementById('ap-input-keyphrase').value.trim();
      const role = document.getElementById('ap-input-role').value;
      const planStatus = document.getElementById('ap-input-status').value;
      const intent = document.getElementById('ap-input-intent').value;
      const words = parseInt(document.getElementById('ap-input-words').value, 10) || 2500;
      const notes = document.getElementById('ap-input-notes').value.trim();

      if (!title || !keyphrase) {
        showToast('✕ Harap isi Judul Artikel dan Focus Keyphrase.', false);
        return;
      }

      const planData = {
        id: id || undefined,
        articleTitle: title,
        focusKeyphrase: keyphrase,
        pageRole: role,
        status: planStatus,
        intent: intent,
        targetWordCount: words,
        notes: notes || undefined,
      };

      await savePlanToDb(planData);
      showToast(`✓ Berhasil ${id ? 'memperbarui' : 'menambahkan'} rencana artikel!`, true);
      closeSubmodal('ap-form-modal');
    });

    // Sync Website Articles
    document.getElementById('ap-btn-sync-website')?.addEventListener('click', () => {
      syncWebsiteArticles();
    });

    // Export CSV
    document.getElementById('ap-btn-export-csv')?.addEventListener('click', () => {
      exportPlansToCsv();
    });

    // CSV Modal Actions
    document.getElementById('ap-btn-open-csv')?.addEventListener('click', () => {
      openCsvModal();
    });
    document.getElementById('ap-btn-close-csv')?.addEventListener('click', () => closeSubmodal('ap-csv-modal'));
    document.getElementById('ap-btn-cancel-csv')?.addEventListener('click', () => closeSubmodal('ap-csv-modal'));

    // Download Sample Template
    document.getElementById('ap-btn-download-template')?.addEventListener('click', () => {
      downloadSampleCsv();
    });

    // CSV File Upload / Dropzone
    const dropzone = document.getElementById('ap-csv-dropzone');
    const fileInput = document.getElementById('ap-csv-file-input');

    dropzone?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleCsvFile(e.dataTransfer.files[0]);
      }
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleCsvFile(e.target.files[0]);
      }
    });

    // CSV Paste Area
    const pasteArea = document.getElementById('ap-csv-paste-area');
    if (pasteArea) {
      const handlePasteInput = () => processCsvText(pasteArea.value);
      ['input', 'change', 'keyup', 'paste'].forEach((evt) => {
        pasteArea.addEventListener(evt, () => setTimeout(handlePasteInput, 20));
      });
    }

    // Confirm Import Button
    document.getElementById('ap-btn-confirm-import')?.addEventListener('click', async () => {
      const pasteText = document.getElementById('ap-csv-paste-area').value;
      if (pasteText && pasteText.trim()) {
        await bulkImportCsv(pasteText);
      }
    });
  }

  // =========================================================================
  // 5. Render Functions
  // =========================================================================

  function renderTable() {
    const tbody = document.getElementById('ap-table-body');
    const emptyState = document.getElementById('ap-empty-state');
    if (!tbody) return;

    const filtered = state.plans.filter((p) => {
      // Search
      if (state.filterSearch) {
        const query = state.filterSearch;
        const matchesTitle = (p.articleTitle || '').toLowerCase().includes(query);
        const matchesKeyphrase = (p.focusKeyphrase || '').toLowerCase().includes(query);
        const matchesNotes = (p.notes || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesKeyphrase && !matchesNotes) return false;
      }
      // Status
      if (state.filterStatus !== 'all' && p.status !== state.filterStatus) return false;
      // Role
      if (state.filterRole !== 'all' && p.pageRole !== state.filterRole) return false;
      // Intent
      if (state.filterIntent !== 'all' && p.intent !== state.filterIntent) return false;
      return true;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    filtered.forEach((plan) => {
      const tr = document.createElement('tr');

      // 1. Focus Keyphrase
      const tdKeyphrase = document.createElement('td');
      tdKeyphrase.innerHTML = `<span class="ap-keyphrase-chip">🔑 ${escapeHtml(plan.focusKeyphrase || '-')}</span>`;
      tr.appendChild(tdKeyphrase);

      // 2. Page Role
      const tdRole = document.createElement('td');
      const roleClass = getRoleBadgeClass(plan.pageRole);
      tdRole.innerHTML = `<span class="ap-role-badge ${roleClass}">${escapeHtml(plan.pageRole || 'Topic Cluster')}</span>`;
      tr.appendChild(tdRole);

      // 3. Article Title
      const tdTitle = document.createElement('td');
      const liveLinkHtml = plan.liveUrl
        ? `<a href="${plan.liveUrl}" target="_blank" title="Lihat artikel terbit">🔗 ${plan.liveUrl}</a>`
        : (plan.slug ? `<span style="opacity:0.7;">Slug: /${escapeHtml(plan.slug)}</span>` : '');
      const wordCountHint = plan.targetWordCount ? `<span>~ ${plan.targetWordCount} kata</span>` : '';
      tdTitle.innerHTML = `
        <div class="ap-title-main">${escapeHtml(plan.articleTitle)}</div>
        <div class="ap-title-meta">
          ${liveLinkHtml}
          ${wordCountHint}
          ${plan.notes ? `<span title="${escapeHtml(plan.notes)}">📝 Catatan</span>` : ''}
        </div>
      `;
      tr.appendChild(tdTitle);

      // 4. Status
      const tdStatus = document.createElement('td');
      const statusClass = getStatusClass(plan.status);
      tdStatus.innerHTML = `
        <span class="ap-status-pill ${statusClass}">
          ${getStatusIcon(plan.status)} ${escapeHtml(plan.status || 'Planned')}
        </span>
      `;
      tr.appendChild(tdStatus);

      // 5. Intent
      const tdIntent = document.createElement('td');
      tdIntent.innerHTML = `<span class="ap-intent-badge">${escapeHtml(plan.intent || 'Informational')}</span>`;
      tr.appendChild(tdIntent);

      // 6. Action
      const tdAction = document.createElement('td');
      tdAction.style.textAlign = 'right';
      tdAction.innerHTML = `
        <div class="ap-action-group" style="justify-content:flex-end;">
          <button type="button" class="ap-btn-action ap-btn-action-ai" data-ai-id="${plan.id}" title="Tulis artikel ini di AI Article Studio">
            ⚡ Tulis AI
          </button>
          <button type="button" class="ap-btn-action" data-edit-id="${plan.id}" title="Edit Rencana">
            ✏️
          </button>
          <button type="button" class="ap-btn-action ap-btn-action-delete" data-del-id="${plan.id}" title="Hapus Rencana">
            🗑️
          </button>
        </div>
      `;
      tr.appendChild(tdAction);

      // Bind row action events
      tdAction.querySelector('[data-ai-id]')?.addEventListener('click', () => {
        writeWithAiStudio(plan);
      });
      tdAction.querySelector('[data-edit-id]')?.addEventListener('click', () => {
        openEditForm(plan);
      });
      tdAction.querySelector('[data-del-id]')?.addEventListener('click', () => {
        if (confirm(`Hapus rencana artikel "${plan.articleTitle}"?`)) {
          deletePlanFromDb(plan.id);
          showToast('✓ Rencana artikel telah dihapus.', true);
        }
      });

      tbody.appendChild(tr);
    });
  }

  function updateStats() {
    const total = state.plans.length;
    const planned = state.plans.filter((p) => p.status === 'Planned').length;
    const progress = state.plans.filter((p) => p.status === 'In Progress').length;
    const published = state.plans.filter((p) => p.status === 'Published').length;

    const elTotal = document.getElementById('ap-stat-total');
    const elPlanned = document.getElementById('ap-stat-planned');
    const elProgress = document.getElementById('ap-stat-progress');
    const elPublished = document.getElementById('ap-stat-published');

    if (elTotal) elTotal.innerHTML = `Total: <strong>${total}</strong>`;
    if (elPlanned) elPlanned.innerHTML = `Planned: <strong>${planned}</strong>`;
    if (elProgress) elProgress.innerHTML = `In Progress: <strong>${progress}</strong>`;
    if (elPublished) elPublished.innerHTML = `Published: <strong>${published}</strong>`;
  }

  function updateLauncherBadge() {
    const countEl = document.getElementById('ap-launcher-count');
    if (countEl) {
      countEl.textContent = state.plans.length;
    }
  }

  // =========================================================================
  // 6. Modal Open / Close Logic
  // =========================================================================

  function openPlanner() {
    state.isOpen = true;
    const modal = document.getElementById('ap-main-modal');
    if (modal) modal.classList.add('active');
    fetchPlans();
  }

  function closePlanner() {
    state.isOpen = false;
    const modal = document.getElementById('ap-main-modal');
    if (modal) modal.classList.remove('active');
  }

  function openAddForm() {
    state.editingPlanId = null;
    document.getElementById('ap-form-title').textContent = '➕ Tambah Rencana Artikel';
    document.getElementById('ap-input-id').value = '';
    document.getElementById('ap-input-title').value = '';
    document.getElementById('ap-input-keyphrase').value = '';
    document.getElementById('ap-input-role').value = 'Topic Cluster';
    document.getElementById('ap-input-status').value = 'Planned';
    document.getElementById('ap-input-intent').value = 'Informational';
    document.getElementById('ap-input-words').value = '2500';
    document.getElementById('ap-input-notes').value = '';
    openSubmodal('ap-form-modal');
  }

  function openEditForm(plan) {
    state.editingPlanId = plan.id;
    document.getElementById('ap-form-title').textContent = '✏️ Edit Rencana Artikel';
    document.getElementById('ap-input-id').value = plan.id;
    document.getElementById('ap-input-title').value = plan.articleTitle;
    document.getElementById('ap-input-keyphrase').value = plan.focusKeyphrase;
    document.getElementById('ap-input-role').value = plan.pageRole || 'Topic Cluster';
    document.getElementById('ap-input-status').value = plan.status || 'Planned';
    document.getElementById('ap-input-intent').value = plan.intent || 'Informational';
    document.getElementById('ap-input-words').value = plan.targetWordCount || 2500;
    document.getElementById('ap-input-notes').value = plan.notes || '';
    openSubmodal('ap-form-modal');
  }

  function openCsvModal() {
    document.getElementById('ap-csv-paste-area').value = '';
    document.getElementById('ap-csv-preview-container').style.display = 'none';
    document.getElementById('ap-btn-confirm-import').disabled = true;
    openSubmodal('ap-csv-modal');
  }

  function openSubmodal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function closeSubmodal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  // =========================================================================
  // 7. CSV Processing & Template
  // =========================================================================

  function handleCsvFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      document.getElementById('ap-csv-paste-area').value = text;
      processCsvText(text);
    };
    reader.readAsText(file);
  }

  function processCsvText(text) {
    const rows = parseClientCSV(text);
    state.pendingCsvRows = rows;
    const confirmBtn = document.getElementById('ap-btn-confirm-import');
    const previewContainer = document.getElementById('ap-csv-preview-container');
    const previewTbody = document.getElementById('ap-csv-preview-tbody');
    const previewCount = document.getElementById('ap-csv-preview-count');

    if (rows.length > 0) {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = `🚀 Konfirmasi & Simpan ${rows.length} Rencana ke Database`;
      }
      if (previewCount) {
        previewCount.textContent = `Pratinjau Data (${rows.length} baris valid siap diimpor):`;
      }
      if (previewTbody) {
        previewTbody.innerHTML = rows
          .slice(0, 5)
          .map(
            (r) => `
            <tr>
              <td>${escapeHtml(r.focusKeyphrase)}</td>
              <td>${escapeHtml(r.pageRole)}</td>
              <td>${escapeHtml(r.articleTitle)}</td>
              <td>${escapeHtml(r.status)}</td>
              <td>${escapeHtml(r.intent)}</td>
            </tr>
          `
          )
          .join('');
        if (rows.length > 5) {
          previewTbody.innerHTML += `<tr><td colspan="5" style="text-align:center; color:#94A3B8;">... dan ${rows.length - 5} baris lainnya</td></tr>`;
        }
      }
      if (previewContainer) previewContainer.style.display = 'block';
    } else {
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = '🚀 Konfirmasi & Simpan ke Database';
      }
      if (previewContainer) previewContainer.style.display = 'none';
    }
  }

  function downloadSampleCsv() {
    const csvContent = `Focus Keyphrase,Page Role,Article Title,Status,Intent
Generative Engine Optimization (GEO),Pillar Page,Panduan Lengkap Generative Engine Optimization 2026,Planned,Informational
Technical SEO Audit,Topic Cluster,Langkah demi Langkah Audit SEO Teknis untuk Pertumbuhan Organik,In Progress,Informational
Schema Entity Graph,Supporting Guide,Cara Membangun Schema @id untuk AI Overviews,Planned,Informational
B2B SEO Case Study,Case Study,Studi Kasus Pertumbuhan Trafik B2B SaaS 310%,Published,Commercial Investigation
Jasa Konsultan SEO,Landing Page,Layanan Konsultan SEO Teknis & GEO Profesional,Planned,Transactional`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-rencana-artikel.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('✓ Template CSV berhasil diunduh!', true);
  }

  function exportPlansToCsv() {
    if (state.plans.length === 0) {
      showToast('Belum ada rencana artikel untuk diekspor.', false);
      return;
    }
    const headers = ['Focus Keyphrase', 'Page Role', 'Article Title', 'Status', 'Intent', 'Slug', 'Live URL', 'Notes'];
    const rows = state.plans.map((p) => [
      escapeCsv(p.focusKeyphrase),
      escapeCsv(p.pageRole),
      escapeCsv(p.articleTitle),
      escapeCsv(p.status),
      escapeCsv(p.intent),
      escapeCsv(p.slug || ''),
      escapeCsv(p.liveUrl || ''),
      escapeCsv(p.notes || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rencana-artikel-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('✓ Berhasil mengekspor rencana artikel ke CSV!', true);
  }

  function escapeCsv(val) {
    const s = String(val || '').replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  }

  // =========================================================================
  // 8. AI Article Studio Integration
  // =========================================================================

  function writeWithAiStudio(plan) {
    closePlanner();

    if (window.DecapAIStudio) {
      // Pre-fill state
      window.DecapAIStudio.state.topic = plan.articleTitle;
      window.DecapAIStudio.state.primaryKeyword = plan.focusKeyphrase;
      window.DecapAIStudio.state.focusKeyphrases = [plan.focusKeyphrase];

      // Update Topic input in AI Studio drawer if mounted
      const topicInput = document.getElementById('ai-topic-input');
      if (topicInput) topicInput.value = plan.articleTitle;

      // Add keyphrase chip in AI Studio
      const chipContainer = document.getElementById('ai-chips-container');
      const hiddenInput = document.getElementById('ai-focus-keyphrases-input');
      if (chipContainer && hiddenInput) {
        chipContainer.innerHTML = '';
        const chip = document.createElement('div');
        chip.className = 'ai-chip';
        chip.innerHTML = `${escapeHtml(plan.focusKeyphrase)} <button type="button" class="ai-chip-remove">×</button>`;
        chip.querySelector('.ai-chip-remove')?.addEventListener('click', () => chip.remove());
        chipContainer.appendChild(chip);
        hiddenInput.value = plan.focusKeyphrase;
      }

      // Open AI Article Studio
      window.DecapAIStudio.open();
      showToast(`⚡ Membuka AI Article Studio untuk "${plan.articleTitle}"...`, true);

      // Auto update plan status to 'In Progress' if currently 'Planned'
      if (plan.status === 'Planned') {
        savePlanToDb({ id: plan.id, status: 'In Progress' });
      }
    } else {
      try {
        sessionStorage.setItem('ap_tulis_ai_plan', JSON.stringify(plan));
        window.location.href = '/admin/#/collections/articles/new';
      } catch (_) {
        showToast('AI Article Studio sedang dimuat, silakan coba sesaat lagi.', false);
      }
    }
  }

  // =========================================================================
  // 9. Helpers & Badges
  // =========================================================================

  function getRoleBadgeClass(role) {
    switch (role) {
      case 'Pillar Page': return 'ap-role-pillar';
      case 'Topic Cluster': return 'ap-role-cluster';
      case 'Supporting Guide': return 'ap-role-guide';
      case 'Case Study': return 'ap-role-case';
      case 'Landing Page': return 'ap-role-landing';
      default: return 'ap-role-cluster';
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case 'Planned': return 'ap-status-planned';
      case 'In Progress': return 'ap-status-in-progress';
      case 'Ready to Review': return 'ap-status-ready';
      case 'Scheduled': return 'ap-status-scheduled';
      case 'Published': return 'ap-status-published';
      default: return 'ap-status-planned';
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'Planned': return '⏳';
      case 'In Progress': return '✍️';
      case 'Ready to Review': return '👀';
      case 'Scheduled': return '⏰';
      case 'Published': return '🚀';
      default: return '•';
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg, isSuccess = true) {
    const toast = document.getElementById('ap-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.borderColor = isSuccess ? '#10B981' : '#F43F5E';
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  // Expose API globally
  const plannerAPI = {
    state,
    open: openPlanner,
    close: closePlanner,
    fetchPlans,
    savePlan: savePlanToDb,
    deletePlan: deletePlanFromDb,
    syncWebsiteArticles,
    bulkImportCsv,
    writeWithAiStudio,
    showToast,
  };

  if (typeof window !== 'undefined') {
    window.ArticlePlanner = plannerAPI;
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }

  console.log('[Article Planner] Engine loaded successfully with SQLite & CSV Import support.');
})();
