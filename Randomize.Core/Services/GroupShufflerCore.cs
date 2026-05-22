using System;
using System.Collections.Generic;
using System.Linq;

namespace Randomize.Core.Services
{
    public static class GroupShufflerCore
    {
        // "N groups" mode: shuffles the input lines and distributes them round-robin
        // into `groupCount` groups. Round-robin (rather than sequential chunks)
        // keeps group sizes balanced — they differ by at most one, so no tiny
        // leftover group.
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

        // "Groups of N" mode: derives the group count from the desired size, then
        // delegates to round-robin — fewer big groups, no orphan singletons when
        // the total isn't a multiple of the size.
        public static List<List<string>> ShuffleIntoGroupsOfSize(string input, int size)
        {
            if (size < 1) size = 1;
            int total = InputCount(input);
            if (total == 0) return new List<List<string>>();
            int groupCount = (int)Math.Ceiling(total / (double)size);
            return ShuffleIntoGroups(input, groupCount);
        }

        public static int InputCount(string input) => SplitPeople(input).Count;

        // Splits on newlines, trims each entry, drops empties — so "  Alice  " and
        // stray blank lines are handled without surprising the caller.
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
