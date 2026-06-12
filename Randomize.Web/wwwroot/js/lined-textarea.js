// Keeps a line-number gutter aligned with its textarea by mirroring the
// vertical scroll position. Called once per element from LinedTextarea.razor.
window.LinedTextarea = {
    attach: function (area, gutter) {
        if (!area || !gutter) return;
        area.addEventListener('scroll', function () {
            gutter.scrollTop = area.scrollTop;
        }, { passive: true });
    }
};
