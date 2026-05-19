using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Randomize.Core.Services
{
    public class StringRandomizerService
    {
        private readonly Random _random = new();

        public string? PickRandom(string[] items)
        {
            if (items == null || items.Length == 0)
                return null;

            int index = _random.Next(items.Length);
            return items[index];
        }

        public string? PickWeighted(string[] lines)
        {
            if (lines == null || lines.Length == 0)
                return null;

            var items = new List<(int weight, string text)>();
            foreach (var raw in lines)
            {
                if (string.IsNullOrWhiteSpace(raw))
                    continue;

                var line = raw.Trim();
                int colon = line.IndexOf(':');
                if (colon > 0 && int.TryParse(line.Substring(0, colon).Trim(), out int w) && w > 0)
                {
                    var text = line.Substring(colon + 1).Trim();
                    if (text.Length > 0)
                        items.Add((w, text));
                }
                else
                {
                    items.Add((1, line));
                }
            }

            if (items.Count == 0)
                return null;

            int total = items.Sum(x => x.weight);
            int roll = _random.Next(total);
            int acc = 0;
            foreach (var (weight, text) in items)
            {
                acc += weight;
                if (roll < acc) return text;
            }
            return items[^1].text;
        }

        public string? GeneratePassword(int length, bool upper, bool lower, bool digits, bool symbols)
        {
            var pool = new StringBuilder();
            if (upper) pool.Append("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
            if (lower) pool.Append("abcdefghijklmnopqrstuvwxyz");
            if (digits) pool.Append("0123456789");
            if (symbols) pool.Append("!@#$%^&*()-_=+[]{};:,.<>/?");

            if (pool.Length == 0 || length <= 0)
                return null;

            var chars = pool.ToString();
            var sb = new StringBuilder(length);
            for (int i = 0; i < length; i++)
                sb.Append(chars[_random.Next(chars.Length)]);
            return sb.ToString();
        }

        public string? GenerateToken(int length, string charset)
        {
            if (length <= 0 || string.IsNullOrEmpty(charset))
                return null;

            var sb = new StringBuilder(length);
            for (int i = 0; i < length; i++)
                sb.Append(charset[_random.Next(charset.Length)]);
            return sb.ToString();
        }
    }
}
