using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Randomize.Core.Wheel
{
    public class WheelItem
    {
        // stable identity; slice images (kept JS-side) are keyed by this
        public int Id { get; set; }

        public string Label { get; set; } = String.Empty;
        public string Placeholder { get; set; } = String.Empty;

        // relative slice size; 1 = equal share, higher = bigger wedge
        public double Weight { get; set; } = 1;

        // mirrored from JS when a slice image is added/removed
        public bool HasImage { get; set; }
        public string? ImageFileName { get; set; }
    }
}
