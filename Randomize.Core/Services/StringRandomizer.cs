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
    }
}
