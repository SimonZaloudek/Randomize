namespace Randomize.Web.Data;

/// <summary>One self-imposed rule for the Challenge Generator. Diff: 1 Casual, 2 Sweaty, 3 Cursed.
/// Ids are stable - they're used in share links, so never rename one, only add.</summary>
public sealed record GamingChallenge(string Id, string Label, string Text, string[] Genres, int Diff);

public static class GamingChallenges
{
    public static readonly (string Id, string Name)[] Genres =
    {
        ("any", "Any game"),
        ("fps", "FPS"),
        ("moba", "MOBA"),
        ("br", "Battle Royale"),
        ("souls", "Souls-like"),
        ("racing", "Racing"),
        ("strategy", "Strategy"),
        ("survival", "Survival"),
        ("mmo", "MMO"),
    };

    public static string DiffLabel(int diff) => diff switch
    {
        1 => "Casual",
        2 => "Sweaty",
        _ => "Cursed",
    };

    private static string[] G(params string[] g) => g;

    public static readonly GamingChallenge[] All =
    {
        // ---- generic: must work in literally any game ----
        new("mute-all",       "Mute Everything",     "All game audio off. Eyes only.", G("any"), 2),
        new("walk-only",      "No Sprint",           "Walking speed only. No sprinting, dashing or mounts.", G("any"), 1),
        new("hud-off",        "HUD Off",             "Disable as much of the HUD as the game allows, for the whole session.", G("any"), 3),
        new("potato-mode",    "Potato Mode",         "Lowest graphics settings, smallest resolution. Embrace 2009.", G("any"), 1),
        new("one-life",       "One Life",            "You get a single life. Death ends the session.", G("any"), 3),
        new("death-tax",      "Death Tax",           "Every death costs you 10 push-ups before you respawn.", G("any"), 2),
        new("documentary",    "Nature Documentary",  "Narrate everything you do in a calm documentary voice. Breaking character means restarting the mission.", G("any"), 1),
        new("sens-roulette",  "Sensitivity Roulette","Flip a coin: double or halve your sensitivity. Keep it all session.", G("any"), 2),
        new("comfort-ban",    "Comfort Pick Ban",    "Your favourite character, weapon or loadout is banned tonight.", G("any"), 1),
        new("one-menu",       "One Menu",            "You may open your inventory or loadout screen once per match. Plan it.", G("any"), 2),
        new("ping-only",      "Ping Only",           "No voice, no text chat. Communicate with pings and emotes only.", G("any"), 1),
        new("southpaw",       "Southpaw",            "Swap your mouse to the other hand, or mirror your stick layout.", G("any"), 3),
        new("wrong-ost",      "Wrong Soundtrack",    "Mute the music and blast a soundtrack from a completely different genre.", G("any"), 1),
        new("off-meta",       "Off-Meta Only",       "If a tier list recommends it, it's banned. Build your own meta.", G("any"), 2),
        new("first-offer",    "First Pick Lock-In",  "Lock in the first character or loadout the game offers you. No scrolling.", G("any"), 1),

        // ---- fps ----
        new("pistols-only",   "Pistols Only",        "Sidearms only. Rifles are decoration.", G("fps"), 2),
        new("hipfire",        "Hip-Fire Hero",       "No aiming down sights. Shoot from the hip like an action movie.", G("fps"), 2),
        new("scavenger",      "Scavenger",           "You may only use weapons looted from downed enemies.", G("fps"), 2),
        new("full-mag",       "Full Send Mags",      "No manual reloads. You reload only when the magazine runs dry.", G("fps"), 1),
        new("iron-snipers",   "Iron Snipers",        "Snipers only, scopes banned. Iron sights or nothing.", G("fps"), 3),
        new("low-profile",    "Low Profile",         "The moment combat starts, you crouch. Stand up only when it's over.", G("fps"), 2),
        new("pacifist",       "Pacifist",            "Finish the match with zero kills. Objectives, assists and support only.", G("fps"), 2),
        new("grenadier",      "Grenadier",           "Throwables are your primary weapon. Guns are for emergencies.", G("fps"), 3),
        new("no-medkit",      "No Med Kit",          "Healing items are banned. Natural regen or nothing.", G("fps"), 2),

        // ---- moba ----
        new("alphabet-build", "Alphabet Build",      "Every item you buy must start with the same letter.", G("moba"), 3),
        new("no-backing",     "No Backing",          "No recalling for the first 10 minutes. Manage your health.", G("moba"), 2),
        new("wrong-max",      "Wrong Max",           "Max your least-used ability first.", G("moba"), 2),
        new("yes-man",        "Yes-Man",             "Whatever a teammate pings first, you do. Every time.", G("moba"), 1),
        new("boots-last",     "Boots Last",          "Boots are your final item. Enjoy the walk.", G("moba"), 2),
        new("identity-crisis","Identity Crisis",     "Build the item set of a different role: tank items on a carry, carry items on a support.", G("moba"), 3),

        // ---- battle royale ----
        new("hot-drop",       "Hot Drop Only",       "Land at the most contested spot on the map. Every game.", G("br"), 1),
        new("leftovers",      "Leftovers",           "You may only loot what your squad leaves behind.", G("br"), 2),
        new("no-wheels",      "No Wheels",           "Vehicles are banned. Your legs are the rotation plan.", G("br"), 1),
        new("edge-walker",    "Edge of the World",   "Drop at the furthest edge of the map and walk in.", G("br"), 2),
        new("first-gun",      "First Gun Forever",   "The first weapon you pick up is your only weapon all match.", G("br"), 3),
        new("utility-finish", "Utility Finish",      "At least one knock per match must come from a throwable.", G("br"), 2),

        // ---- souls-like ----
        new("no-roll",        "No Roll",             "Dodge rolling is banned. Block, parry or face-tank.", G("souls"), 3),
        new("frozen-level",   "Frozen Level",        "No levelling up until the next two bosses are down.", G("souls"), 3),
        new("starter-gear",   "Starter Gear",        "Starting weapon only until the next boss falls.", G("souls"), 2),
        new("solo-honour",    "Solo Honour",         "No summons, no co-op, no spirit helpers.", G("souls"), 2),
        new("respect-boss",   "Respect the Boss",    "Bow or gesture to every boss before the fight. Even on attempt 27.", G("souls"), 1),
        new("clutch-heal",    "Clutch Healing",      "You may only heal below 20% HP.", G("souls"), 2),

        // ---- racing ----
        new("no-brakes",      "Lift, Don't Brake",   "Brakes are banned. Manage speed with throttle and gears only.", G("racing"), 3),
        new("cockpit-only",   "Cockpit View",        "Cockpit camera only, racing line off.", G("racing"), 2),
        new("the-clunker",    "The Clunker",         "Pick the worst car you own. Win anyway.", G("racing"), 1),
        new("pure-manual",    "Pure Manual",         "Manual gearbox, every assist off.", G("racing"), 2),
        new("reverse-grid",   "Reverse Grid",        "Start from last place on purpose. Climb.", G("racing"), 1),

        // ---- strategy ----
        new("real-time",      "Real Time Only",      "Pausing is banned, even where the game allows it.", G("strategy"), 2),
        new("monoculture",    "Monoculture",         "One unit type only, for your whole army.", G("strategy"), 3),
        new("open-gates",     "Open Gates",          "No walls, no static defences. Map control is your wall.", G("strategy"), 2),
        new("commit",         "Commit",              "The first strategy or tech you start is the one you finish. No pivoting.", G("strategy"), 1),

        // ---- survival ----
        new("nomad",          "Nomad",               "No base. Sleep wherever the night catches you.", G("survival"), 2),
        new("herbivore",      "Herbivore",           "No meat, no animal products. Forage and farm.", G("survival"), 1),
        new("cloth-only",     "Cloth Only",          "Crafting armour is banned.", G("survival"), 2),
        new("lights-out",     "Lights Out",          "No torches or light sources at night.", G("survival"), 3),

        // ---- mmo ----
        new("on-foot",        "On Foot",             "Fast travel is banned. The world is the content.", G("mmo"), 1),
        new("the-greeter",    "The Greeter",         "Greet every player you pass. In character.", G("mmo"), 1),
        new("vendor-trash",   "Vendor Trash Hero",   "Wear only the lowest-rarity gear you find.", G("mmo"), 2),
        new("self-found",     "Self-Found",          "No auction house, no trades. Loot it yourself or live without it.", G("mmo"), 2),
    };
}
