# Changelog

All notable changes to this plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-beta.3] - 2026-11-04

### Added
- **Scan and parameters** — Plugin settings show Scan for articles beside Blog Path. The dashboard sidebar has the same scan, plus Parameters, which opens the plugin settings. The scan counts every child folder that contains an article, including folders without a numeric prefix.
- **Languages** — Spanish, Italian, and German join English and French. Dashboard toasts, API messages, dates, the blog-path field, and the sidebar label use the active language. Blueprint labels also cover Admin2 regional codes such as `de-DE`, `es-ES`, and `it-IT`.

### Changed
- **API events** — `onApiRegisterRoutes`, `onApiSidebarItems`, and `onApiPluginPageInfo` are subscribed directly. The plugin no longer gates them on Admin2 being enabled, and it no longer logs those checks.
- **Dependencies** — Grav `>=2.0.0`, API `>=1.0.0`, and Admin2 `>=2.0.0`. PHP 8.3, because that is what Grav 2 requires.
- **Status messages** — Failures and import success use Admin2 toasts instead of browser alerts.
- **Dark mode** — The light dashboard is unchanged. When Admin2 adds `dark` on the page, the same screen uses Admin2’s dark colors, including a later switch back to light.
- **Languages in the list** — Each `item.md` and `item.{lang}.md` is its own card. Edit opens that language. Publish and visible apply to that file. Delete, duplicate, and export still act on the whole folder.

### Removed
- **Scan on init** — The setting only stored a folder the dashboard never read. The post list still resolves Blog Path on each request.
- **Unused page handlers** — `pluginPage` and `pageScript` were not registered.

### Fixed
- **Edit links** — Folder segments are URL-encoded, and card and list links escape the URL in `href`.
- **Card images** — Hero and cover images use the page file URL. The previous API image address answered 401 to the card `<img>`, which does not send the admin token. `hero_image` is preferred when a post has one.
- **Plugins list** — Restored `blog-manager.yaml`. Grav omits a plugin from the Plugins page when that default config file is missing. The sidebar does not use it, which is why the menu item stayed.

## [2.0.0-beta.2] - 2026-11-03

### Added
- **Sidebar Export All and Import** — Export All downloads every loaded post. Import accepts a ZIP of post folders.
- **Permissions** — `blog-manager.posts.read`, `write`, `delete`, and `export`, with English and French labels.
- **Thumbnail route** — `GET /posts/{folder}/image` serves a raster image from the post folder.
- **PHPUnit** — `composer test` covers path confinement, ZIP import, the parsed JSON body, and the image-route folder parameter.

### Changed
- **Admin2 only in code** — Removed the Admin 1.x event handlers, the pages context panel, and the blueprint-field handler.
- **Edit links** — Built from `plugins.admin2.route`, so they follow `/admin` or `/admin2`.
- **Export** — Streams the ZIP in the API response. The response no longer returns a temporary file URL.
- **Import** — Copies only post folders into the blog directory. An existing folder name is saved with an `-import-` suffix.
- **Package metadata** — Version `2.0.0-beta.2`. Dependency is `admin2 >=2.0.0`. Homepage, bugs, and docs point at `DrDroid-FR/grav-plugin-blog-manager`.

### Fixed
- **Path confinement** — Delete, duplicate, and export stay inside the blog directory. A sibling folder whose name starts with the blog folder name is not treated as inside it.
- **Bulk Publish and Visible** — One click toggles the field once.
- **Shift+click** — Range selection reads the Shift key from the click, and the checkbox mark follows the selection.

## [2.0.0-beta] - 2026-10-09

### Changed
- **Major: Admin2 only** — Dropped support for Grav 1.x / Admin 1.x entirely. Plugin now requires Grav 2.0+ and Admin 2.0+ (Admin Next SPA).
- **Architecture rewrite** — Migrated from Admin 1.x Twig templates + jQuery to Admin2 web component (`<blog-manager>`) using native Shadow DOM, `fetch()` API, and inline SVG icons.
- **Removed legacy files** — Deleted `admin/`, `templates/`, `languages/`, `pages/`, `assets/blog-manager.js`, `blog-manager.yaml`, and backup files.
- **Blueprints updated** — Added explicit dependencies: `grav >=2.0.0`, `admin >=2.0.0`.

### Added
- **Web component** (`admin-next/pages/blog-manager.js`) — Self-contained custom element with:
  - Three view modes (grid, small grid, list) persisted in `sessionStorage`
  - Filter panel with search, published, visible, category, tag, language, date begin/end
  - Native HTML5 date inputs for date range filtering (replaced custom calendar widget)
  - Multi-select with Ctrl+click / Shift+click, bulk actions bar
  - Inline status toggles (published/visible) with optimistic UI updates
  - Skeleton loading placeholders with shimmer animation
  - Export and import via ZIP
  - English and French strings in the web component
