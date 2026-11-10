const TAG = window.__GRAV_FIELD_TAG;

const copy = {
    en: {
        scan: 'Scan for articles',
        found: '{n} article(s) found',
        missing: 'Blog folder not found',
        failed: 'Scan failed',
    },
    fr: {
        scan: 'Rechercher les articles',
        found: '{n} article(s) trouvé(s)',
        missing: 'Dossier du blog introuvable',
        failed: 'Échec de la recherche',
    },
    es: {
        scan: 'Buscar artículos',
        found: '{n} artículo(s) encontrado(s)',
        missing: 'No se ha encontrado la carpeta del blog',
        failed: 'Error en la búsqueda',
    },
    it: {
        scan: 'Cerca articoli',
        found: '{n} articolo/i trovato/i',
        missing: 'Cartella del blog non trovata',
        failed: 'Ricerca non riuscita',
    },
    de: {
        scan: 'Beiträge suchen',
        found: '{n} Beitrag/Beiträge gefunden',
        missing: 'Blog-Ordner nicht gefunden',
        failed: 'Suche fehlgeschlagen',
    },
};

function fieldLang() {
    const raw = String(window.__GRAV_I18N?.locale || window.__GRAV_CONFIG__?.language || navigator.language || 'en');
    const code = raw.toLowerCase().split(/[-_]/)[0];
    return copy[code] ? code : 'en';
}

function text(key, vars) {
    const lang = fieldLang();
    let str = (copy[lang] && copy[lang][key]) || copy.en[key] || key;
    if (vars) {
        Object.keys(vars).forEach((name) => {
            str = str.replace('{' + name + '}', vars[name]);
        });
    }
    return str;
}

class BlogPathField extends HTMLElement {
    constructor() {
        super();
        this._value = '';
        this._field = {};
    }

    set field(value) {
        this._field = value || {};
        this.render();
    }

    get field() {
        return this._field;
    }

    set value(value) {
        this._value = value == null ? '' : String(value);
        const input = this.querySelector('input');
        if (input && document.activeElement !== input) {
            input.value = this._value;
        } else if (!input) {
            this.render();
        }
    }

    get value() {
        return this._value;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (this.querySelector('input')) {
            const input = this.querySelector('input');
            if (this._field.placeholder) {
                input.placeholder = this._field.placeholder;
            }
            return;
        }

        this.innerHTML = `
            <style>
                .bm-path-row { display: flex; gap: 8px; align-items: center; }
                .bm-path-row input { flex: 1 1 auto; width: auto !important; min-width: 0; border: 1px solid var(--border, #d4d4d8); border-radius: 6px; background: var(--background, #fff); color: var(--foreground, #18181b); padding: 6px 10px; }
                .bm-path-row button { flex: 0 0 auto; white-space: nowrap; border: 1px solid var(--border, #d4d4d8); border-radius: 6px; background: var(--background, #fff); color: var(--foreground, #18181b); padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer; }
                .bm-path-row button:hover { background: var(--accent, #f4f4f5); }
                .bm-path-row button:disabled { opacity: 0.6; cursor: wait; }
            </style>
            <div class="bm-path-row">
                <input type="text" autocomplete="off" placeholder="${this.escape(this._field.placeholder || '/blog')}" value="${this.escape(this._value)}">
                <button type="button">${this.escape(text('scan'))}</button>
            </div>
        `;

        const input = this.querySelector('input');
        const button = this.querySelector('button');
        input.addEventListener('input', () => {
            this._value = input.value;
            this.dispatchEvent(new CustomEvent('change', { detail: this._value, bubbles: true }));
        });
        button.addEventListener('click', () => this.scan());
    }

    async scan() {
        const button = this.querySelector('button');
        const input = this.querySelector('input');
        button.disabled = true;
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (window.__GRAV_API_TOKEN) {
                headers['X-API-Token'] = window.__GRAV_API_TOKEN;
            }
            const base = (window.__GRAV_API_SERVER_URL || '') + (window.__GRAV_API_PREFIX || '/api/v1');
            const response = await fetch(base + '/blog-manager/scan', {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: JSON.stringify({ path: input.value }),
            });
            const body = await response.json();
            const payload = body && body.data ? body.data : (body || {});
            if (!response.ok || payload.success !== true) {
                window.__GRAV_TOAST?.error(payload.message === 'Blog folder not found' ? text('missing') : text('failed'));
                return;
            }
            window.__GRAV_TOAST?.success(text('found', { n: payload.post_count ?? 0 }));
        } catch (error) {
            window.__GRAV_TOAST?.error(text('failed'));
        } finally {
            button.disabled = false;
        }
    }

    escape(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

if (!customElements.get(TAG)) {
    customElements.define(TAG, BlogPathField);
}
