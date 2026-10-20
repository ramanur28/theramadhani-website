# Application Quality Assurance (QA) Matrix

This matrix defines the exhaustive verification contract for the application, covering backend APIs, static site generation, Decap CMS admin integration, and the AI Article Studio features.

---

## 1. Core Web Routes & Static Site Generation
| ID | Area / Route | Scenario | Expected Outcome | Automated Test | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| WEB-01 | `/` | Homepage rendering & navigation | Returns HTTP 200, valid semantic HTML, zero console errors | `tests/live-endpoint.test.ts` | [PASS] |
| WEB-02 | `/about/` | About page content & metadata | Returns HTTP 200, bio and experience rendered | `tests/live-endpoint.test.ts` | [PASS] |
| WEB-03 | `/contact/` | Contact page & consultation form | Returns HTTP 200, contact form inputs rendered | `tests/live-endpoint.test.ts` | [PASS] |
| WEB-04 | `/articles/` | Articles catalog & filtering | Returns HTTP 200, 12 articles indexed with category filter tabs | `tests/live-endpoint.test.ts` | [PASS] |
| WEB-05 | `/articles/[...slug]` | Single article view (e.g. GEO Guide) | Returns HTTP 200, H1, TOC, Quick Answer block, and FAQ accordion rendered | `tests/live-endpoint.test.ts` | [PASS] |
| WEB-06 | `/work/` | Case studies listing | Returns HTTP 200, portfolio cards rendered | `tests/live-endpoint.test.ts` | [PASS] |
| WEB-07 | `/services/*` | Services subpages (SEO, GEO, Ads) | Returns HTTP 200, workflow and deliverables rendered | `tests/live-endpoint.test.ts` | [PASS] |
| WEB-08 | `/rss.xml` & `/sitemap-index.xml` | Feeds & SEO discovery | Returns valid RSS XML and dist sitemap with proper priority tags | `tests/live-endpoint.test.ts` | [PASS] |

---

## 2. Decap CMS & Local Backend Integration
| ID | Area / Feature | Scenario | Expected Outcome | Automated Test | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| CMS-01 | `/admin/` | Decap CMS initialization | Admin loads with config.yml, styles, and proxy server at port 8081 | `tests/live-endpoint.test.ts` | [PASS] |
| CMS-02 | `/api/articles-index` | Live content catalog endpoint | Returns JSON array (>5 articles) with valid URL, title, tags schema | `tests/live-endpoint.test.ts` | [PASS] |
| CMS-03 | `/admin/collections/*` | Clean URL hash router bridge | Sub-routes redirect to `/admin/#/collections/...` without 404 | `tests/live-endpoint.test.ts` | [PASS] |
| CMS-04 | `/api/strategies` | Persistent disk strategy endpoint | Serves and updates `public/admin/strategies.json` on disk | `tests/live-endpoint.test.ts` | [PASS] |

---

## 3. AI Article Studio: Writing Strategy Management (Disk-Persisted CRUD)
| ID | Scenario | Input / Action | Expected Outcome | Automated Test | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| STRAT-01 | Default presets load | Open AI Studio Step 1 | 4 default strategy cards rendered (GEO, Technical, Executive, Tutorial) | `tests/pipeline-stages.test.ts` | [PASS] |
| STRAT-02 | Create custom strategy on disk | Click `+ Tambah Strategi`, enter title, description, AI prompt instructions, save | Custom strategy saved to disk (`public/admin/strategies.json`) via `/api/strategies` (NOT localStorage); card rendered with [Kustom] badge | `tests/pipeline-stages.test.ts` | [PASS] |
| STRAT-03 | Validate strategy inputs | Attempt to save custom strategy with empty title or instructions | Validation warning shown; strategy is not saved | `tests/pipeline-stages.test.ts` | [PASS] |
| STRAT-04 | Edit custom strategy on disk | Click edit icon ✏️ on custom strategy, modify prompt instructions, save | Strategy updated on disk in `public/admin/strategies.json`; UI updates | `tests/pipeline-stages.test.ts` | [PASS] |
| STRAT-05 | Delete custom strategy on disk | Click delete icon 🗑️ on custom strategy | Strategy removed from UI and disk (`public/admin/strategies.json`); fallback to default if was active | `tests/pipeline-stages.test.ts` | [PASS] |
| STRAT-06 | Protect default presets | Inspect default preset cards | Delete/edit buttons are disabled or hidden for default built-in presets | `tests/pipeline-stages.test.ts` | [PASS] |
| STRAT-07 | Custom strategy in generation | Select custom strategy and run Stage 2 Outline / Stage 3 Body | Custom strategy instructions are injected into the AI generation prompt | `tests/pipeline-stages.test.ts` | [PASS] |
| STRAT-08 | Disk persistence verification | Clear browser localStorage or simulate new browser session | Custom strategies still load cleanly from `public/admin/strategies.json` without data loss | `tests/pipeline-stages.test.ts` | [PASS] |

---

## 4. AI Article Studio: Decap CMS Form & FAQ Injection
| ID | Scenario | Input / Action | Expected Outcome | Automated Test | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| INJ-01 | Standard metadata injection | Click `Terapkan ke Editor Decap` | Injects Title, Slug, Description, Quick Answer, Cover Image, Alt, and Slate Body | `tests/decap-injector.test.ts` | [PASS] |
| INJ-02 | FAQ item detection & addition | Synthesized article has 1–5 FAQ items | Locates FAQ list widget in Decap CMS, clicks `Add` button for each item | `tests/decap-injector.test.ts` | [PASS] |
| INJ-03 | FAQ values population | Decap CMS FAQ item inputs rendered | Populates `question-field` and `answer-field` with synthesized Q&A | `tests/decap-injector.test.ts` | [PASS] |
| INJ-04 | FAQ event dispatch | FAQ values populated | Triggers native `input` and `change` events so Decap React state syncs | `tests/decap-injector.test.ts` | [PASS] |
| INJ-05 | Fallback on empty FAQ | Synthesized article has empty FAQ list | Gracefully skips FAQ injection without errors | `tests/decap-injector.test.ts` | [PASS] |
| INJ-06 | Toast confirmation | Form injection completes | Toast includes `FAQ (X item)` in populated fields summary | `tests/decap-injector.test.ts` | [PASS] |

---

## 5. Internal Links Hub & Media
| ID | Scenario | Input / Action | Expected Outcome | Automated Test | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| LNK-01 | Auto-suggest internal links | Focus keyphrases provided | Ranks and selects top matching articles from `/api/articles-index` | `tests/internal-links.test.ts` | [PASS] |
| LNK-02 | Manual internal link addition | Click `+ Tambah Link`, select preset or enter custom URL & anchor | Link added to table, URL normalized, zero form submit interference | `tests/internal-links.test.ts` | [PASS] |
| LNK-03 | Edit & delete internal links | Edit anchor text or click ✕ | Modifies link state or removes row cleanly | `tests/internal-links.test.ts` | [PASS] |
| MED-01 | Vision image upload | Drop or select image file | Generates clean filename, stores to disk, runs vision analysis | `tests/pipeline-stages.test.ts` | [PASS] |