- **API Controller** (`classes/BlogManagerApiController.php`) — Clean separation of API endpoints:
  - `GET /posts` — List posts with metadata
  - `POST /posts/new` — Create new post folder + frontmatter
  - `POST /posts/delete` — Delete post folder
  - `POST /posts/toggle` — Toggle published/visible
  - `POST /posts/duplicate` — Duplicate post
  - `POST /scan` — Re-scan blog folder
  - `POST /export` — Export posts as ZIP
  - `POST /import` — Import posts from ZIP
- **Admin2 Integration** — Sidebar item, plugin page (component mode), and a pages context panel

### Fixed
- **Date parsing bug** — `parseDateStr` used `const` for variable that was reassigned; changed to `let`
- **Date filter layout** — Stacked date inputs vertically instead of side-by-side

### Technical
- No build step required — web component is a single ES6 module loaded directly by Admin Next
- CSS loaded via API plugin, scoped to shadow DOM
- PHP 8.1+ syntax used throughout

## [1.2.1] - 2026-04-15 (Legacy 1.x branch)

### Changed
- Replaced range calendar with two date input fields (Begin Date, End Date) for date filtering.

### Added
- Language filter: Filter posts by language (based on `item.{lang}.md` files).
- Language display: 2-letter language badge on card thumbnails and in list view column.

### Fixed
- Error handling around YAML parsing to gracefully handle malformed frontmatter without 500 errors.
- File existence checks to prevent crashes on unreadable post files.

## [1.2.0] - 2026-04-04 (Legacy 1.x branch)

### Added
- Export/Import: Export all or selected posts as ZIP. Import posts from ZIP with automatic folder creation and duplicate name handling.
- Loading placeholders: replaces spinner with shimmer animation cards/list rows.
- Card view tags now render as colored pills.

### Changed
- Fixed date range filter to properly normalize `dd/mm/yyyy` dates to `yyyy-mm-dd` before comparison.

## [1.1.1] - 2026-04-02 (Legacy 1.x branch)

### Added
- Complete French translation.
- File structure documentation in README.

### Changed
- All UI strings replaced with translation filter calls (Twig) and `T` helper object (JS).
- CSS extracted to external file.

### Removed
- Unused functions and `permissions` section from `blog-manager.yaml`.

### Fixed
- Missing translation key.

## [1.1.0] - 2026-03-29 (Legacy 1.x branch)

### Added
- Blog detection: Numeric prefix folder detection (e.g. `03.blog` → `blog`), auto-detect on init with `scan_on_init` setting.
- Language support: `findItemFile()` locates `item.md` or `item.{lang}.md` for multilingual blogs.
- Image detection: Auto-detects from frontmatter (primaryImage, image, header_image_file, etc.) with fallback to first media file and Grav logo placeholder.
- Multi-select: Ctrl+click to toggle, Shift+click for range selection.
- Bulk actions: Publish, Visible, Duplicate, Delete with confirmation modals.
- Image cache-busting: `?v=<filemtime>` to prevent stale browser cache.

### Changed
- `setView()` now CSS-only (no DOM re-render).
- List view responsive: hides excerpt, visible, date, tags progressively on narrow viewports.
- Titlebar h1 reset `transform` to cancel Grav admin offset.

## [1.0.0] - 2026-03-27 (Legacy 1.x branch)

### Added
- Blog Manager admin page with sidebar navigation.
- Three view modes: big cards (2-col), small cards (4-col), list view.
- View mode persistence via `sessionStorage`.
- Post listing: YAML frontmatter parsing, thumbnail display, excerpt extraction.
- Inline status toggle: Click Published/Visible badges to toggle without page reload.
- Post actions: Create new post, duplicate (copies folder, appends "- copy", unpublishes), delete with confirmation modal.
- Filter panel: Search, Published, Visible, Category, Tag, Date Range with range calendar widget.
- Date formatting: Locale-aware using `Intl.DateTimeFormat`, supports multiple formats.
- Blog path auto-detection: Scans `user/pages/` for folder matching configured path.
- Numeric prefix: New posts use numbered folder format (e.g. `08.untitled-post`).
- Bilingual: Full English and French support.

### Technical
- Task-based routing using Grav URI params (`/task:blogManagerList`).
- JSON API responses for all AJAX operations.
- XSS prevention via `escapeHtml` utility.

### Configuration
- Plugin Enabled toggle, Blog Path text input, Auto-detect blog on init toggle, Custom placeholder image upload.

---

**Note:** Versions 1.x are for Grav 1.7 / Admin 1.x only. Version 2.0+ is a complete rewrite for Grav 2.x / Admin 2.x (Admin Next) and is not backward compatible.