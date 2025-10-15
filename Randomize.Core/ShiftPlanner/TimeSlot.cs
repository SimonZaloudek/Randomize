using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Randomize.Core.ShiftPlanner
{

    public class TimeSlot
    {
        private int _demand = 0;
        private static int Hour { get; set; }
        public int Priority { get; set; } = 1;
        public int Demand 
        {
            get => _demand; 
            set => _demand = Math.Clamp(value, 0, 40); 
        }


        public TimeSlot(int hour) 
        {
            Hour = hour;
        }
    }
}
