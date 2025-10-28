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
                if (!string.IsNullOrEmpty(employee.Name))
                    sb.Append(employee.Name.Replace(" ", "="));

                sb.Append($" {employee.MaxHours}");

                if (employee.ScheduleStart.HasValue) 
                {
                    sb.Append($" {employee.ScheduleStart.Value}");
                    if (employee.StartNextDay)
                    {
                        sb.Append($" {employee.StartNextDay}");
                    }
                }

                if (employee.ScheduleEnd.HasValue)
                {
                    sb.Append($" {employee.ScheduleEnd.Value}");
                    if (employee.EndNextDay)
                    {
                        sb.Append($" {employee.EndNextDay}");
                    }
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
                    StartNextDay = false, 
                    EndNextDay = false    
                };
                int idx = 2;

                if (idx < parts.Length && int.TryParse(parts[idx], out var start))
                {
                    emp.ScheduleStart = start;
                    idx++;

                    if (idx < parts.Length && parts[idx] == "True")
                    {
                        emp.StartNextDay = true;
                        idx++;
                    }
                }

                if (idx < parts.Length && int.TryParse(parts[idx], out var end))
                {
                    emp.ScheduleEnd = end;
                    idx++;

                    if (idx < parts.Length && parts[idx] == "True")
                    {
                        emp.EndNextDay = true;
                        idx++;
                    }
                }

                employees.Add(emp);
            }

            return employees;
        }

    }
}
