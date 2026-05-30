using System;
using System.Collections.Generic;


namespace Randomize.Core.Services
{
    public static class GroupShufflerCore
    {
        // N groups: shuffle, then round-robin so sizes differ by at most one
        public static List<List<string>> ShuffleIntoGroups(string input, int groupCount)
        {
            var people = SplitPeople(input);
            FisherYates(people);

            var groups = Enumerable.Range(0, groupCount)
                .Select(_ => new List<string>())
                .ToList();

            for (int i = 0; i < people.Count; i++)
                groups[i % groupCount].Add(people[i]);

            return groups;
        }

        // groups of N: derive the count, then reuse the round-robin split
        public static List<List<string>> ShuffleIntoGroupsOfSize(string input, int size)
        {
            if (size < 1) size = 1;
            int total = InputCount(input);
            if (total == 0) return new List<List<string>>();
            int groupCount = (int)Math.Ceiling(total / (double)size);
            return ShuffleIntoGroups(input, groupCount);
        }

        public static int InputCount(string input) => SplitPeople(input).Count;

        // split on newlines, trim, drop empties
        private static List<string> SplitPeople(string input) =>
            (input ?? string.Empty)
                .Split(new[] { '\r', '\n' },
                       StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();

        private static void FisherYates(List<string> list)
        {
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = Random.Shared.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }
    }
}
