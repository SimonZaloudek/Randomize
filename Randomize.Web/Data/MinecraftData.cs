namespace Randomize.Web.Data;

/// <summary>Curated pools for the Minecraft section (/minecraft*). All client-side.
/// Ids are stable - they're used in share links, so never rename one, only add.
/// Curse: 1 mild, 2 spicy, 3 cursed - feeds the Survival Bravery cursedness meter.</summary>
public sealed record McGoal(string Id, string Label, string Text);
public sealed record McRule(string Id, string Text, int Curse);
public sealed record McGear(string Id, string Text, int Curse);
public sealed record McBiome(string Id, string Name, string Note);

// Build Ideas (/minecraft/builds). McBlock.Hex paints the palette swatch chips.
public sealed record McStructure(string Id, string Name);
public sealed record McStyle(string Id, string Name);
public sealed record McBlock(string Name, string Hex);
public sealed record McPalette(string Id, string Name, McBlock[] Blocks);
public sealed record McSetting(string Id, string Name);
public sealed record McTwist(string Id, string Text);

// SMP session challenges (/minecraft/rolls)
public sealed record McSmp(string Id, string Label, string Text, int Diff);

public static class MinecraftData
{
    // ===== Survival Bravery =====

    public static readonly McGoal[] Goals =
    {
        new("dragon",     "Free the End",      "Beat the Ender Dragon."),
        new("wither",     "Wither Away",       "Summon and defeat the Wither."),
        new("netherite",  "Full Netherite",    "Craft a full set of netherite armor."),
        new("elytra",     "Learn to Fly",      "Find an elytra and fly home with it."),
        new("hundred",    "100 Days",          "Survive 100 in-game days."),
        new("beacon",     "Light the Beacon",  "Build and power a full beacon pyramid."),
        new("trims",      "Fashion Victory",   "Collect 5 different armor trims."),
        new("conduit",    "Ocean Master",      "Activate a conduit at full power."),
        new("village",    "Mayor of Nowhere",  "Grow a village to 10 villagers with beds and jobs for all."),
        new("music",      "The Collector",     "Play 5 different music discs on a jukebox at your base."),
    };

    public static readonly McRule[] Rules =
    {
        new("no-beds",       "No beds. The night is part of the run.", 2),
        new("no-trade",      "No villager trading. Earn everything yourself.", 2),
        new("no-coords",     "F3 is banned. Navigate by landmarks and stars.", 2),
        new("hardcore-ish",  "One death ends the run.", 3),
        new("no-shield",     "Shields are banned.", 2),
        new("vegetarian",    "No meat. Bread, carrots and regret.", 1),
        new("no-torch",      "No torches. Light your world with anything else.", 2),
        new("silent",        "No placing blocks in the Nether. Bridge with what's there.", 3),
        new("boat-life",     "Roads are banned. Travel overland by boat, minecart or foot only.", 1),
        new("early-bird",    "Every sunrise, you must be outside under open sky.", 1),
        new("pacifist-mobs", "Passive mobs are sacred. Never harm one.", 1),
        new("no-iron-farm",  "No mob or iron farms. Every drop is hand-earned.", 2),
        new("one-chest",     "Your entire storage is one double chest.", 3),
        new("no-enchants",   "The enchanting table is decoration. Books only from loot.", 3),
        new("tourist",       "You may never sleep in the same chunk twice.", 3),
    };

    public static readonly McGear[] Gear =
    {
        new("stone-tools",  "Tools cap at stone. Diamonds are for blocks.", 2),
        new("no-chest",     "No chestplate. Feel the breeze.", 2),
        new("two-armor",    "Pick any two armor pieces. The rest stays in the chest.", 2),
        new("punch-nether", "No weapons until you've entered the Nether. Fists first.", 3),
        new("gold-only",    "Armor must be gold. Piglins approve.", 2),
        new("no-bow",       "Bows and crossbows are banned. Close the distance.", 2),
        new("one-tool",     "One tool slot: pick axe, pickaxe, shovel or hoe. That's your tool for life.", 3),
        new("leather-fit",  "Leather armor only, dyed one colour of your choice.", 2),
        new("no-totem",     "Totems of Undying are banned. No second chances.", 1),
        new("fishing-pro",  "You must always carry a fishing rod in your hotbar.", 1),
    };

