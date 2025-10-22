using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Randomize.Core.ShiftPlanner
{
    public static class EmployeeFileService
    {


        public static string WriteEmployees(IEnumerable<Employee> employees)
        { 
            StringBuilder sb = new StringBuilder();
            foreach (Employee employee in employees)
            {
                sb.Append(employee.Name.Replace(" ", "="));
                sb.Append($" {employee.MaxHours}");

                if (employee.ScheduleStart.HasValue) 
                {
                    sb.Append($" {employee.ScheduleStart.Value}");
                }
                if (employee.ScheduleEnd.HasValue)
                {
                    sb.Append($" {employee.ScheduleEnd.Value}");
                }
                sb.AppendLine();
            }
            return sb.ToString();
        }

        public static List<Employee> LoadEmployees(string text)
        {
            var employees = new List<Employee>();
            var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);

            foreach (var line in lines)
            {
                var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length == 0)
                    continue;

                var emp = new Employee
                {
                    Name = string.Join(" ", parts[0].Split('=')),
                    MaxHours = parts.Length > 1 && int.TryParse(parts[1], out var maxH) ? maxH : 12,
                    ScheduleStart = parts.Length > 2 && int.TryParse(parts[2], out var start) ? start : null,
                    ScheduleEnd = parts.Length > 3 && int.TryParse(parts[3], out var end) ? end : null
                };

                employees.Add(emp);
            }

            return employees;
        }

    }
}
