// Cloudflare Turnstile wrapper for the contact page. Blazor unmounts the page
// on navigation but keeps these globals, so every path guards against a stale
// widget id (otherwise reset() throws "nothing to reset").
window.RandomizeTurnstile = {
    _token: null,
    _widgetId: null,
    _containerEl: null,

    render: function (containerSelector, sitekey) {
        if (typeof turnstile === 'undefined') {
            return false;
        }

        const container = document.querySelector(containerSelector);
        if (!container) return false;

        // same container, existing widget → just refresh
        if (this._widgetId && this._containerEl === container) {
            try {
                turnstile.reset(this._widgetId);
                this._token = null;
                return true;
            } catch {
                // widget gone - fall through to a fresh mount
                this._widgetId = null;
            }
        }

        this._token = null;
        this._containerEl = container;

        try {
            this._widgetId = turnstile.render(container, {
                sitekey: sitekey,
                theme: 'dark',
                callback: (token) => { window.RandomizeTurnstile._token = token; },
                'expired-callback': () => { window.RandomizeTurnstile._token = null; },
                'error-callback': () => { window.RandomizeTurnstile._token = null; }
            });
        } catch {
            this._widgetId = null;
            this._containerEl = null;
            return false;
        }
        return true;
    },

    getToken: function () {
        return this._token;
    },

    reset: function () {
        this._token = null;
        if (this._widgetId && typeof turnstile !== 'undefined') {
            try {
                turnstile.reset(this._widgetId);
            } catch {
                // detached - clear refs so the next render() mounts clean
                this._widgetId = null;
                this._containerEl = null;
            }
        }
    },

    // destroy the widget on dispose
    remove: function () {
        if (this._widgetId && typeof turnstile !== 'undefined') {
            try { turnstile.remove(this._widgetId); } catch { /* already gone */ }
        }
        this._widgetId = null;
        this._token = null;
        this._containerEl = null;
    },

    isReady: function () {
        return typeof turnstile !== 'undefined';
    }
};
