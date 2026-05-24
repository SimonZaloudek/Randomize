using System.Collections.Generic;

namespace Randomize.Core.ShiftPlanner
{
    public class Shift
    {
        private readonly List<TimeSlot> _shift;

        public Shift()
        {
            _shift = new List<TimeSlot>();
            ShiftInit();
        }

        // 31 slots: hours 0..23 are today, 24..30 are the early hours of the next
        // day. This range is also hard-coded in ShiftPlannerService.AssignShifts
        // and in the Razor timeline / Gantt loops — change all three together.
        private void ShiftInit()
        {
            for (int i = 0; i <= 30; i++)
            {
                _shift.Add(new TimeSlot());
            }
        }

        public TimeSlot GetTimeSlot(int i)
        {
            return _shift[i];
        }
    }
}
