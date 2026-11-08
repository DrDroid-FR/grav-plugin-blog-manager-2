/**
 * Blog Manager - Web Component for Admin2
 *
 * Custom element: <blog-manager></blog-manager>
 *
 * This component manages blog posts within the Admin2 SPA.
 * It communicates with the Grav API plugin for data operations.
 */

const TAG = window.__GRAV_PAGE_TAG || 'grav-blog-manager--page';

// Derive API base from Admin2 config (guaranteed to exist)
const gravConfig = window.__GRAV_CONFIG__ || {};
const API_SERVER = gravConfig.serverUrl || (typeof window !== 'undefined' ? window.location.origin : '');
const API_PREFIX = gravConfig.apiPrefix || '/api/v1';
const API_BASE = API_SERVER + API_PREFIX + '/blog-manager';

// Inline SVG Icons (no external dependencies)
const Icons = {
    // View modes
    grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    smallGrid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="4" height="4"/><rect x="8" y="2" width="4" height="4"/><rect x="14" y="2" width="4" height="4"/><rect x="20" y="2" width="4" height="4"/><rect x="2" y="8" width="4" height="4"/><rect x="8" y="8" width="4" height="4"/><rect x="14" y="8" width="4" height="4"/><rect x="20" y="8" width="4" height="4"/><rect x="2" y="14" width="4" height="4"/><rect x="8" y="14" width="4" height="4"/><rect x="14" y="14" width="4" height="4"/><rect x="20" y="14" width="4" height="4"/><rect x="2" y="20" width="4" height="4"/><rect x="8" y="20" width="4" height="4"/><rect x="14" y="20" width="4" height="4"/><rect x="20" y="20" width="4" height="4"/></svg>',
    list: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    
    // Actions
    plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    pencil: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    clone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    upload: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    filter: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    times: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    checkCircle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    circle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>',
    eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeSlash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    tags: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    chevronLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    chevronRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    book: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    sliders: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
};

