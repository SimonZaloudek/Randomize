using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Randomize.Core.ShiftPlanner
{
    public class Employee
    {
        public string Name { get; set; }
        public int MaxHoursDefault { get; } = 12;
        public int? MaxHours { get; set; }
        public int? ScheduleStart { get; set; }
        public int? ScheduleEnd { get; set; }
        public int? ScheduleEndValue { get; set; }

        public Employee() 
        {
         
        } 


    }
}
