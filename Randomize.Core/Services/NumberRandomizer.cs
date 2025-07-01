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
    }
}
