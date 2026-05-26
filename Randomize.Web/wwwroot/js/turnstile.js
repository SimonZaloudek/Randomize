// Thin wrapper around Cloudflare Turnstile so the Blazor Contact page can
// render the widget, read the token on submit, and reset it between sends
// without dragging the CF script's globals into C#.
window.RandomizeTurnstile = {
    _token: null,
    _widgetId: null,

    render: function (containerSelector, sitekey) {
        if (typeof turnstile === 'undefined') {
            // Script hasn't loaded yet (defer + slow network). Caller can retry.
            return false;
        }

        const container = document.querySelector(containerSelector);
        if (!container) return false;

        // If we already rendered into this container, reset instead of double-mounting.
        if (this._widgetId !== null) {
            turnstile.reset(this._widgetId);
            this._token = null;
            return true;
        }

        this._widgetId = turnstile.render(container, {
            sitekey: sitekey,
            theme: 'dark',
            callback: (token) => { window.RandomizeTurnstile._token = token; },
            'expired-callback': () => { window.RandomizeTurnstile._token = null; },
            'error-callback': () => { window.RandomizeTurnstile._token = null; }
        });
        return true;
    },

    getToken: function () {
        return this._token;
    },

    reset: function () {
        this._token = null;
        if (this._widgetId !== null && typeof turnstile !== 'undefined') {
            turnstile.reset(this._widgetId);
        }
    },

    isReady: function () {
        return typeof turnstile !== 'undefined';
    }
};