    public static readonly McBiome[] Biomes =
    {
        new("plains",       "Plains",          "Classic. Flat. Exposed."),
        new("desert",       "Desert",          "No wood, no water, no mercy."),
        new("jungle",       "Jungle",          "Can't see the base for the trees."),
        new("ice-spikes",   "Ice Spikes",      "Everything is frozen, including your crops."),
        new("mushroom",     "Mushroom Island", "No hostile mobs. No neighbours either."),
        new("swamp",        "Swamp",           "Witches, slimes and waterlogged everything."),
        new("badlands",     "Badlands",        "Gorgeous terracotta, zero food."),
        new("dark-forest",  "Dark Forest",     "The mobs spawn in daylight here."),
        new("cherry",       "Cherry Grove",    "Pretty in pink. Petals everywhere."),
        new("snowy-taiga",  "Snowy Taiga",     "Wolves and frostbite."),
        new("savanna",      "Savanna",         "Acacia as far as the eye can see."),
        new("deep-dark",    "Deep Dark",       "Home is where the warden is. Sneak."),
    };

    // ===== Build Ideas =====

    public static readonly McStructure[] Structures =
    {
        new("tower",      "Wizard tower"),
        new("bridge",     "Grand bridge"),
        new("farmhouse",  "Working farmhouse"),
        new("temple",     "Forgotten temple"),
        new("lighthouse", "Lighthouse"),
        new("windmill",   "Windmill"),
        new("cathedral",  "Cathedral"),
        new("market",     "Market square"),
        new("ship",       "Sailing ship"),
        new("castle-gate","Castle gatehouse"),
        new("library",    "Grand library"),
        new("greenhouse", "Greenhouse"),
        new("tavern",     "Roadside tavern"),
        new("observatory","Observatory"),
        new("aqueduct",   "Aqueduct"),
        new("mausoleum",  "Mausoleum"),
        new("treehouse",  "Treehouse village"),
        new("forge",      "Dwarven forge"),
    };

    public static readonly McStyle[] Styles =
    {
        new("medieval",   "Medieval"),
        new("steampunk",  "Steampunk"),
        new("japanese",   "Japanese"),
        new("brutalist",  "Brutalist"),
        new("nordic",     "Nordic"),
        new("gothic",     "Gothic"),
        new("fairy",      "Fairycore"),
        new("industrial", "Industrial"),
        new("desert",     "Desert kingdom"),
        new("futuristic", "Futuristic"),
        new("rustic",     "Rustic"),
        new("ruined",     "Ancient ruin"),
        new("art-deco",   "Art deco"),
        new("organic",    "Organic / overgrown"),
    };

