using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Randomize.Core.ShiftPlanner
{
    public class Employee
    {
        private int? _scheduleStart;
        private int? _scheduleEnd;

        public string? Name { get; set; }
        public int MaxHoursDefault { get; } = 12;
        public int? MaxHours { get; set; }

        public bool StartNextDay { get; set; }
        public bool EndNextDay { get; set; }

        public int? ScheduleStart
        {
            get => _scheduleStart;
            set => _scheduleStart = value;
        }

        public int? ScheduleEnd
        {
            get => _scheduleEnd;
            set => _scheduleEnd = value;
        }


        public string DisplayStart
        {
            get
            {
                if (!_scheduleStart.HasValue)
                    return "–";
                int value = _scheduleStart.Value;
                if (value >= 24) value -= 24;

                string moon = StartNextDay ? " <i class='bi bi-moon-stars small-icon'></i>" : "";
                return $"{value}:00{moon}";
            }
        }

        public string DisplayEnd
        {
            get
            {
                if (!_scheduleEnd.HasValue)
                    return "–";
                int value = _scheduleEnd.Value;
                if (value >= 24) value -= 24;

                string moon = EndNextDay ? " <i class='bi bi-moon-stars small-icon'></i>" : "";
                return $"{value}:00{moon}";
            }
        }
    }
}
