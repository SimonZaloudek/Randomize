using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Randomize.Core.Wheel
{
    public class WheelItem
    {
        public string Label { get; set; } = String.Empty;
        public string Placeholder { get; set; } = String.Empty;

        // relative slice size; 1 = equal share, higher = bigger wedge
        public double Weight { get; set; } = 1;
    }
}