// Translations
const i18n = {
    en: {
        title: 'Blog Manager',
        loading: 'Loading posts...',
        noPosts: 'No blog posts found.',
        newPost: 'New Post',
        exportAll: 'Export All',
        import: 'Import',
        scan: 'Scan for articles',
        parameters: 'Parameters',
        scanFound: '{n} article(s) found',
        scanMissing: 'Blog folder not found',
        filters: 'Filters',
        search: 'Search',
        all: 'All',
        published: 'Published',
        unpublished: 'Unpublished',
        visible: 'Visible',
        hidden: 'Hidden',
        dateBegin: 'Date From',
        dateEnd: 'Date To',
        category: 'Category',
        tag: 'Tag',
        language: 'Language',
        clear: 'Clear',
        colTitle: 'Title',
        colLang: 'Lang',
        colExcerpt: 'Excerpt',
        colDate: 'Date',
        colCategory: 'Category',
        colPublished: 'Publish',
        colVisible: 'Visible',
        colTags: 'Tags',
        colActions: 'Actions',
        btnEdit: 'Edit',
        btnDuplicate: 'Duplicate',
        btnDelete: 'Delete',
        btnPublish: 'Publish',
        btnVisible: 'Visible',
        btnExport: 'Export',
        btnExportAll: 'Export All',
        btnImport: 'Import',
        btnClear: 'Clear',
        clickPublish: 'Click to publish',
        clickUnpublish: 'Click to unpublish',
        clickShow: 'Click to show',
        clickHide: 'Click to hide',
        tooltipSelectAll: 'Select all',
        postCount: 'of {total} posts',
        bulkSelected: 'selected',
        noPostsFound: 'No blog posts found',
        confirmDeleteTitle: 'Confirm Delete',
        confirmDeleteMessage: 'Are you sure you want to delete this post? This action cannot be undone.',
        confirmBulkDeleteTitle: 'Confirm Bulk Delete',
        confirmBulkDeleteMessage: 'Are you sure you want to delete {count} post(s)? This action cannot be undone.',
        confirmBulkDuplicateTitle: 'Confirm Bulk Duplicate',
        confirmBulkDuplicateMessage: 'Are you sure you want to duplicate {count} post(s)?',
        cancel: 'Cancel',
        delete: 'Delete',
        duplicate: 'Duplicate',
        importSuccess: '{n} post(s) imported',
        grid: 'Grid',
        list: 'List',
        smallGrid: 'Small Grid',
        exporting: 'Exporting...',
        importing: 'Importing...',
        filterByDate: 'Filter by date range',
        postCountLabel: 'of {total} posts',
        toggleFailed: 'Toggle failed',
        deleteFailed: 'Delete failed',
        duplicateFailed: 'Duplicate failed',
        createFailed: 'Create failed',
        scanFailed: 'Scan failed',
        bulkToggleFailed: 'Bulk toggle failed',
        bulkDuplicateFailed: 'Bulk duplicate failed',
        bulkDeleteFailed: 'Bulk delete failed',
        exportFailed: 'Export failed',
        importFailed: 'Import failed',
        bulkCount: '{n} post(s)',
        loadFailed: 'Could not load posts',
        loadError: 'Error: {message}',
    },
    fr: {
        title: 'Gestionnaire de Blog',
        loading: 'Chargement des articles...',
        noPosts: 'Aucun article de blog trouvé.',
        newPost: 'Nouvel Article',
        exportAll: 'Tout Exporter',
        import: 'Importer',
        scan: 'Rechercher les articles',
        parameters: 'Paramètres',
        scanFound: '{n} article(s) trouvé(s)',
        scanMissing: 'Dossier du blog introuvable',
        filters: 'Filtres',
        search: 'Recherche',
        all: 'Tout',
        published: 'Publié',
        unpublished: 'Non publié',
        visible: 'Visible',
        hidden: 'Masqué',
        dateBegin: 'Date',
        dateEnd: "Jusqu'au",
        category: 'Catégorie',
        tag: 'Tag',
        language: 'Langue',
        clear: 'Effacer',
        colTitle: 'Titre',
        colLang: 'Langue',
        colExcerpt: 'Extrait',
        colDate: 'Date',
        colCategory: 'Catégorie',
        colPublished: 'Publier',
        colVisible: 'Visible',
        colTags: 'Tags',
        colActions: 'Actions',
        btnEdit: 'Modifier',
        btnDuplicate: 'Dupliquer',
        btnDelete: 'Supprimer',
        btnPublish: 'Publier',
        btnVisible: 'Visible',
        btnExport: 'Exporter',
        btnExportAll: 'Tout Exporter',
        btnImport: 'Importer',
        btnClear: 'Effacer',
        clickPublish: 'Cliquer pour publier',
        clickUnpublish: 'Cliquer pour dépublier',
        clickShow: 'Cliquer pour afficher',
        clickHide: 'Cliquer pour masquer',
        tooltipSelectAll: 'Tout sélectionner',
        postCount: 'sur {total} articles',
        bulkSelected: 'sélectionné(s)',
        noPostsFound: 'Aucun article trouvé',
        confirmDeleteTitle: 'Confirmer la suppression',
        confirmDeleteMessage: 'Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.',
        confirmBulkDeleteTitle: 'Confirmer la suppression en masse',
        confirmBulkDeleteMessage: 'Êtes-vous sûr de vouloir supprimer {count} article(s) ? Cette action est irréversible.',
        confirmBulkDuplicateTitle: 'Confirmer la duplication en masse',
        confirmBulkDuplicateMessage: 'Êtes-vous sûr de vouloir dupliquer {count} article(s) ?',
        cancel: 'Annuler',
        delete: 'Supprimer',
        duplicate: 'Dupliquer',
        importSuccess: '{n} article(s) importé(s)',
        grid: 'Grille',
        list: 'Liste',
        smallGrid: 'Petite Grille',
        exporting: 'Exportation...',
        importing: 'Importation...',
        filterByDate: 'Filtrer par plage de dates',
        postCountLabel: 'sur {total} articles',
        toggleFailed: 'Échec du changement',
        deleteFailed: 'Échec de la suppression',
        duplicateFailed: 'Échec de la duplication',
        createFailed: 'Échec de la création',
        scanFailed: 'Échec de la recherche',
        bulkToggleFailed: 'Échec du changement groupé',
        bulkDuplicateFailed: 'Échec de la duplication groupée',
        bulkDeleteFailed: 'Échec de la suppression groupée',
        exportFailed: 'Échec de l\'export',
        importFailed: 'Échec de l\'import',
        bulkCount: '{n} article(s)',
        loadFailed: 'Impossible de charger les articles',
        loadError: 'Erreur : {message}',
    },
    es: {
        title: 'Gestor del blog',
        loading: 'Cargando artículos...',
        noPosts: 'No se han encontrado artículos.',
        newPost: 'Nuevo artículo',
        exportAll: 'Exportar todo',
        import: 'Importar',
        scan: 'Buscar artículos',
        parameters: 'Parámetros',
        scanFound: '{n} artículo(s) encontrado(s)',
        scanMissing: 'No se ha encontrado la carpeta del blog',
        filters: 'Filtros',
        search: 'Buscar',
        all: 'Todos',
        published: 'Publicado',
        unpublished: 'No publicado',
        visible: 'Visible',
        hidden: 'Oculto',
        dateBegin: 'Desde',
        dateEnd: 'Hasta',
        category: 'Categoría',
        tag: 'Etiqueta',
        language: 'Idioma',
        clear: 'Borrar',
        colTitle: 'Título',
        colLang: 'Idioma',
        colExcerpt: 'Extracto',
        colDate: 'Fecha',
        colCategory: 'Categoría',
        colPublished: 'Publicar',
        colVisible: 'Visible',
        colTags: 'Etiquetas',
        colActions: 'Acciones',
        btnEdit: 'Editar',
        btnDuplicate: 'Duplicar',
        btnDelete: 'Eliminar',
        btnPublish: 'Publicar',
        btnVisible: 'Visible',
        btnExport: 'Exportar',
        btnExportAll: 'Exportar todo',
        btnImport: 'Importar',
        btnClear: 'Borrar',
        clickPublish: 'Clic para publicar',
        clickUnpublish: 'Clic para despublicar',
        clickShow: 'Clic para mostrar',
        clickHide: 'Clic para ocultar',
        tooltipSelectAll: 'Seleccionar todo',
        postCount: 'de {total} artículos',
        bulkSelected: 'seleccionado(s)',
        noPostsFound: 'No se han encontrado artículos',
        confirmDeleteTitle: 'Confirmar eliminación',
        confirmDeleteMessage: '¿Seguro que quiere eliminar este artículo? Esta acción no se puede deshacer.',
        confirmBulkDeleteTitle: 'Confirmar eliminación múltiple',
        confirmBulkDeleteMessage: '¿Seguro que quiere eliminar {count} artículo(s)? Esta acción no se puede deshacer.',
        confirmBulkDuplicateTitle: 'Confirmar duplicación múltiple',
        confirmBulkDuplicateMessage: '¿Seguro que quiere duplicar {count} artículo(s)?',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        duplicate: 'Duplicar',
        importSuccess: '{n} artículo(s) importado(s)',
        grid: 'Cuadrícula',
        list: 'Lista',
        smallGrid: 'Cuadrícula pequeña',
        exporting: 'Exportando...',
        importing: 'Importando...',
        filterByDate: 'Filtrar por intervalo de fechas',
        postCountLabel: 'de {total} artículos',
        toggleFailed: 'Error al cambiar el estado',
        deleteFailed: 'Error al eliminar',
        duplicateFailed: 'Error al duplicar',
        createFailed: 'Error al crear',
        scanFailed: 'Error en la búsqueda',
        bulkToggleFailed: 'Error al cambiar la selección',
        bulkDuplicateFailed: 'Error al duplicar la selección',
        bulkDeleteFailed: 'Error al eliminar la selección',
        exportFailed: 'Error al exportar',
        importFailed: 'Error al importar',
        bulkCount: '{n} artículo(s)',
        loadFailed: 'No se han podido cargar los artículos',
        loadError: 'Error: {message}',
    },
    it: {
        title: 'Gestione blog',
        loading: 'Caricamento articoli...',
        noPosts: 'Nessun articolo trovato.',
        newPost: 'Nuovo articolo',
        exportAll: 'Esporta tutto',
        import: 'Importa',
        scan: 'Cerca articoli',
        parameters: 'Parametri',
        scanFound: '{n} articolo/i trovato/i',
        scanMissing: 'Cartella del blog non trovata',
        filters: 'Filtri',
        search: 'Cerca',
        all: 'Tutti',
        published: 'Pubblicato',
        unpublished: 'Non pubblicato',
        visible: 'Visibile',
        hidden: 'Nascosto',
        dateBegin: 'Dal',
        dateEnd: 'Al',
        category: 'Categoria',
        tag: 'Tag',
        language: 'Lingua',
        clear: 'Cancella',
        colTitle: 'Titolo',
        colLang: 'Lingua',
        colExcerpt: 'Estratto',
        colDate: 'Data',
        colCategory: 'Categoria',
        colPublished: 'Pubblica',
        colVisible: 'Visibile',
        colTags: 'Tag',
        colActions: 'Azioni',
        btnEdit: 'Modifica',
        btnDuplicate: 'Duplica',
        btnDelete: 'Elimina',
        btnPublish: 'Pubblica',
        btnVisible: 'Visibile',
        btnExport: 'Esporta',
        btnExportAll: 'Esporta tutto',
        btnImport: 'Importa',
        btnClear: 'Cancella',
        clickPublish: 'Clic per pubblicare',
        clickUnpublish: 'Clic per ritirare',
        clickShow: 'Clic per mostrare',
        clickHide: 'Clic per nascondere',
        tooltipSelectAll: 'Seleziona tutto',
        postCount: 'di {total} articoli',
        bulkSelected: 'selezionato/i',
        noPostsFound: 'Nessun articolo trovato',
        confirmDeleteTitle: 'Conferma eliminazione',
        confirmDeleteMessage: 'Eliminare questo articolo? L\'azione non può essere annullata.',
        confirmBulkDeleteTitle: 'Conferma eliminazione multipla',
        confirmBulkDeleteMessage: 'Eliminare {count} articolo/i? L\'azione non può essere annullata.',
        confirmBulkDuplicateTitle: 'Conferma duplicazione multipla',
        confirmBulkDuplicateMessage: 'Duplicare {count} articolo/i?',
        cancel: 'Annulla',
        delete: 'Elimina',
        duplicate: 'Duplica',
        importSuccess: '{n} articolo/i importato/i',
        grid: 'Griglia',
        list: 'Elenco',
        smallGrid: 'Griglia piccola',
        exporting: 'Esportazione...',
        importing: 'Importazione...',
        filterByDate: 'Filtra per intervallo di date',
        postCountLabel: 'di {total} articoli',
        toggleFailed: 'Modifica non riuscita',
        deleteFailed: 'Eliminazione non riuscita',
        duplicateFailed: 'Duplicazione non riuscita',
        createFailed: 'Creazione non riuscita',
        scanFailed: 'Ricerca non riuscita',
        bulkToggleFailed: 'Modifica multipla non riuscita',
        bulkDuplicateFailed: 'Duplicazione multipla non riuscita',
        bulkDeleteFailed: 'Eliminazione multipla non riuscita',
        exportFailed: 'Esportazione non riuscita',
        importFailed: 'Importazione non riuscita',
        bulkCount: '{n} articolo/i',
        loadFailed: 'Impossibile caricare gli articoli',
        loadError: 'Errore: {message}',
    },
    de: {
        title: 'Blog-Verwaltung',
        loading: 'Beiträge werden geladen...',
        noPosts: 'Keine Blogbeiträge gefunden.',
        newPost: 'Neuer Beitrag',
        exportAll: 'Alle exportieren',
        import: 'Importieren',
        scan: 'Beiträge suchen',
        parameters: 'Einstellungen',
        scanFound: '{n} Beitrag/Beiträge gefunden',
        scanMissing: 'Blog-Ordner nicht gefunden',
        filters: 'Filter',
        search: 'Suche',
        all: 'Alle',
        published: 'Veröffentlicht',
        unpublished: 'Nicht veröffentlicht',
        visible: 'Sichtbar',
        hidden: 'Verborgen',
        dateBegin: 'Von',
        dateEnd: 'Bis',
        category: 'Kategorie',
        tag: 'Schlagwort',
        language: 'Sprache',
        clear: 'Zurücksetzen',
        colTitle: 'Titel',
        colLang: 'Sprache',
        colExcerpt: 'Auszug',
        colDate: 'Datum',
        colCategory: 'Kategorie',
        colPublished: 'Veröffentlichen',
        colVisible: 'Sichtbar',
        colTags: 'Schlagwörter',
        colActions: 'Aktionen',
        btnEdit: 'Bearbeiten',
        btnDuplicate: 'Duplizieren',
        btnDelete: 'Löschen',
        btnPublish: 'Veröffentlichen',
        btnVisible: 'Sichtbar',
        btnExport: 'Exportieren',
        btnExportAll: 'Alle exportieren',
        btnImport: 'Importieren',
        btnClear: 'Zurücksetzen',
        clickPublish: 'Klicken zum Veröffentlichen',
        clickUnpublish: 'Klicken zum Zurückziehen',
        clickShow: 'Klicken zum Anzeigen',
        clickHide: 'Klicken zum Verbergen',
        tooltipSelectAll: 'Alle auswählen',
        postCount: 'von {total} Beiträgen',
        bulkSelected: 'ausgewählt',
        noPostsFound: 'Keine Beiträge gefunden',
        confirmDeleteTitle: 'Löschen bestätigen',
        confirmDeleteMessage: 'Diesen Beitrag wirklich löschen? Das kann nicht rückgängig gemacht werden.',
        confirmBulkDeleteTitle: 'Mehrfachlöschen bestätigen',
        confirmBulkDeleteMessage: '{count} Beitrag/Beiträge wirklich löschen? Das kann nicht rückgängig gemacht werden.',
        confirmBulkDuplicateTitle: 'Mehrfachduplizieren bestätigen',
        confirmBulkDuplicateMessage: '{count} Beitrag/Beiträge wirklich duplizieren?',
        cancel: 'Abbrechen',
        delete: 'Löschen',
        duplicate: 'Duplizieren',
        importSuccess: '{n} Beitrag/Beiträge importiert',
        grid: 'Kacheln',
        list: 'Liste',
        smallGrid: 'Kleine Kacheln',
        exporting: 'Export läuft...',
        importing: 'Import läuft...',
        filterByDate: 'Nach Zeitraum filtern',
        postCountLabel: 'von {total} Beiträgen',
        toggleFailed: 'Umschalten fehlgeschlagen',
        deleteFailed: 'Löschen fehlgeschlagen',
        duplicateFailed: 'Duplizieren fehlgeschlagen',
        createFailed: 'Erstellen fehlgeschlagen',
        scanFailed: 'Suche fehlgeschlagen',
        bulkToggleFailed: 'Mehrfach-Umschalten fehlgeschlagen',
        bulkDuplicateFailed: 'Mehrfach-Duplizieren fehlgeschlagen',
        bulkDeleteFailed: 'Mehrfach-Löschen fehlgeschlagen',
        exportFailed: 'Export fehlgeschlagen',
        importFailed: 'Import fehlgeschlagen',
        bulkCount: '{n} Beitrag/Beiträge',
        loadFailed: 'Beiträge konnten nicht geladen werden',
        loadError: 'Fehler: {message}',
    }
};