    public static readonly McPalette[] Palettes =
    {
        new("spruce-slate", "Spruce & Deepslate", new McBlock[] {
            new("Spruce Planks", "#72543a"), new("Deepslate Bricks", "#4c4c50"),
            new("Cobbled Deepslate", "#3d3d43"), new("Stripped Dark Oak", "#584428"), new("Lantern", "#f3b25b") }),
        new("desert-oasis", "Desert Oasis", new McBlock[] {
            new("Smooth Sandstone", "#e0d6a6"), new("Cut Sandstone", "#d8c98a"),
            new("Orange Terracotta", "#a15325"), new("Jungle Planks", "#a97b57"), new("Water", "#3f76e4") }),
        new("cherry-blossom", "Cherry Blossom", new McBlock[] {
            new("Cherry Planks", "#e2b3ab"), new("White Concrete", "#e9ecec"),
            new("Pink Petals", "#f4b4c9"), new("Stripped Cherry Log", "#d59f8c"), new("Copper Block", "#c06d4b") }),
        new("nether-fortress", "Nether Nights", new McBlock[] {
            new("Polished Blackstone", "#3a3640"), new("Crimson Planks", "#7e3a56"),
            new("Nether Bricks", "#2d1620"), new("Shroomlight", "#f09253"), new("Gilded Blackstone", "#82603d") }),
        new("quartz-royal", "Quartz Royal", new McBlock[] {
            new("Quartz Bricks", "#ebe6df"), new("Smooth Quartz", "#efeae2"),
            new("Waxed Copper", "#c06d4b"), new("Dark Prismarine", "#345c4c"), new("Gold Block", "#f8d33e") }),
        new("mossy-cottage", "Mossy Cottage", new McBlock[] {
            new("Moss Block", "#5d7e3a"), new("Cobblestone", "#7f7f7f"),
            new("Oak Planks", "#a8834f"), new("Mud Bricks", "#8a6a53"), new("Flowering Azalea", "#6f8e4a") }),
        new("prismarine-deep", "Ocean Temple", new McBlock[] {
            new("Prismarine Bricks", "#63ac9f"), new("Dark Prismarine", "#345c4c"),
            new("Sea Lantern", "#c9ddd6"), new("Warped Planks", "#2b6963"), new("Tube Coral", "#3055c2") }),
        new("terracotta-mesa", "Painted Mesa", new McBlock[] {
            new("Red Terracotta", "#8f3d2e"), new("Orange Terracotta", "#a15325"),
            new("Yellow Terracotta", "#ba8523"), new("White Terracotta", "#d1b2a1"), new("Spruce Log", "#3b2711") }),
        new("basalt-ice", "Basalt & Ice", new McBlock[] {
            new("Polished Basalt", "#59595c"), new("Packed Ice", "#8db4fa"),
            new("Blue Ice", "#74a8fd"), new("Snow Block", "#f2fbfb"), new("Soul Lantern", "#6ed6d0") }),
        new("bamboo-jungle", "Bamboo Grove", new McBlock[] {
            new("Bamboo Planks", "#c1ad50"), new("Bamboo Mosaic", "#b6a248"),
            new("Jungle Leaves", "#3c8721"), new("Muddy Mangrove Roots", "#5b4635"), new("Ochre Froglight", "#f5e07a") }),
    };

    public static readonly McSetting[] Settings =
    {
        new("cliff",      "On a cliffside"),
        new("underwater", "Underwater"),
        new("floating",   "Floating in the sky"),
        new("cave",       "Inside a cave"),
        new("mountain",   "Carved into a mountain"),
        new("island",     "On a tiny island"),
        new("swamp",      "Sunk in a swamp"),
        new("nether",     "In the Nether"),
        new("end",        "In the End"),
        new("ravine",     "Spanning a ravine"),
        new("plains",     "In open plains"),
        new("village",    "Inside an existing village"),
    };

    public static readonly McTwist[] Twists =
    {
        new("no-symmetry",  "No symmetry - nothing may mirror."),
        new("one-chunk",    "The whole build fits in one chunk (16x16)."),
        new("no-stairs",    "No stair blocks. Slabs and full blocks only."),
        new("interior",     "Full interior required - every room furnished."),
        new("night-build",  "Build it at night, no extra light sources while building."),
        new("survival",     "Survival mode only - gather every block."),
        new("upside-down",  "Build it upside down."),
        new("abandoned",    "It must look abandoned for 100 years."),
        new("giant",        "Triple the scale you'd normally build."),
        new("hollow",       "It must be enterable through at least 3 different ways."),
    };

    // ===== SMP session challenges =====

