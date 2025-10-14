using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.AccessControl;
using System.Text;
using System.Threading.Tasks;

namespace Randomize.Core.ShiftPlanner
{
    public class Shift
    {

        private List<TimeSlot> _shift;
        
        public Shift() 
        {
            _shift = [];
            ShiftInit();
        }

        private void ShiftInit() 
        {
            for (int i = 0; i <= 30; i++) 
            {
                _shift.Add(new TimeSlot(i));
            }
        }

        public TimeSlot GetTimeSlot(int i) 
        {
            return _shift[i];
        }  

    }
}
