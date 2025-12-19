using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Randomize.Core.ShiftPlanner
{
    public class ShiftPlannerService
    {
        private readonly Random _random = new();
        private const int MinimumShiftHours = 3;

        public class ShiftAssignment
        {
            public List<Employee> AssignedEmployees { get; set; } = new();
            public List<Employee> UnassignedEmployees { get; set; } = new();
            public List<int> UnfilledHours { get; set; } = new();
            public Dictionary<int, int> HourCoverage { get; set; } = new(); // hour, employee count
        }

        public ShiftAssignment AssignShifts(List<Employee> employees, Dictionary<int, int> hourlyDemand)
        {
            var result = new ShiftAssignment();

            for (int hour = 0; hour <= 30; hour++)
            {
                result.HourCoverage[hour] = 0;
            }

            var remainingDemand = new Dictionary<int, int>(hourlyDemand);
            var shuffledEmployees = employees.OrderBy(_ => _random.Next()).ToList();

            foreach (var employee in shuffledEmployees)
            {
                var assignment = FindBestContinuousShift(employee, remainingDemand, hourlyDemand);

                //demand check
                if (assignment.start != -1 && assignment.end != -1)
                {
                    bool canAssign = true;
                    for (int hour = assignment.start; hour < assignment.end; hour++)
                    {
                        if (!remainingDemand.ContainsKey(hour) || remainingDemand[hour] <= 0)
                        {
                            canAssign = false;
                            break;
                        }
                    }

                    if (canAssign)
                    {
                        employee.AssignedStart = assignment.start;
                        employee.AssignedEnd = assignment.end;
                        employee.IsAssigned = true;
                        result.AssignedEmployees.Add(employee);

                        for (int hour = assignment.start; hour < assignment.end; hour++)
                        {
                            result.HourCoverage[hour]++;

                            if (remainingDemand.ContainsKey(hour))
                            {
                                remainingDemand[hour]--;
                            }
                        }
                    }
                    else
                    {
                        // demand cap check
                        employee.IsAssigned = false;
                        result.UnassignedEmployees.Add(employee);
                    }
                }
                else
                {
                    employee.IsAssigned = false;
                    result.UnassignedEmployees.Add(employee);
                }
            }

            foreach (var kvp in hourlyDemand)
            {
                if (remainingDemand[kvp.Key] > 0)
                {
                    result.UnfilledHours.Add(kvp.Key);
                }
            }

            result.AssignedEmployees = result.AssignedEmployees
                .OrderBy(e => e.AssignedStart)
                .ToList();

            return result;
        }

        private (int start, int end) FindBestContinuousShift(Employee employee, Dictionary<int, int> remainingDemand, Dictionary<int, int> totalDemand)
        {
            var (availStart, availEnd) = employee.GetAvailabilityWindow();
            var maxHours = employee.GetEffectiveMaxHours();

            if (totalDemand.Count == 0)
                return (-1, -1);

            int firstDemandHour = totalDemand.Keys.Min();
            int lastDemandHour = totalDemand.Keys.Max();

            var possibleShifts = new List<(int start, int end, int unfilledHours, int duration)>();

            for (int start = availStart; start <= availEnd; start++)
            {
                if (start > lastDemandHour)
                    break;

                for (int duration = MinimumShiftHours; duration <= maxHours; duration++)
                {
                    int end = start + duration;

                    if (end > availEnd)
                        break;

                    int effectiveEnd = Math.Min(end, lastDemandHour + 1);
                    int effectiveDuration = effectiveEnd - start;

                    if (effectiveDuration < MinimumShiftHours)
                        continue;

                    // demand check again
                    bool shiftFitsInDemand = true;
                    int unfilledHours = 0;

                    for (int hour = start; hour < effectiveEnd; hour++)
                    {
                        if (!remainingDemand.ContainsKey(hour) || remainingDemand[hour] <= 0)
                        {
                            shiftFitsInDemand = false;
                            break;
                        }

                        unfilledHours++;
                    }

                    if (shiftFitsInDemand && unfilledHours >= MinimumShiftHours)
                    {
                        possibleShifts.Add((start, effectiveEnd, unfilledHours, effectiveDuration));
                    }
                }
            }

            if (possibleShifts.Count == 0)
                return (-1, -1);

         
            var sortedShifts = possibleShifts
                .OrderByDescending(s => s.unfilledHours)
                .ThenByDescending(s => s.duration)
                .ToList();

            
            int maxUnfilled = sortedShifts[0].unfilledHours;
            int maxDuration = sortedShifts.Where(s => s.unfilledHours == maxUnfilled).Max(s => s.duration);

            
            var bestShifts = sortedShifts
                .Where(s => s.unfilledHours == maxUnfilled)
                .Where(s => s.duration >= (int)(maxDuration * 0.95))
                .ToList();

           
            var selected = bestShifts[_random.Next(bestShifts.Count)];
            return (selected.start, selected.end);
        }
    }
}
