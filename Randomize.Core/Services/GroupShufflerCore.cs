using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Randomize.Core.Services
{
    public static class GroupShufflerCore
    {
        public static List<List<string>> ShuffleIntoGroups(string input, int groupCount)
        {
            var people = input
                .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .OrderBy(_ => Guid.NewGuid())
                .ToList();

            var groups = Enumerable.Range(0, groupCount)
                .Select(_ => new List<string>())
                .ToList();

            for (int i = 0; i < people.Count; i++)
            {
                groups[i % groupCount].Add(people[i]);
            }

            return groups;
        }

        public static int InputCount(string input)
        {
            var people = input.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            return people.Length;
        }
    }
}
