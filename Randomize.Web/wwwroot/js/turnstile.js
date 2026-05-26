// Thin wrapper around Cloudflare Turnstile so the Blazor Contact page can
// render the widget, read the token on submit, and tear it down between
// SPA navigations without dragging the CF script's globals into C#.
//
// SPA gotcha: Blazor unmounts the page on navigation, which removes the
// container element AND the widget's iframe — but this module's globals
// survive. If we naively call turnstile.reset() with a now-stale widget id,
// CF throws "Nothing to reset found for provided container." Every path
// here treats a missing/detached widget as "render fresh" rather than an
// error.
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

        // Same container still hosts the previous widget → just refresh it.
        if (this._widgetId !== null && this._containerEl === container) {
            try {
                turnstile.reset(this._widgetId);
                this._token = null;
                return true;
            } catch {
                // Widget was torn down (Blazor unmount). Forget it and fall
                // through to a fresh mount below.
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
        if (this._widgetId !== null && typeof turnstile !== 'undefined') {
            try {
                turnstile.reset(this._widgetId);
            } catch {
                // Widget detached — clear our refs so the next render()
                // mounts cleanly instead of trying to reset a ghost.
                this._widgetId = null;
                this._containerEl = null;
            }
        }
    },

    // Called on component dispose. Fully destroys the widget so the next
    // mount starts from a clean slate.
    remove: function () {
        if (this._widgetId !== null && typeof turnstile !== 'undefined') {
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
