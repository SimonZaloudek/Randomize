using System;
using System.Collections.Generic;

using System.Text;
using System.Text.Json;

namespace Randomize.Core.ShiftPlanner
{
    public static class EmployeeFileService
    {
        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        // legacy TXT: "Name MaxHours [Start [True]] [End [True]]", spaces in names as '='
        public static string WriteEmployees(IEnumerable<Employee> employees)
        {
            var sb = new StringBuilder();
            foreach (var employee in employees)
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

        public static List<Employee> LoadEmployeesTxt(string text)
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

        // JSON - the current save format
        public static string WriteEmployeesJson(IEnumerable<Employee> employees)
        {
            var dtos = employees.Select(e => new EmployeeDto
            {
                Name = e.Name ?? "",
                MaxHours = e.MaxHours,
                ScheduleStart = e.ScheduleStart,
                ScheduleEnd = e.ScheduleEnd,
                StartNextDay = e.StartNextDay,
                EndNextDay = e.EndNextDay
            }).ToList();

            return JsonSerializer.Serialize(dtos, JsonOpts);
        }

        public static List<Employee> LoadEmployeesJson(string text)
        {
            var dtos = JsonSerializer.Deserialize<List<EmployeeDto>>(text, JsonOpts);
            if (dtos is null) return new List<Employee>();

            return dtos.Select(d => new Employee
            {
                Name = d.Name,
                MaxHours = d.MaxHours,
                ScheduleStart = d.ScheduleStart,
                ScheduleEnd = d.ScheduleEnd,
                StartNextDay = d.StartNextDay,
                EndNextDay = d.EndNextDay
            }).ToList();
        }

        // detect TXT vs JSON by the first non-whitespace char
        public static List<Employee> LoadEmployees(string text)
        {
            var trimmed = (text ?? string.Empty).TrimStart();
            if (trimmed.StartsWith("[") || trimmed.StartsWith("{"))
                return LoadEmployeesJson(text!);
            return LoadEmployeesTxt(text ?? string.Empty);
        }

        private class EmployeeDto
        {
            public string Name { get; set; } = "";
            public int? MaxHours { get; set; }
            public int? ScheduleStart { get; set; }
            public int? ScheduleEnd { get; set; }
            public bool StartNextDay { get; set; }
            public bool EndNextDay { get; set; }
        }
    }
}
