using System;
using System.Collections.Generic;


namespace Randomize.Core.Services
{
    public static class GroupShufflerCore
    {
        // N groups: optionally shuffle, then round-robin so sizes differ by at most one.
        // shuffle:false keeps the input order (the "keep order" toggle).
        public static List<List<string>> ShuffleIntoGroups(string input, int groupCount, bool shuffle = true)
        {
            var people = SplitPeople(input);
            if (shuffle) FisherYates(people);
            return RoundRobin(people, groupCount);
        }

        // groups of N. Balanced (default) evens the sizes out via round-robin;
        // exactSize fills each group to exactly `size` and leaves the remainder
        // in the final group.
        public static List<List<string>> ShuffleIntoGroupsOfSize(string input, int size, bool shuffle = true, bool exactSize = false)
        {
            if (size < 1) size = 1;
            var people = SplitPeople(input);
            if (people.Count == 0) return new List<List<string>>();
            if (shuffle) FisherYates(people);

            if (exactSize) return Chunk(people, size);

            int groupCount = (int)Math.Ceiling(people.Count / (double)size);
            return RoundRobin(people, groupCount);
        }

        public static int InputCount(string input) => SplitPeople(input).Count;

        // deal people out one at a time across the groups -> sizes differ by <= 1
        private static List<List<string>> RoundRobin(List<string> people, int groupCount)
        {
            if (groupCount < 1) groupCount = 1;
            var groups = Enumerable.Range(0, groupCount)
                .Select(_ => new List<string>())
                .ToList();

            for (int i = 0; i < people.Count; i++)
                groups[i % groupCount].Add(people[i]);

            return groups;
        }

        // contiguous blocks of `size`; the last block keeps whatever is left over
        private static List<List<string>> Chunk(List<string> people, int size)
        {
            var groups = new List<List<string>>();
            for (int i = 0; i < people.Count; i += size)
                groups.Add(people.GetRange(i, Math.Min(size, people.Count - i)));
            return groups;
        }

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