function uiLang() {
    const raw = String(window.__GRAV_CONFIG__?.language || navigator.language || 'en');
    const code = raw.toLowerCase().split(/[-_]/)[0];
    return i18n[code] ? code : 'en';
}

function t(key, vars) {
    const lang = uiLang();
    let str = (i18n[lang] && i18n[lang][key]) || i18n.en[key] || key;
    if (vars) {
        Object.keys(vars).forEach(k => {
            str = str.replace('{' + k + '}', vars[k]);
        });
    }
    return str;
}

const apiI18n = {
    en: {
        'Blog folder not found': 'Blog folder not found',
        'Internal server error': 'Internal server error',
        'Could not create post folder': 'Could not create post folder',
        'Folder not specified': 'Folder not specified',
        'Invalid folder parameter': 'Invalid folder parameter',
        'Post not found': 'Post not found',
        'Failed to delete post': 'Failed to delete post',
        'Post deleted successfully': 'Post deleted successfully',
        'Invalid parameters': 'Invalid parameters',
        'Item file not found': 'Item file not found',
        'Invalid frontmatter': 'Invalid frontmatter',
        'Failed to duplicate post': 'Failed to duplicate post',
        'No posts selected': 'No posts selected',
        'Failed to create export file': 'Failed to create export file',
        'Failed to export posts': 'Failed to export posts',
        'No posts to export': 'No posts to export',
        'No file uploaded': 'No file uploaded',
        'Import file is too large': 'Import file is too large',
        'Failed to import posts': 'Failed to import posts',
        'Invalid ZIP file': 'Invalid ZIP file',
        'Cannot read post': 'Cannot read post',
        'No image found': 'No image found',
        'Invalid image type': 'Invalid image type',
        'Image not found': 'Image not found',
    },
    fr: {
        'Blog folder not found': 'Dossier du blog introuvable',
        'Internal server error': 'Erreur interne du serveur',
        'Could not create post folder': 'Impossible de créer le dossier de l\'article',
        'Folder not specified': 'Dossier non indiqué',
        'Invalid folder parameter': 'Paramètre de dossier invalide',
        'Post not found': 'Article introuvable',
        'Failed to delete post': 'Échec de la suppression de l\'article',
        'Post deleted successfully': 'Article supprimé',
        'Invalid parameters': 'Paramètres invalides',
        'Item file not found': 'Fichier de l\'article introuvable',
        'Invalid frontmatter': 'En-tête invalide',
        'Failed to duplicate post': 'Échec de la duplication de l\'article',
        'No posts selected': 'Aucun article sélectionné',
        'Failed to create export file': 'Impossible de créer le fichier d\'export',
        'Failed to export posts': 'Échec de l\'export des articles',
        'No posts to export': 'Aucun article à exporter',
        'No file uploaded': 'Aucun fichier envoyé',
        'Import file is too large': 'Le fichier d\'import est trop volumineux',
        'Failed to import posts': 'Échec de l\'import des articles',
        'Invalid ZIP file': 'Fichier ZIP invalide',
        'Cannot read post': 'Impossible de lire l\'article',
        'No image found': 'Aucune image trouvée',
        'Invalid image type': 'Type d\'image invalide',
        'Image not found': 'Image introuvable',
    },
    es: {
        'Blog folder not found': 'No se ha encontrado la carpeta del blog',
        'Internal server error': 'Error interno del servidor',
        'Could not create post folder': 'No se ha podido crear la carpeta del artículo',
        'Folder not specified': 'Carpeta no indicada',
        'Invalid folder parameter': 'Parámetro de carpeta no válido',
        'Post not found': 'Artículo no encontrado',
        'Failed to delete post': 'No se ha podido eliminar el artículo',
        'Post deleted successfully': 'Artículo eliminado',
        'Invalid parameters': 'Parámetros no válidos',
        'Item file not found': 'No se ha encontrado el archivo del artículo',
        'Invalid frontmatter': 'Cabecera no válida',
        'Failed to duplicate post': 'No se ha podido duplicar el artículo',
        'No posts selected': 'No hay artículos seleccionados',
        'Failed to create export file': 'No se ha podido crear el archivo de exportación',
        'Failed to export posts': 'No se han podido exportar los artículos',
        'No posts to export': 'No hay artículos para exportar',
        'No file uploaded': 'No se ha enviado ningún archivo',
        'Import file is too large': 'El archivo de importación es demasiado grande',
        'Failed to import posts': 'No se han podido importar los artículos',
        'Invalid ZIP file': 'Archivo ZIP no válido',
        'Cannot read post': 'No se ha podido leer el artículo',
        'No image found': 'No se ha encontrado ninguna imagen',
        'Invalid image type': 'Tipo de imagen no válido',
        'Image not found': 'Imagen no encontrada',
    },
    it: {
        'Blog folder not found': 'Cartella del blog non trovata',
        'Internal server error': 'Errore interno del server',
        'Could not create post folder': 'Impossibile creare la cartella dell\'articolo',
        'Folder not specified': 'Cartella non indicata',
        'Invalid folder parameter': 'Parametro della cartella non valido',
        'Post not found': 'Articolo non trovato',
        'Failed to delete post': 'Eliminazione dell\'articolo non riuscita',
        'Post deleted successfully': 'Articolo eliminato',
        'Invalid parameters': 'Parametri non validi',
        'Item file not found': 'File dell\'articolo non trovato',
        'Invalid frontmatter': 'Intestazione non valida',
        'Failed to duplicate post': 'Duplicazione dell\'articolo non riuscita',
        'No posts selected': 'Nessun articolo selezionato',
        'Failed to create export file': 'Impossibile creare il file di esportazione',
        'Failed to export posts': 'Esportazione degli articoli non riuscita',
        'No posts to export': 'Nessun articolo da esportare',
        'No file uploaded': 'Nessun file caricato',
        'Import file is too large': 'Il file di importazione è troppo grande',
        'Failed to import posts': 'Importazione degli articoli non riuscita',
        'Invalid ZIP file': 'File ZIP non valido',
        'Cannot read post': 'Impossibile leggere l\'articolo',
        'No image found': 'Nessuna immagine trovata',
        'Invalid image type': 'Tipo di immagine non valido',
        'Image not found': 'Immagine non trovata',
    },
    de: {
        'Blog folder not found': 'Blog-Ordner nicht gefunden',
        'Internal server error': 'Interner Serverfehler',
        'Could not create post folder': 'Beitragsordner konnte nicht erstellt werden',
        'Folder not specified': 'Ordner nicht angegeben',
        'Invalid folder parameter': 'Ungültiger Ordnerparameter',
        'Post not found': 'Beitrag nicht gefunden',
        'Failed to delete post': 'Beitrag konnte nicht gelöscht werden',
        'Post deleted successfully': 'Beitrag gelöscht',
        'Invalid parameters': 'Ungültige Parameter',
        'Item file not found': 'Beitragsdatei nicht gefunden',
        'Invalid frontmatter': 'Ungültige Kopfdaten',
        'Failed to duplicate post': 'Beitrag konnte nicht dupliziert werden',
        'No posts selected': 'Keine Beiträge ausgewählt',
        'Failed to create export file': 'Exportdatei konnte nicht erstellt werden',
        'Failed to export posts': 'Beiträge konnten nicht exportiert werden',
        'No posts to export': 'Keine Beiträge zum Exportieren',
        'No file uploaded': 'Keine Datei hochgeladen',
        'Import file is too large': 'Die Importdatei ist zu groß',
        'Failed to import posts': 'Beiträge konnten nicht importiert werden',
        'Invalid ZIP file': 'Ungültige ZIP-Datei',
        'Cannot read post': 'Beitrag konnte nicht gelesen werden',
        'No image found': 'Kein Bild gefunden',
        'Invalid image type': 'Ungültiger Bildtyp',
        'Image not found': 'Bild nicht gefunden',
    },
};

function apiText(message, fallbackKey) {
    const lang = uiLang();
    const translated = message && ((apiI18n[lang] && apiI18n[lang][message]) || (apiI18n.en && apiI18n.en[message]));
    if (translated) return translated;
    if (message && /^HTTP \d+/.test(String(message))) return t(fallbackKey);
    return message || t(fallbackKey);
}

function getApiResponseData(response) {
    if (response && response.data) return response.data;
    return response || {};
}

class BlogManagerElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.posts = [];
        this.filteredPosts = [];
        this.newPostUrl = '#';
        this.currentView = sessionStorage.getItem('blogManagerView') || 'grid';
        this.categories = [];
        this.tags = [];
        this.languages = [];
        this.pendingDeleteFolder = null;
        this.selectedPosts = {};
        this.lastSelectedIndex = -1;
        this.loading = true;
        this.error = null;
    }

    syncAdminTheme() {
        const root = document.documentElement;
        this.classList.toggle('dark', !!root && root.classList.contains('dark'));
    }

    connectedCallback() {
        this.syncAdminTheme();
        if (!this._themeObserver && document.documentElement) {
            this._themeObserver = new MutationObserver(() => this.syncAdminTheme());
            this._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }
        this.loadPosts();
        this.render();
    }

    disconnectedCallback() {
        if (this._themeObserver) {
            this._themeObserver.disconnect();
            this._themeObserver = null;
        }
    }

    loadPosts() {
        const headers = {};
        if (window.__GRAV_API_TOKEN) {
            headers['X-API-Token'] = window.__GRAV_API_TOKEN;
            headers['Authorization'] = 'Bearer ' + window.__GRAV_API_TOKEN;
        }
        fetch(`${API_BASE}/posts`, {
            credentials: 'same-origin',
            headers: headers
        })
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(data => {
            const payload = getApiResponseData(data);
            if (payload.status === 'success' || payload.success === true) {
                this.posts = payload.posts || [];
                this.filteredPosts = this.posts.slice();
                this.newPostUrl = payload.new_post_url || '#';
                this.selectedPosts = {};
                this.lastSelectedIndex = -1;
                this.extractTaxonomies();
                this.populateFilterOptions();
            } else if (payload.message) {
                this.error = apiText(payload.message, 'loadFailed');
            }
            this.loading = false;
            this.render();
        })
        .catch(err => {
            this.error = apiText(err.message, 'loadFailed');
            this.loading = false;
            this.render();
        });
    }

    extractTaxonomies() {
        const cats = {};
        const tgs = {};
        const lngs = {};
        this.posts.forEach(post => {
            if (post.taxonomy) {
                const categories = Array.isArray(post.taxonomy.category) ? post.taxonomy.category : [];
                const tags = Array.isArray(post.taxonomy.tag) ? post.taxonomy.tag : [];
                categories.forEach(c => cats[c] = true);
                tags.forEach(t => tgs[t] = true);
            }
            if (post.lang) lngs[post.lang] = true;
        });
        this.categories = Object.keys(cats).sort();
        this.tags = Object.keys(tgs).sort();
        this.languages = Object.keys(lngs).sort();
    }

    populateFilterOptions() {
        const setOptions = (id, values) => {
            const select = this.shadowRoot.getElementById(id);
            if (!select) return;
            const currentValue = select.value || '';
            select.innerHTML = '<option value="">' + t('all') + '</option>' + values.map(v => '<option value="' + this.escapeHtml(v) + '">' + this.escapeHtml(v) + '</option>').join('');
            select.value = currentValue;
        };
        setOptions('filter-category', this.categories);
        setOptions('filter-tag', this.tags);
        setOptions('filter-language', this.languages);
    }

    applyFilters() {
        const text = (this.shadowRoot.getElementById('filter-text')?.value || '').toLowerCase();
        const visible = this.shadowRoot.getElementById('filter-visible')?.value || '';
        const published = this.shadowRoot.getElementById('filter-published')?.value || '';
        const category = this.shadowRoot.getElementById('filter-category')?.value || '';
        const tag = this.shadowRoot.getElementById('filter-tag')?.value || '';
        const language = this.shadowRoot.getElementById('filter-language')?.value || '';
        const dateBegin = this.shadowRoot.getElementById('filter-date-begin')?.value || null;
        const dateEnd = this.shadowRoot.getElementById('filter-date-end')?.value || null;

        this.filteredPosts = this.posts.filter(post => {
            if (text) {
                const inTitle = (post.title || '').toLowerCase().includes(text);
                const inExcerpt = (post.excerpt || '').toLowerCase().includes(text);
                if (!inTitle && !inExcerpt) return false;
            }
            if (visible !== '') {
                if ((post.visible ? '1' : '0') !== visible) return false;
            }
            if (published !== '') {
                if ((post.published ? '1' : '0') !== published) return false;
            }
            if (language !== '' && post.lang !== language) return false;
            if (dateBegin) {
                const ymd = this.normalizeDateToYMD(post.date);
                if (!ymd || ymd < dateBegin) return false;
            }
            if (dateEnd) {
                const ymd = this.normalizeDateToYMD(post.date);
                if (!ymd || ymd > dateEnd) return false;
            }
            if (category) {
                const cats = Array.isArray(post.taxonomy?.category) ? post.taxonomy.category : [];
                if (!cats.includes(category)) return false;
            }
            if (tag) {
                const tags = Array.isArray(post.taxonomy?.tag) ? post.taxonomy.tag : [];
                if (!tags.includes(tag)) return false;
            }
            return true;
        });
        this.renderPosts();
    }

    normalizeDateToYMD(dateStr) {
        const d = this.parseDateStr(dateStr);
        if (!d) return '';
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    parseDateStr(dateStr) {
        if (dateStr === null || dateStr === undefined || dateStr === '') return null;
        if (typeof dateStr === 'number' && Number.isFinite(dateStr)) {
            const fromStamp = new Date(dateStr < 1e12 ? dateStr * 1000 : dateStr);
            return Number.isNaN(fromStamp.getTime()) ? null : fromStamp;
        }
        if (typeof dateStr !== 'string') dateStr = String(dateStr);
        let s = dateStr.trim().replace(/['"]/g, '');
        const spaceIdx = s.indexOf(' ');
        let hasTime = false;
        let timePart = '00:00';
        if (spaceIdx !== -1) {
            timePart = s.substring(spaceIdx + 1).trim();
            s = s.substring(0, spaceIdx).trim();
            hasTime = true;
        }
        let parts;
        if (s.indexOf('-') !== -1) parts = s.split('-');
        else if (s.indexOf('/') !== -1) parts = s.split('/');
        else return null;
        if (parts.length !== 3) return null;
        let a = parseInt(parts[0], 10), b = parseInt(parts[1], 10), c = parseInt(parts[2], 10);
        let y, m, d;
        if (a > 1000) { y = a; m = b; d = c; }
        else { d = a; m = b; y = c; }
        if (y < 100) y += 2000;
        if (hasTime && timePart.indexOf(':') !== -1) {
            const tp = timePart.split(':');
            const h = parseInt(tp[0], 10) || 0;
            const mn = parseInt(tp[1], 10) || 0;
            return new Date(y, m - 1, d, h, mn);
        }
        return new Date(y, m - 1, d);
    }

    formatLocaleDate(dateStr) {
        const d = this.parseDateStr(dateStr);
        if (!d) return '--';
        try { return new Intl.DateTimeFormat(uiLang(), { year: '2-digit', month: 'numeric', day: 'numeric' }).format(d); }
        catch(e) { return dateStr; }
    }

    formatLocaleDateCard(dateStr) {
        const d = this.parseDateStr(dateStr);
        if (!d) return '--';
        try { return new Intl.DateTimeFormat(uiLang(), { year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d); }
        catch(e) { return dateStr; }
    }

    clearFilters() {
        const el = this.shadowRoot;
        if (el.getElementById('filter-text')) el.getElementById('filter-text').value = '';
        if (el.getElementById('filter-visible')) el.getElementById('filter-visible').value = '';
        if (el.getElementById('filter-published')) el.getElementById('filter-published').value = '';
        if (el.getElementById('filter-category')) el.getElementById('filter-category').value = '';
        if (el.getElementById('filter-tag')) el.getElementById('filter-tag').value = '';
        if (el.getElementById('filter-language')) el.getElementById('filter-language').value = '';
        if (el.getElementById('filter-date-begin')) el.getElementById('filter-date-begin').value = '';
        if (el.getElementById('filter-date-end')) el.getElementById('filter-date-end').value = '';
        this.applyFilters();
    }

    setView(view) {
        // Normalize view name to match CSS classes (lowercase)
        const normalizedView = view === 'smallGrid' ? 'smallgrid' : view;
        this.currentView = normalizedView;
        sessionStorage.setItem('blogManagerView', normalizedView);
        const container = this.shadowRoot.getElementById('blog-manager-posts');
        if (container) container.className = 'blog-posts-list view-' + normalizedView;
        
        // Update active view button
        this.shadowRoot.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === normalizedView);
        });
        
        this.renderPosts();
    }

    langSwatch(code) {
        const known = { fr: '#2563eb', en: '#7c3aed', de: '#d97706', es: '#e11d48', it: '#059669' };
        const key = String(code || '').toLowerCase();
        if (known[key]) return known[key];
        let hash = 0;
        for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
        const palette = ['#2563eb', '#7c3aed', '#d97706', '#e11d48', '#059669', '#0891b2', '#4f46e5', '#b45309'];
        return palette[Math.abs(hash) % palette.length];
    }

    postKey(post) {
        return String(post.folder || '') + '|' + String(post.lang || '');
    }

    selectedVersions() {
        return Object.keys(this.selectedPosts).map(key => {
            const cut = key.lastIndexOf('|');
            if (cut === -1) return { folder: key, lang: '' };
            return { folder: key.slice(0, cut), lang: key.slice(cut + 1) };
        }).filter(item => item.folder !== '');
    }

    uniqueSelectedFolders() {
        return [...new Set(this.selectedVersions().map(item => item.folder))];
    }

    toggleField(folder, field, lang) {
        let url = `${API_BASE}/posts/toggle?folder=${encodeURIComponent(folder)}&field=${field}`;
        if (lang) url += `&lang=${encodeURIComponent(lang)}`;
        const headers = {};
        if (window.__GRAV_API_TOKEN) {
            headers['X-API-Token'] = window.__GRAV_API_TOKEN;
            headers['Authorization'] = 'Bearer ' + window.__GRAV_API_TOKEN;
        }
        fetch(url, { method: 'POST', credentials: 'same-origin', headers })
        .then(r => r.json())
        .then(data => {
            const payload = getApiResponseData(data);
            if (payload.success === true) {
                this.posts.forEach(p => {
                    if (p.folder === folder && String(p.lang || '') === String(lang || '')) p[field] = payload.value;
                });
                this.renderPosts();
            } else {
                this.notify('error', apiText(payload.message, 'toggleFailed'));
            }
        })
        .catch(err => this.notify('error', apiText(err.message, 'toggleFailed')));
    }

    deletePost(folder) {
        const url = `${API_BASE}/posts/delete?folder=${encodeURIComponent(folder)}`;
        const headers = {};
        if (window.__GRAV_API_TOKEN) {
            headers['X-API-Token'] = window.__GRAV_API_TOKEN;
            headers['Authorization'] = 'Bearer ' + window.__GRAV_API_TOKEN;
        }
        fetch(url, { method: 'POST', credentials: 'same-origin', headers })
        .then(r => r.json())
        .then(data => {
            const payload = getApiResponseData(data);
            if (payload.success === true) this.loadPosts();
            else this.notify('error', apiText(payload.message, 'deleteFailed'));
        })
        .catch(err => this.notify('error', apiText(err.message, 'deleteFailed')));
    }

    duplicatePost(folder) {
        const url = `${API_BASE}/posts/duplicate?folder=${encodeURIComponent(folder)}`;
        const headers = {};
        if (window.__GRAV_API_TOKEN) {
            headers['X-API-Token'] = window.__GRAV_API_TOKEN;
            headers['Authorization'] = 'Bearer ' + window.__GRAV_API_TOKEN;
        }
        fetch(url, { method: 'POST', credentials: 'same-origin', headers })
        .then(r => r.json())
        .then(data => {
            const payload = getApiResponseData(data);
            if (payload.success === true) { this.selectedPosts = {}; this.loadPosts(); }
            else this.notify('error', apiText(payload.message, 'duplicateFailed'));
        })
        .catch(err => this.notify('error', apiText(err.message, 'duplicateFailed')));
    }

    newPost() {
        const url = `${API_BASE}/posts/new`;
        const headers = { 'Content-Type': 'application/json' };
        if (window.__GRAV_API_TOKEN) {
            headers['X-API-Token'] = window.__GRAV_API_TOKEN;
            headers['Authorization'] = 'Bearer ' + window.__GRAV_API_TOKEN;
        }
        fetch(url, { method: 'POST', credentials: 'same-origin', headers })
        .then(r => r.json())
        .then(data => {
            const payload = getApiResponseData(data);
            if (payload.success === true && payload.edit_url) {
                window.location.href = payload.edit_url;
            } else {
                this.notify('error', apiText(payload.message, 'createFailed'));
            }
        })
        .catch(err => this.notify('error', apiText(err.message, 'createFailed')));
    }

    scanBlog() {
        const url = `${API_BASE}/scan`;
        const headers = {};
        if (window.__GRAV_API_TOKEN) {
            headers['X-API-Token'] = window.__GRAV_API_TOKEN;
            headers['Authorization'] = 'Bearer ' + window.__GRAV_API_TOKEN;
        }
        fetch(url, { method: 'POST', credentials: 'same-origin', headers })
        .then(r => r.json())
        .then(data => {
            const payload = getApiResponseData(data);
            if (payload.success === true) {
                this.notify('success', t('scanFound', { n: payload.post_count ?? 0 }));
                this.loadPosts();
            } else {
                this.notify('error', apiText(payload.message, 'scanMissing'));
            }
        })
        .catch(err => this.notify('error', apiText(err.message, 'scanFailed')));
    }

    confirmDelete(folder, title) {
        this.pendingDeleteFolder = folder;
        const titleEl = this.shadowRoot.getElementById('bm-delete-title');
        if (titleEl) titleEl.textContent = title || folder;
        const modal = this.shadowRoot.getElementById('bm-delete-modal');
        if (modal) modal.classList.add('active');
    }

    cancelDelete() {
        this.pendingDeleteFolder = null;
        const modal = this.shadowRoot.getElementById('bm-delete-modal');
        if (modal) modal.classList.remove('active');
    }

    executeDelete() {
        const folder = this.pendingDeleteFolder;
        this.cancelDelete();
        if (!folder) return;
        this.deletePost(folder);
    }

    selectClick(e, folder) {
        e = e || window.event;
        const ctrlKey = e.ctrlKey || e.metaKey;
        const shiftKey = e.shiftKey;
        let idx = -1;
        for (let i = 0; i < this.filteredPosts.length; i++) {
            if (this.postKey(this.filteredPosts[i]) === folder) { idx = i; break; }
        }
        if (shiftKey && this.lastSelectedIndex >= 0 && idx >= 0) {
            const start = Math.min(this.lastSelectedIndex, idx);
            const end = Math.max(this.lastSelectedIndex, idx);
            for (let j = start; j <= end; j++) {
                this.selectedPosts[this.postKey(this.filteredPosts[j])] = true;
            }
        } else if (ctrlKey) {
            if (this.selectedPosts[folder]) delete this.selectedPosts[folder];
            else this.selectedPosts[folder] = true;
        } else {
            if (this.selectedPosts[folder]) delete this.selectedPosts[folder];
            else this.selectedPosts[folder] = true;
        }
        this.lastSelectedIndex = idx;
        this.patchSelection();
        requestAnimationFrame(() => this.syncCheckboxState());
    }

    toggleSelectAll(checked) {
        if (checked) {
            this.filteredPosts.forEach(p => this.selectedPosts[this.postKey(p)] = true);
        } else {
            this.selectedPosts = {};
        }
        this.patchSelection();
    }

    clearSelection() {
        this.selectedPosts = {};
        this.lastSelectedIndex = -1;
        this.patchSelection();
    }

    patchSelection() {
        this.syncCheckboxState();
        this.updateBulkBar();
    }

    syncCheckboxState() {
        const cards = this.shadowRoot.querySelectorAll('[data-key]');
        cards.forEach(card => {
            const key = card.getAttribute('data-key');
            const isSelected = !!this.selectedPosts[key];
            card.classList.toggle('selected', isSelected);
            const cb = card.querySelector('input.select-cb');
            if (cb) cb.checked = isSelected;
        });
        const selectAllCb = this.shadowRoot.querySelector('.lh-select input[type="checkbox"]');
        if (selectAllCb) {
            const allSelected = this.filteredPosts.length > 0 && this.filteredPosts.every(p => !!this.selectedPosts[this.postKey(p)]);
            selectAllCb.checked = allSelected;
        }
    }

    updateBulkBar() {
        const bar = this.shadowRoot.getElementById('bm-bulk-bar');
        const titlebar = this.shadowRoot.querySelector('.bm-titlebar');
        if (!bar) return;
        const keys = Object.keys(this.selectedPosts);
        if (keys.length > 0) {
            bar.style.display = 'flex';
            bar.innerHTML = `<span class="bm-bulk-count">${keys.length} ${t('bulkSelected')}</span>` +
                `<span class="bm-bulk-group">` +
                `<button type="button" class="button button-small" data-bulk-action="published">${Icons.checkCircle} <span class="button-text">${t('btnPublish')}</span></button>` +
                `<button type="button" class="button button-small" data-bulk-action="visible">${Icons.eye} <span class="button-text">${t('btnVisible')}</span></button>` +
                `</span>` +
                `<span class="bm-bulk-group">` +
                `<button type="button" class="button button-small" data-bulk-action="duplicate">${Icons.clone} <span class="button-text">${t('btnDuplicate')}</span></button>` +
                `<button type="button" class="button button-small" data-bulk-action="export">${Icons.download} <span class="button-text">${t('btnExport')}</span></button>` +
                `<button type="button" class="button button-small danger" data-bulk-action="delete">${Icons.trash} <span class="button-text">${t('btnDelete')}</span></button>` +
                `<button type="button" class="button button-small" data-bulk-action="clear">${Icons.times}</button>` +
                `</span>`;
            if (titlebar) titlebar.classList.add('bm-bulk-active');
        } else {
            bar.style.display = 'none';
            bar.innerHTML = '';
            if (titlebar) titlebar.classList.remove('bm-bulk-active');
        }
    }

    bulkToggleField(field) {
        const versions = this.selectedVersions();
        if (versions.length === 0 || this.bulkTogglePending) return;
        this.bulkTogglePending = true;
        let completed = 0;
        let failed = false;
        const finish = () => {
            completed++;
            if (completed !== versions.length) return;
            this.bulkTogglePending = false;
            this.selectedPosts = {};
            this.applyFilters();
            if (failed) this.notify('error', t('bulkToggleFailed'));
        };
        versions.forEach(version => {
            let url = `${API_BASE}/posts/toggle?folder=${encodeURIComponent(version.folder)}&field=${field}`;
            if (version.lang) url += `&lang=${encodeURIComponent(version.lang)}`;
            const headers = {};
            if (window.__GRAV_API_TOKEN) {
                headers['X-API-Token'] = window.__GRAV_API_TOKEN;
                headers['Authorization'] = 'Bearer ' + window.__GRAV_API_TOKEN;
            }
            fetch(url, { method: 'POST', credentials: 'same-origin', headers })
            .then(r => r.json())
            .then(data => {
                const payload = getApiResponseData(data);
                if (payload.success === true) {
                    this.posts.forEach(p => {
                        if (p.folder === version.folder && String(p.lang || '') === String(version.lang || '')) p[field] = payload.value;
                    });
                } else {
                    failed = true;
                }
                finish();
            })
            .catch(() => {
                failed = true;
                finish();
            });
        });
    }

    confirmBulkDuplicate() {
        const folders = this.uniqueSelectedFolders();
        if (folders.length === 0) return;
        const titleEl = this.shadowRoot.getElementById('bm-bulk-title');
        if (titleEl) titleEl.textContent = t('bulkCount', { n: folders.length });
        const modal = this.shadowRoot.getElementById('bm-bulk-duplicate-modal');
        if (modal) modal.classList.add('active');
    }

    executeBulkDuplicate() {
        const modal = this.shadowRoot.getElementById('bm-bulk-duplicate-modal');
        if (modal) modal.classList.remove('active');
        const folders = this.uniqueSelectedFolders();
        if (folders.length === 0) return;
        let completed = 0;
        folders.forEach(folder => {
            const url = `${API_BASE}/posts/duplicate?folder=${encodeURIComponent(folder)}`;
            const headers = {};
            if (window.__GRAV_API_TOKEN) {
                headers['X-API-Token'] = window.__GRAV_API_TOKEN;
                headers['Authorization'] = 'Bearer ' + window.__GRAV_API_TOKEN;
            }
            fetch(url, { method: 'POST', credentials: 'same-origin', headers })
            .then(r => r.json())
            .then(data => {
                completed++;
                const payload = getApiResponseData(data);
                if (payload.success !== true) this.notify('error', apiText(payload.message, 'bulkDuplicateFailed'));
                if (completed === folders.length) { this.selectedPosts = {}; this.loadPosts(); }
            })
            .catch(() => {
                completed++;
                if (completed === folders.length) { this.selectedPosts = {}; this.loadPosts(); this.notify('error', t('bulkDuplicateFailed')); }
            });
        });
    }

    confirmBulkDelete() {
        const folders = this.uniqueSelectedFolders();
        if (folders.length === 0) return;
        const titleEl = this.shadowRoot.getElementById('bm-bulk-delete-title');
        if (titleEl) titleEl.textContent = t('bulkCount', { n: folders.length });
        const modal = this.shadowRoot.getElementById('bm-bulk-delete-modal');
        if (modal) modal.classList.add('active');
    }

    executeBulkDelete() {
        const modal = this.shadowRoot.getElementById('bm-bulk-delete-modal');
        if (modal) modal.classList.remove('active');
        const folders = this.uniqueSelectedFolders();
        if (folders.length === 0) return;
        let completed = 0;
        folders.forEach(folder => {
            const url = `${API_BASE}/posts/delete?folder=${encodeURIComponent(folder)}`;
            const headers = {};
            if (window.__GRAV_API_TOKEN) {
                headers['X-API-Token'] = window.__GRAV_API_TOKEN;
                headers['Authorization'] = 'Bearer ' + window.__GRAV_API_TOKEN;
            }
            fetch(url, { method: 'POST', credentials: 'same-origin', headers })
            .then(r => r.json())
            .then(data => {
                completed++;
                const payload = getApiResponseData(data);
                if (payload.success !== true) this.notify('error', apiText(payload.message, 'bulkDeleteFailed'));
                if (completed === folders.length) { this.selectedPosts = {}; this.loadPosts(); }
            })
            .catch(() => {
                completed++;
                if (completed === folders.length) { this.selectedPosts = {}; this.loadPosts(); this.notify('error', t('bulkDeleteFailed')); }
            });
        });
    }

exportSelectedPosts() {
        const folders = this.uniqueSelectedFolders();
        if (folders.length === 0) return;
        this.downloadExport(folders, true);
    }

    exportAllPosts() {
        const folders = [...new Set((this.posts || []).map(post => post.folder).filter(Boolean))];
        if (folders.length === 0) {
            this.notify('info', t('noPostsFound'));
            return;
        }
        this.downloadExport(folders, false);
    }

    downloadExport(folders, clearSelection) {
        const headers = { 'Content-Type': 'application/json' };
        if (window.__GRAV_API_TOKEN) {
            headers['X-API-Token'] = window.__GRAV_API_TOKEN;
            headers['Authorization'] = 'Bearer ' + window.__GRAV_API_TOKEN;
        }

        fetch(`${API_BASE}/export`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: headers,
            body: JSON.stringify({ folders })
        })
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'blog-export-' + new Date().toISOString().slice(0, 19).replace(/[-:]/g, '') + '.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (clearSelection) {
            this.selectedPosts = {};
            this.patchSelection();
            }
        })
        .catch(err => {
            this.notify('error', apiText(err.message, 'exportFailed'));
        });
    }

    importPosts(file) {
        const headers = {};
        if (window.__GRAV_API_TOKEN) {
            headers['X-API-Token'] = window.__GRAV_API_TOKEN;
            headers['Authorization'] = 'Bearer ' + window.__GRAV_API_TOKEN;
        }
        const body = new FormData();
        body.append('file', file);

        fetch(`${API_BASE}/import`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: headers,
            body: body
        })
        .then(r => r.json().then(data => ({ ok: r.ok, data })))
        .then(({ ok, data }) => {
            const payload = getApiResponseData(data);
            if (!ok || payload.success !== true) {
                this.notify('error', apiText(payload.message, 'importFailed'));
                return;
            }
            this.notify('success', t('importSuccess', { n: payload.imported || 0 }));
            this.loadPosts();
        })
        .catch(err => this.notify('error', apiText(err.message, 'importFailed')));
    }

    renderShell() {
        const cssUrl = API_SERVER + '/user/plugins/blog-manager/assets/blog-manager.css?v=20261104g';
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="${cssUrl}">
            <style>
                :host { display: block; min-height: 500px; color: var(--foreground); }
                .button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #d4d4d8; border-radius: 6px; background: #fff; color: #18181b; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: none; }
                .button:hover { background: #f4f4f5; }
                .button.danger { border-color: #fecaca; background: #dc2626; color: #fff; }
                .button.danger:hover { background: #b91c1c; }
                .button-small { padding: 4px 8px; font-size: 11px; }
                .blog-sidebar-tools { display: flex; flex-direction: row; align-items: flex-start; justify-content: flex-end; gap: 6px; width: 100%; margin: 8px 0 0; }
                .blog-sidebar-tools .blog-sidebar-icon { appearance: none; -webkit-appearance: none; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 28px; width: 28px; height: 28px; min-width: 28px; min-height: 28px; max-width: 28px; max-height: 28px; margin: 0; padding: 0; box-sizing: border-box; line-height: 0; border: 1px solid #ccc; border-radius: 3px; background: #fff; color: #555; text-decoration: none; overflow: hidden; cursor: pointer; vertical-align: top; }
                .blog-sidebar-tools .blog-sidebar-icon:hover { background: #f5f5f5; border-color: #999; color: #333; }
                .blog-sidebar-tools .blog-sidebar-icon svg { display: block; width: 14px; height: 14px; flex: 0 0 14px; margin: 0; }
                @media (max-width: 1330px) and (min-width: 1024px),
                       (max-width: 890px) {
                    .bm-titlebar.bm-bulk-active { flex-wrap: wrap; row-gap: 0; padding-bottom: 0; }
                    .bm-titlebar.bm-bulk-active::after { content: ''; order: 3; flex: 0 0 100%; height: 0; }
                    .bm-titlebar.bm-bulk-active #bm-bulk-bar { order: 4; position: relative; left: auto; top: auto; transform: none; margin: 8px auto 16px; }
                }
                @media (max-width: 1200px) and (min-width: 1025px) {
                    .lh-category, .lr-category, .skel-list-row .skel-cat { display: none !important; }
                }
                @media (max-width: 1112px) and (min-width: 1024px) {
                    .lh-lang, .lr-lang, .skel-list-row .skel-lang { display: none !important; }
                }
            </style>
            <div class="blog-manager-layout">
                <aside class="blog-manager-sidebar">
                    <button type="button" class="blog-newpost-btn" data-new-post>${Icons.plus} ${t('newPost')}</button>
                    <div class="blog-sidebar-actions">
                        <button type="button" class="blog-sidebar-btn" data-export-all>${Icons.download} ${t('exportAll')}</button>
                        <button type="button" class="blog-sidebar-btn" data-import>${Icons.upload} ${t('import')}</button>
                    </div>
                    <input type="file" id="bm-import-file" accept=".zip,application/zip" hidden>
                    <div class="filter-panel">
                        <h3>${t('filters')}</h3>
                        <div class="filter-group">
                            <label>${t('search')}</label>
                            <input type="text" id="filter-text" placeholder="${t('search')}">
                        </div>
                        <div class="filter-group-inline">
                            <div class="filter-half">
                                <label>${t('visible')}</label>
                                <select id="filter-visible"><option value="">${t('all')}</option><option value="1">${t('visible')}</option><option value="0">${t('hidden')}</option></select>
                            </div>
                            <div class="filter-half">
                                <label>${t('published')}</label>
                                <select id="filter-published"><option value="">${t('all')}</option><option value="1">${t('published')}</option><option value="0">${t('unpublished')}</option></select>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>${t('category')}</label>
                            <select id="filter-category"><option value="">${t('all')}</option></select>
                        </div>
                        <div class="filter-group">
                            <label>${t('tag')}</label>
                            <select id="filter-tag"><option value="">${t('all')}</option></select>
                        </div>
                        <div class="filter-group">
                            <label>${t('language')}</label>
                            <select id="filter-language"><option value="">${t('all')}</option></select>
                        </div>
                        <div class="filter-group">
                            <label>${t('dateBegin')}</label>
                            <input type="date" id="filter-date-begin">
                        </div>
                        <div class="filter-group">
                            <label>${t('dateEnd')}</label>
                            <input type="date" id="filter-date-end">
                        </div>
                        <div class="filter-actions">
                            <button class="button" id="filter-clear">${t('clear')}</button>
                        </div>
                        <div class="filter-count" id="blog-manager-count"></div>
                    </div>
                    <div class="blog-sidebar-tools">
                        <button type="button" class="blog-sidebar-icon" data-scan title="${this.escapeHtml(t('scan'))}" aria-label="${this.escapeHtml(t('scan'))}">${Icons.refresh}</button>
                        <button type="button" class="blog-sidebar-icon" data-parameters title="${this.escapeHtml(t('parameters'))}" aria-label="${this.escapeHtml(t('parameters'))}">${Icons.sliders}</button>
                    </div>
                </aside>
                <main class="blog-manager-main">
                    <div class="bm-titlebar">
                        <div class="bm-titlebar-left">
                            <h1>${t('title')}</h1>
                        </div>
                        <div class="bm-titlebar-views">
                            <button class="view-btn ${this.currentView === 'grid' ? 'active' : ''}" data-view="grid" title="${t('grid')}">${Icons.grid}</button>
                            <button class="view-btn ${this.currentView === 'smallgrid' ? 'active' : ''}" data-view="smallgrid" title="${t('smallGrid')}">${Icons.smallGrid}</button>
                            <button class="view-btn ${this.currentView === 'list' ? 'active' : ''}" data-view="list" title="${t('list')}">${Icons.list}</button>
                        </div>
                        <div id="bm-bulk-bar"></div>
                    </div>
                    <div id="blog-manager-posts" class="blog-posts-list view-${this.currentView}"></div>
                </main>
            </div>
            <div class="bm-modal-overlay" id="bm-delete-modal">
                <div class="bm-modal-box">
                    <h3>${t('confirmDeleteTitle')}</h3>
                    <p>${t('confirmDeleteMessage')}</p>
                    <p class="post-name" id="bm-delete-title"></p>
                    <div class="bm-modal-actions">
                        <button class="button" data-cancel-delete>${t('cancel')}</button>
                        <button class="button danger" data-execute-delete>${t('delete')}</button>
                    </div>
                </div>
            </div>
            <div class="bm-modal-overlay" id="bm-bulk-duplicate-modal">
                <div class="bm-modal-box">
                    <h3>${t('confirmBulkDuplicateTitle')}</h3>
                    <p>${t('confirmBulkDuplicateMessage', { count: '<span id="bm-bulk-title">0</span>' })}</p>
                    <div class="bm-modal-actions">
                        <button class="button" data-cancel-bulk-duplicate>${t('cancel')}</button>
                        <button class="button danger" data-execute-bulk-duplicate>${t('duplicate')}</button>
                    </div>
                </div>
            </div>
            <div class="bm-modal-overlay" id="bm-bulk-delete-modal">
                <div class="bm-modal-box">
                    <h3>${t('confirmBulkDeleteTitle')}</h3>
                    <p>${t('confirmBulkDeleteMessage', { count: '<span id="bm-bulk-delete-title">0</span>' })}</p>
                    <div class="bm-modal-actions">
                        <button class="button" data-cancel-bulk-delete>${t('cancel')}</button>
                        <button class="button danger" data-execute-bulk-delete>${t('delete')}</button>
                    </div>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector('[data-new-post]').addEventListener('click', () => this.newPost());
        this.shadowRoot.querySelector('[data-export-all]').addEventListener('click', () => this.exportAllPosts());
        this.shadowRoot.querySelector('[data-scan]').addEventListener('click', () => this.scanBlog());
        this.shadowRoot.querySelector('[data-parameters]').addEventListener('click', () => { window.location.href = this.settingsUrl(); });
        this.shadowRoot.querySelector('[data-import]').addEventListener('click', () => this.shadowRoot.getElementById('bm-import-file').click());
        this.shadowRoot.getElementById('bm-import-file').addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            e.target.value = '';
            if (file) this.importPosts(file);
        });
        this.shadowRoot.querySelectorAll('#filter-text, #filter-visible, #filter-published, #filter-category, #filter-tag, #filter-language, #filter-date-begin, #filter-date-end').forEach(input => {
            input.addEventListener('input', () => this.applyFilters());
            input.addEventListener('change', () => this.applyFilters());
        });
        this.shadowRoot.getElementById('filter-clear').addEventListener('click', () => this.clearFilters());
        this.shadowRoot.querySelectorAll('[data-cancel-delete]').forEach(btn => btn.addEventListener('click', () => this.cancelDelete()));
        this.shadowRoot.querySelector('[data-execute-delete]').addEventListener('click', () => this.executeDelete());
        this.shadowRoot.querySelectorAll('[data-cancel-bulk-duplicate]').forEach(btn => btn.addEventListener('click', () => this.shadowRoot.getElementById('bm-bulk-duplicate-modal').classList.remove('active')));
        this.shadowRoot.querySelector('[data-execute-bulk-duplicate]').addEventListener('click', () => this.executeBulkDuplicate());
        this.shadowRoot.querySelectorAll('[data-cancel-bulk-delete]').forEach(btn => btn.addEventListener('click', () => this.shadowRoot.getElementById('bm-bulk-delete-modal').classList.remove('active')));
        this.shadowRoot.querySelector('[data-execute-bulk-delete]').addEventListener('click', () => this.executeBulkDelete());

        this.shadowRoot.addEventListener('click', e => {
            const target = e.target instanceof Element ? e.target : null;
            if (!target) return;

            const deleteBtn = target.closest('[data-delete]');
            if (deleteBtn) {
                e.preventDefault();
                this.confirmDelete(deleteBtn.dataset.delete, deleteBtn.closest('[data-folder]')?.querySelector('.blog-post-title')?.textContent?.trim() || deleteBtn.dataset.delete);
                return;
            }

            const duplicateBtn = target.closest('[data-duplicate]');
            if (duplicateBtn) {
                e.preventDefault();
                this.duplicatePost(duplicateBtn.dataset.duplicate);
                return;
            }

            const toggleBadge = target.closest('.toggle-badge[data-field]');
            if (toggleBadge) {
                e.preventDefault();
                this.toggleField(toggleBadge.dataset.folder, toggleBadge.dataset.field, toggleBadge.dataset.lang || '');
                return;
            }

            const viewBtn = target.closest('[data-view]');
            if (viewBtn) {
                e.preventDefault();
                this.setView(viewBtn.dataset.view);
                return;
            }

            const bulkAction = target.closest('[data-bulk-action]');
            if (bulkAction) {
                e.preventDefault();
                const action = bulkAction.dataset.bulkAction;
                if (action === 'published' || action === 'visible') this.bulkToggleField(action);
                if (action === 'duplicate') this.confirmBulkDuplicate();
                if (action === 'export') this.exportSelectedPosts();
                if (action === 'delete') this.confirmBulkDelete();
                if (action === 'clear') this.clearSelection();
                return;
            }

            const checkbox = target.closest('.select-cb');
            if (checkbox && !checkbox.hasAttribute('data-select-all')) {
                e.preventDefault();
                this.selectClick(e, checkbox.dataset.key);
            }
        });
    }

    renderSkeletons() {
        const container = this.shadowRoot.getElementById('blog-manager-posts');
        if (!container) return;
        
        if (this.currentView === 'list') {
            // List view skeleton
            let html = '<div class="bm-list-wrap">';
            html += '<div class="list-header">';
            html += '<div class="lh-select"><div class="skel-block" style="width:16px;height:16px;border-radius:3px"></div></div>';
            html += '<div class="lh-title"><div class="skel-line title skel-block"></div></div>';
            html += '<div class="lh-lang"><div class="skel-line short skel-block" style="width:30px"></div></div>';
            html += '<div class="lh-excerpt"><div class="skel-line skel-block"></div></div>';
            html += '<div class="lh-date"><div class="skel-line short skel-block" style="width:50px"></div></div>';
            html += '<div class="lh-category"><div class="skel-line short skel-block" style="width:70px"></div></div>';
            html += '<div class="lh-published"><div class="skel-line badge skel-block" style="width:50px"></div></div>';
            html += '<div class="lh-visible"><div class="skel-line badge skel-block" style="width:50px"></div></div>';
            html += '<div class="lh-tags"><div class="skel-line short skel-block" style="width:100px"></div></div>';
            html += '<div class="lh-actions"><div class="skel-line btn skel-block"></div></div>';
            html += '</div>';
            for (let c = 0; c < 8; c++) {
                html += '<div class="skel-list-row">';
                html += '<div class="skel-sel"><div class="skel-block" style="width:16px;height:16px;border-radius:3px"></div></div>';
                html += '<div class="skel-title"><div class="skel-line title skel-block"></div></div>';
                html += '<div class="skel-lang"><div class="skel-line short skel-block" style="width:30px"></div></div>';
                html += '<div class="skel-excerpt"><div class="skel-line skel-block"></div></div>';
                html += '<div class="skel-date"><div class="skel-line short skel-block" style="width:50px"></div></div>';
                html += '<div class="skel-cat"><div class="skel-line short skel-block" style="width:70px"></div></div>';
                html += '<div class="skel-pub"><div class="skel-line badge skel-block" style="width:50px"></div></div>';
                html += '<div class="skel-vis"><div class="skel-line badge skel-block" style="width:50px"></div></div>';
                html += '<div class="skel-tags"><div class="skel-line short skel-block" style="width:100px"></div></div>';
                html += '<div class="skel-acts"><div class="skel-line btn skel-block" style="width:28px;height:28px;border-radius:3px"></div><div class="skel-line btn skel-block" style="width:28px;height:28px;border-radius:3px"></div><div class="skel-line btn skel-block" style="width:28px;height:28px;border-radius:3px"></div></div>';
                html += '</div>';
            }
            html += '</div>';
            container.innerHTML = html;
        } else {
            // Grid/smallgrid view skeleton
            let cardsHtml = '';
            for (let c = 0; c < 12; c++) {
                cardsHtml += '<div class="skel-card"><div class="skel-card-inner"><div class="skel-thumb skel-block"></div><div class="skel-card-body"><div class="skel-line title skel-block"></div><div style="display:flex;gap:10px;margin-bottom:8px"><div class="skel-line short skel-block" style="margin:0"></div><div class="skel-line short skel-block" style="margin:0;width:30%"></div></div><div style="margin-bottom:8px"><div class="skel-line badge skel-block"></div><div class="skel-line badge skel-block"></div></div><div class="skel-line skel-block"></div><div class="skel-line skel-block" style="width:75%"></div><div class="skel-actions"><div class="skel-line btn skel-block"></div><div class="skel-line btn skel-block"></div><div class="skel-line btn skel-block"></div></div></div></div></div>';
            }
            container.innerHTML = '<div class="bm-cards-wrap">' + cardsHtml + '</div>';
        }
        container.className = 'blog-posts-list view-' + this.currentView;
    }

    renderPosts() {
        const container = this.shadowRoot.getElementById('blog-manager-posts');
        if (!container) return;
        if (this.filteredPosts.length === 0) {
            container.innerHTML = '<p class="no-posts">' + t('noPostsFound') + '</p>';
            container.className = 'blog-posts-list view-' + this.currentView;
            return;
        }
        
        if (this.currentView === 'list') {
            this.renderList();
        } else {
            let cardsHtml = '';
            this.filteredPosts.forEach(post => { cardsHtml += this.renderCard(post); });
            container.innerHTML = '<div class="bm-cards-wrap">' + cardsHtml + '</div>';
        }
        container.className = 'blog-posts-list view-' + this.currentView;
        this.updateBulkBar();
    }

    renderList() {
        const container = this.shadowRoot.getElementById('blog-manager-posts');
        if (!container) return;
        
        // Build list header
        let html = '<div class="bm-list-wrap">';
        html += '<div class="list-header">';
        html += '<div class="lh-select"><input type="checkbox" class="select-cb" data-select-all></div>';
        html += '<div class="lh-title">' + t('colTitle') + '</div>';
        html += '<div class="lh-lang">' + t('colLang') + '</div>';
        html += '<div class="lh-excerpt">' + t('colExcerpt') + '</div>';
        html += '<div class="lh-date">' + t('colDate') + '</div>';
        html += '<div class="lh-category">' + t('colCategory') + '</div>';
        html += '<div class="lh-published">' + t('colPublished') + '</div>';
        html += '<div class="lh-visible">' + t('colVisible') + '</div>';
        html += '<div class="lh-tags">' + t('colTags') + '</div>';
        html += '<div class="lh-actions">' + t('colActions') + '</div>';
        html += '</div>';
        
        // Build list rows
        this.filteredPosts.forEach(post => {
            const editUrl = this.escapeHtml(post.edit_url || '#');
            const f = this.escapeHtml(post.folder);
            const key = this.escapeHtml(this.postKey(post));
            const langAttr = this.escapeHtml(post.lang || '');
            const isSelected = !!this.selectedPosts[this.postKey(post)];
            const selClass = isSelected ? ' selected' : '';
            
            // List view: icon-only badges (no text)
            const published = post.published
                ? `<span class="badge green toggle-badge" data-field="published" data-folder="${f}" data-lang="${langAttr}" title="${t('clickUnpublish')}">${Icons.checkCircle}</span>`
                : `<span class="badge toggle-badge" data-field="published" data-folder="${f}" data-lang="${langAttr}" title="${t('clickPublish')}">${Icons.circle}</span>`;
            const visible = post.visible
                ? `<span class="badge green toggle-badge" data-field="visible" data-folder="${f}" data-lang="${langAttr}" title="${t('clickHide')}">${Icons.eye}</span>`
                : `<span class="badge toggle-badge" data-field="visible" data-folder="${f}" data-lang="${langAttr}" title="${t('clickShow')}">${Icons.eyeSlash}</span>`;
            
            const categories = Array.isArray(post.taxonomy?.category) ? post.taxonomy.category : [];
            const tags = Array.isArray(post.taxonomy?.tag) ? post.taxonomy.tag : [];
            const categoryStr = categories.slice(0, 2).join(', ') + (categories.length > 2 ? '…' : '');
            const tagsHtml = tags.slice(0, 3).map(tag => `<span class="tag-pill">${this.escapeHtml(tag)}</span>`).join('') + (tags.length > 3 ? `<span class="tag-pill">+${tags.length - 3}</span>` : '');
            
            html += `<div class="list-row${selClass}" data-folder="${f}" data-key="${key}">`;
            html += `<div class="lr-select"><input type="checkbox" class="select-cb" data-folder="${f}" data-key="${key}"${isSelected ? ' checked' : ''}></div>`;
            html += `<div class="lr-title"><a href="${editUrl}">${this.escapeHtml(post.title)}</a></div>`;
            html += `<div class="lr-lang">${post.lang ? `<span class="lang-pill">${this.escapeHtml(post.lang)}</span>` : ''}</div>`;
            html += `<div class="lr-excerpt">${this.escapeHtml(post.excerpt || '')}</div>`;
            html += `<div class="lr-date">${post.date ? this.formatLocaleDate(post.date) : '--'}</div>`;
            html += `<div class="lr-category">${this.escapeHtml(categoryStr)}</div>`;
            html += `<div class="lr-published">${published}</div>`;
            html += `<div class="lr-visible">${visible}</div>`;
            html += `<div class="lr-tags">${tagsHtml}</div>`;
            html += `<div class="lr-actions">`;
            html += `<a class="button button-small button-icon" href="${editUrl}" title="${t('btnEdit')}">${Icons.pencil}</a> `;
            html += `<button class="button button-small button-icon" data-duplicate="${post.folder}" title="${t('btnDuplicate')}">${Icons.clone}</button> `;
            html += `<button class="button button-small button-icon danger" data-delete="${post.folder}" title="${t('btnDelete')}">${Icons.trash}</button>`;
            html += `</div>`;
            html += `</div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Add event listener for select all checkbox
        const selectAllCb = container.querySelector('.lh-select input[data-select-all]');
        if (selectAllCb) {
            selectAllCb.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        }
    }

    renderCard(post) {
        const editUrl = this.escapeHtml(post.edit_url || '#');
        const f = this.escapeHtml(post.folder);
        const key = this.escapeHtml(this.postKey(post));
        const langAttr = this.escapeHtml(post.lang || '');
        const isSelected = !!this.selectedPosts[this.postKey(post)];
        const selClass = isSelected ? ' selected' : '';
        const published = post.published
            ? `<span class="badge green toggle-badge" data-field="published" data-folder="${f}" data-lang="${langAttr}" title="${t('clickUnpublish')}">${Icons.checkCircle} <span class="badge-text">${t('published')}</span></span>`
            : `<span class="badge toggle-badge" data-field="published" data-folder="${f}" data-lang="${langAttr}" title="${t('clickPublish')}">${Icons.circle} <span class="badge-text">${t('unpublished')}</span></span>`;
        const visible = post.visible
            ? `<span class="badge green toggle-badge" data-field="visible" data-folder="${f}" data-lang="${langAttr}" title="${t('clickHide')}">${Icons.eye} <span class="badge-text">${t('visible')}</span></span>`
            : `<span class="badge toggle-badge" data-field="visible" data-folder="${f}" data-lang="${langAttr}" title="${t('clickShow')}">${Icons.eyeSlash} <span class="badge-text">${t('hidden')}</span></span>`;
        let html = `<div class="blog-post-card${selClass}" data-folder="${f}" data-key="${key}"><div class="blog-post-card-inner">`;
        html += `<div class="bm-select-overlay"><input type="checkbox"${isSelected ? ' checked' : ''} data-folder="${f}" data-key="${key}" class="select-cb"></div>`;
        const thumbSrc = post.image_url || '';
        const langMark = post.lang
            ? `<span class="lang-badge" style="background:${this.langSwatch(post.lang)}" title="${this.escapeHtml(post.lang)}">${this.escapeHtml(post.lang)}</span>`
            : '';
        html += `<a href="${editUrl}" class="blog-post-thumb">${langMark}<img src="${this.escapeHtml(thumbSrc)}" alt=""></a>`;
        html += `<div class="blog-post-body">`;
        html += `<div class="blog-post-title"><a href="${editUrl}">${this.escapeHtml(post.title)}</a></div>`;
        html += `<div class="blog-post-meta">`;
        if (post.date) html += `<span title="${this.escapeHtml(this.formatLocaleDateCard(post.date))}">${Icons.calendar} ${this.formatLocaleDate(post.date)}</span>`;
        html += `</div>`;
        html += `<div class="blog-post-meta">${published}${visible}</div>`;
        if (post.excerpt) html += `<div class="blog-post-excerpt">${this.escapeHtml(post.excerpt)}</div>`;
        html += `<div class="blog-post-actions">`;
        html += `<a class="button button-small" href="${editUrl}">${Icons.pencil} ${t('btnEdit')}</a> `;
        html += `<button class="button button-small" data-duplicate="${f}">${Icons.clone} ${t('btnDuplicate')}</button> `;
        html += `<button class="button button-small danger button-icon-smallgrid" data-delete="${f}" title="${t('btnDelete')}" style="margin-left:auto">${Icons.trash}</button>`;
        html += `</div></div></div></div>`;
        return html;
    }

    settingsUrl() {
        const base = String(window.__GRAV_CONFIG__?.basePath || '/admin').replace(/\/$/, '');
        return base + '/plugins/blog-manager';
    }

    notify(level, message) {
        window.__GRAV_TOAST?.[level]?.(message);
    }

    escapeHtml(str) {
        return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    render() {
        if (!this.shadowRoot.getElementById('blog-manager-posts')) {
            this.renderShell();
        }
        if (this.loading) {
            this.renderSkeletons();
        } else {
            this.renderPosts();
        }
        if (this.error) {
            const container = this.shadowRoot.getElementById('blog-manager-posts');
            if (container) container.innerHTML = '<p class="no-posts">' + this.escapeHtml(t('loadError', { message: this.error })) + '</p>';
            return;
        }
    }
}

if (!customElements.get(TAG)) {
    customElements.define(TAG, BlogManagerElement);
}
console.log('[BlogManager] Web component loaded');