    public static readonly McSmp[] Smp =
    {
        new("trade-economy", "Merchant",      "You may only gain items by trading with players or villagers today.", 2),
        new("no-y0",         "Surface Life",  "No mining below y=0 this session.", 1),
        new("hoarder",       "Hoarder",       "Nothing you pick up may be thrown away or given away.", 1),
        new("bodyguard",     "Bodyguard",     "Pick another player. If they die this session, you owe them your gear.", 2),
        new("vegetarian",    "Herbivore",     "No meat today. Your golden carrots sustain you.", 1),
        new("mute",          "The Mime",      "No chat, no voice. Signs and gestures only.", 2),
        new("gift-economy",  "Gift Giver",    "Every time you visit another player's base, you must leave a gift.", 1),
        new("cursed-tools",  "Wrong Tool",    "Never use the correct tool. Shovel the stone, pickaxe the dirt.", 3),
        new("shadow",        "The Shadow",    "Pick a player secretly and follow them for 15 minutes without being caught.", 2),
        new("realtor",       "Squatter",      "Start today's session from someone else's base. Ask nothing.", 1),
        new("dragon-hunt",   "Loot Goblin",   "Everything you mine today goes into other players' chests.", 3),
        new("no-craft",      "Stone Age",     "No crafting table access this session. Inventory crafting only.", 3),
        new("beggar",        "The Beggar",    "You start with an empty inventory and may not open your own chests.", 3),
        new("tour-guide",    "Tour Guide",    "Build a functional attraction and get 2 players to visit before logging off.", 2),
    };

    public static string SmpDiffLabel(int diff) => diff switch
    {
        1 => "Chill",
        2 => "Spicy",
        _ => "Evil",
    };

    // ===== Quick Roll pools =====

    public static readonly string[] Blocks =
    {
        "Deepslate Bricks", "Cherry Planks", "Copper Block", "Mud Bricks", "Amethyst Block",
        "Prismarine Bricks", "Crying Obsidian", "Bamboo Mosaic", "Sculk", "Glowstone",
        "Red Sandstone", "Warped Planks", "Dripstone Block", "Moss Block", "Tuff Bricks",
        "Ochre Froglight", "Honey Block", "Bone Block", "Purpur Pillar", "Calcite",
        "Polished Blackstone", "Waxed Oxidized Copper", "Packed Mud", "End Stone Bricks",
    };

    public static readonly string[] Items =
    {
        "Ender Pearl", "Golden Carrot", "Firework Rocket", "Bucket of Axolotl", "Name Tag",
        "Totem of Undying", "Recovery Compass", "Spyglass", "Goat Horn", "Brush",
        "Lead", "Saddle", "Heart of the Sea", "Echo Shard", "Music Disc 13",
        "Suspicious Stew", "Trident", "Turtle Helmet", "Cake", "Wind Charge",
    };

    public static readonly string[] Mobs =
    {
        "Allay", "Warden", "Goat", "Piglin Brute", "Mooshroom",
        "Axolotl", "Camel", "Sniffer", "Breeze", "Armadillo",
        "Evoker", "Shulker", "Strider", "Panda", "Fox",
        "Phantom", "Ravager", "Bee", "Frog", "Ghast",
        "Iron Golem", "Wandering Trader", "Cave Spider", "Skeleton Horse",
    };

    public static readonly string[] Enchantments =
    {
        "Mending", "Silk Touch", "Thorns III", "Curse of Binding", "Frost Walker",
        "Fortune III", "Looting III", "Riptide", "Channeling", "Soul Speed",
        "Swift Sneak", "Sweeping Edge", "Fire Aspect II", "Infinity", "Loyalty III",
        "Curse of Vanishing",
    };

    public static readonly string[] Effects =
    {
        "Speed II", "Slow Falling", "Levitation", "Bad Omen", "Hero of the Village",
        "Invisibility", "Night Vision", "Mining Fatigue", "Darkness", "Absorption",
        "Conduit Power", "Glowing", "Weakness", "Luck",
    };

    public static string CurseLabel(int score) => score switch
    {
        < 25 => "A stroll",
        < 50 => "Brave",
        < 75 => "Reckless",
        _    => "Cursed",
    };
}
