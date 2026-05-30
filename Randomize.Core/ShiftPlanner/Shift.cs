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

        // 31 slots: 0–23 today, 24–30 next morning. Also hard-coded in
        // ShiftPlannerService.AssignShifts and the Razor timeline - keep in sync.
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
