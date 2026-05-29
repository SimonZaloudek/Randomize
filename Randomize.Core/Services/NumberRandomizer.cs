using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Randomize.Core.Services
{
    public class NumberRandomizerService
    {
        private readonly Random _random = new();

        public int PickRandom(int min, int max)
        {
            return _random.Next(min, max + 1);
        }

        public int[] RollDice(int count, int sides)
        {
            if (count <= 0 || sides <= 0)
                return Array.Empty<int>();

            var rolls = new int[count];
            for (int i = 0; i < count; i++)
                rolls[i] = _random.Next(1, sides + 1);
            return rolls;
        }

        public int[] PickMultiple(int min, int max, int count, bool unique)
        {
            if (min > max) (min, max) = (max, min);
            if (count <= 0)
                return Array.Empty<int>();

            if (unique)
            {
                long range = (long)max - min + 1;
                if (count > range) count = (int)range;

                var picked = new HashSet<int>();
                var order = new List<int>(count);
                while (order.Count < count)
                {
                    int n = _random.Next(min, max + 1);
                    if (picked.Add(n))
                        order.Add(n);
                }
                return order.ToArray();
            }

            var result = new int[count];
            for (int i = 0; i < count; i++)
                result[i] = _random.Next(min, max + 1);
            return result;
        }

        public string GeneratePin(int length)
        {
            if (length <= 0)
                return string.Empty;

            var sb = new StringBuilder(length);
            for (int i = 0; i < length; i++)
                sb.Append((char)('0' + _random.Next(10)));
            return sb.ToString();
        }

        public DateOnly RandomDate(DateOnly start, DateOnly end)
        {
            if (start > end) (start, end) = (end, start);
            int span = end.DayNumber - start.DayNumber;
            return start.AddDays(_random.Next(span + 1));
        }

        // unused in the UI — kept for later
        public string DecideYesNo(bool includeMaybe)
        {
            var options = includeMaybe
                ? new[] { "Yes", "No", "Maybe" }
                : new[] { "Yes", "No" };
            return options[_random.Next(options.Length)];
        }
    }
}
