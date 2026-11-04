# 2.0.0
## 2026-11-04

1. [](#new)
    * **Scan and parameters** — Plugin settings show Scan for articles beside Blog Path. The dashboard sidebar has the same scan, plus Parameters, which opens the plugin settings. The scan counts every child folder that contains an article, including folders without a numeric prefix.
    * **Languages** — Spanish, Italian, and German join English and French. Dashboard toasts, API messages, dates, the blog-path field, and the sidebar label use the active language. Blueprint labels also cover Admin2 regional codes such as `de-DE`, `es-ES`, and `it-IT`.
2. [](#improved)
    * **API events** — `onApiRegisterRoutes`, `onApiSidebarItems`, and `onApiPluginPageInfo` are subscribed directly. The plugin no longer gates them on Admin2 being enabled, and it no longer logs those checks.
    * **Dependencies** — Grav `>=2.0.0`, API `>=1.0.0`, and Admin2 `>=2.0.0`. PHP 8.3, because that is what Grav 2 requires.
    * **Status messages** — Failures and import success use Admin2 toasts instead of browser alerts.
    * **Dark mode** — The light dashboard is unchanged. When Admin2 adds `dark` on the page, the same screen uses Admin2's dark colors, including a later switch back to light.
    * **Languages in the list** — Each `item.md` and `item.{lang}.md` is its own card. Edit opens that language. Publish and visible apply to that file. Delete, duplicate, and export still act on the whole folder.
    * **Scan on init** — Removed. The setting only stored a folder the dashboard never read. The post list still resolves Blog Path on each request.
    * **Unused page handlers** — Removed `pluginPage` and `pageScript`. They were not registered.
3. [](#bugfix)
    * **Edit links** — Folder segments are URL-encoded, and card and list links escape the URL in `href`.
    * **Card images** — Hero and cover images use the page file URL. The previous API image address answered 401 to the card `<img>`, which does not send the admin token. `hero_image` is preferred when a post has one.
    * **Plugins list** — Restored `blog-manager.yaml`. Grav omits a plugin from the Plugins page when that default config file is missing. The sidebar does not use it, which is why the menu item stayed.

# 2.0.0-beta.2
## 2026-11-03

1. [](#new)
    * **Sidebar Export All and Import** — Export All downloads every loaded post. Import accepts a ZIP of post folders.
    * **Permissions** — `blog-manager.posts.read`, `write`, `delete`, and `export`, with English and French labels.
    * **Thumbnail route** — `GET /posts/{folder}/image` serves a raster image from the post folder.
    * **PHPUnit** — `composer test` covers path confinement, ZIP import, the parsed JSON body, and the image-route folder parameter.
2. [](#improved)
    * **Admin2 only in code** — Removed the Admin 1.x event handlers, the pages context panel, and the blueprint-field handler.
    * **Edit links** — Built from `plugins.admin2.route`, so they follow `/admin` or `/admin2`.
    * **Export** — Streams the ZIP in the API response. The response no longer returns a temporary file URL.
    * **Import** — Copies only post folders into the blog directory. An existing folder name is saved with an `-import-` suffix.
    * **Package metadata** — Version `2.0.0-beta.2`. Dependency is `admin2 >=2.0.0`. Homepage, bugs, and docs point at `DrDroid-FR/grav-plugin-blog-manager`.
3. [](#bugfix)
    * **Path confinement** — Delete, duplicate, and export stay inside the blog directory. A sibling folder whose name starts with the blog folder name is not treated as inside it.
    * **Bulk Publish and Visible** — One click toggles the field once.
    * **Shift+click** — Range selection reads the Shift key from the click, and the checkbox mark follows the selection.

# 2.0.0-beta
## 2026-10-09

1. [](#new)
    * **Web component** (`admin-next/pages/blog-manager.js`) — Self-contained custom element with three view modes (grid, small grid, list) persisted in `sessionStorage`, a filter panel, native HTML5 date inputs, multi-select, inline status toggles, skeleton loading, ZIP export and import, and English and French strings.
    * **API Controller** (`classes/BlogManagerApiController.php`) — `GET /posts`, `POST /posts/new`, `POST /posts/delete`, `POST /posts/toggle`, `POST /posts/duplicate`, `POST /scan`, `POST /export`, and `POST /import`.
    * **Admin2 Integration** — Sidebar item, plugin page (component mode), and a pages context panel.
2. [](#improved)
    * **Admin2 only** — Dropped support for Grav 1.x / Admin 1.x. The plugin requires Grav 2.0+ and Admin 2.0+. Version 2.0+ is a rewrite and is not backward compatible with the 1.x releases below.
    * **Architecture rewrite** — Migrated from Admin 1.x Twig templates and jQuery to an Admin2 web component using Shadow DOM, `fetch()`, and inline SVG icons.
    * **Removed legacy files** — Deleted `admin/`, `templates/`, `languages/`, `pages/`, `assets/blog-manager.js`, `blog-manager.yaml`, and backup files.
    * **Blueprints updated** — Added explicit dependencies: `grav >=2.0.0`, `admin >=2.0.0`.
    * No build step is required. The web component is a single ES6 module. CSS is loaded via the API plugin and scoped to the shadow DOM. PHP 8.1+ syntax is used throughout.
3. [](#bugfix)
    * **Date parsing** — `parseDateStr` used `const` for a variable that was reassigned; changed to `let`.
    * **Date filter layout** — Stacked date inputs vertically instead of side-by-side.

# 1.2.1
## 2026-04-15

1. [](#new)
    * Language filter: filter posts by language, based on `item.{lang}.md` files.
    * Language display: 2-letter language badge on card thumbnails and in the list view column.
2. [](#improved)
    * Legacy 1.x release for Grav 1.7 / Admin 1.x only.
    * Replaced the range calendar with two date input fields (Begin Date, End Date).
3. [](#bugfix)
    * Error handling around YAML parsing, so malformed frontmatter does not cause a 500 error.
    * File existence checks, so an unreadable post file does not crash the page.

# 1.2.0
## 2026-04-04

1. [](#new)
    * Export and import: export all or selected posts as a ZIP. Import posts from a ZIP with automatic folder creation and duplicate name handling.
    * Loading placeholders: shimmer animation cards and list rows replace the spinner.
    * Card view tags now render as colored pills.
2. [](#improved)
    * Legacy 1.x release for Grav 1.7 / Admin 1.x only.
3. [](#bugfix)
    * Date range filter normalizes `dd/mm/yyyy` dates to `yyyy-mm-dd` before comparison.

# 1.1.1
## 2026-04-02

1. [](#new)
    * Complete French translation.
    * File structure documentation in the README.
2. [](#improved)
    * Legacy 1.x release for Grav 1.7 / Admin 1.x only.
    * All UI strings replaced with translation filter calls (Twig) and the `T` helper object (JS).
    * CSS extracted to an external file.
    * Removed unused functions and the `permissions` section from `blog-manager.yaml`.
3. [](#bugfix)
    * Missing translation key.

# 1.1.0
## 2026-03-29

1. [](#new)
    * Blog detection: numeric prefix folder detection (for example `03.blog` matches `blog`), with auto-detect on init and a `scan_on_init` setting.
    * Language support: `findItemFile()` locates `item.md` or `item.{lang}.md` for multilingual blogs.
    * Image detection from frontmatter (`primaryImage`, `image`, `header_image_file`, and others), with a fallback to the first media file and the Grav logo placeholder.
    * Multi-select: Ctrl+click to toggle, Shift+click for a range.
    * Bulk actions: Publish, Visible, Duplicate, and Delete, with confirmation modals.
    * Image cache-busting with `?v=<filemtime>`.
2. [](#improved)
    * Legacy 1.x release for Grav 1.7 / Admin 1.x only.
    * `setView()` is now CSS-only and does not re-render the DOM.
    * List view hides excerpt, visible, date, and tags progressively on narrow viewports.
    * Titlebar `h1` resets `transform` to cancel the Grav admin offset.

# 1.0.0
## 2026-03-27

1. [](#new)
    * Blog Manager admin page with sidebar navigation.
    * Three view modes: big cards (2 columns), small cards (4 columns), and list view.
    * View mode persistence via `sessionStorage`.
    * Post listing with YAML frontmatter parsing, thumbnail display, and excerpt extraction.
    * Inline status toggle: click Published or Visible badges to toggle without a page reload.
    * Post actions: create a new post, duplicate (copies the folder, appends "- copy", unpublishes), and delete with a confirmation modal.
    * Filter panel: Search, Published, Visible, Category, Tag, and Date Range with a range calendar widget.
    * Locale-aware dates using `Intl.DateTimeFormat`.
    * Blog path auto-detection: scans `user/pages/` for a folder matching the configured path.
    * Numeric prefix: new posts use a numbered folder (for example `08.untitled-post`).
    * Full English and French support.
    * Configuration: Plugin Enabled, Blog Path, auto-detect on init, and a custom placeholder image.
2. [](#improved)
    * Legacy 1.x release for Grav 1.7 / Admin 1.x only.
    * Task-based routing using Grav URI params (`/task:blogManagerList`).
    * JSON API responses for AJAX operations.
    * XSS prevention via the `escapeHtml` utility.
