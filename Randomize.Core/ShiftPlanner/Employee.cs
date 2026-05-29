using System;

namespace Randomize.Core.ShiftPlanner
{
    public class Employee
    {
        // stable id so the UI can track an employee across edits / file loads
        public Guid Id { get; init; } = Guid.NewGuid();

        public string? Name { get; set; }
        public int MaxHoursDefault { get; } = 12;
        public int? MaxHours { get; set; }

        public bool StartNextDay { get; set; }
        public bool EndNextDay { get; set; }

        public int? ScheduleStart { get; set; }
        public int? ScheduleEnd { get; set; }

        public string DisplayStart
        {
            get
            {
                if (!ScheduleStart.HasValue)
                    return "–";
                int value = ScheduleStart.Value;
                if (value >= 24) value -= 24;

                string moon = StartNextDay ? " <i class='bi bi-moon-stars small-icon'></i>" : "";
                return $"{value}:00{moon}";
            }
        }

        public string DisplayEnd
        {
            get
            {
                if (!ScheduleEnd.HasValue)
                    return "–";
                int value = ScheduleEnd.Value;
                if (value >= 24) value -= 24;

                string moon = EndNextDay ? " <i class='bi bi-moon-stars small-icon'></i>" : "";
                return $"{value}:00{moon}";
            }
        }

        public int AssignedStart { get; set; } = -1;
        public int AssignedEnd { get; set; } = -1;
        public bool IsAssigned { get; set; } = false;

        public int GetEffectiveMaxHours() => MaxHours ?? MaxHoursDefault;

        public (int start, int end) GetAvailabilityWindow()
        {
            int start = ScheduleStart ?? 0;
            int end = ScheduleEnd ?? 30;
            return (start, end);
        }
    }
}
