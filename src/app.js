const path = require("path");
const { Roblox } = require(path.resolve("src/lib/roblox"));
const { System } = require(path.resolve("src/lib/system"));
const { Biomes } = require(path.resolve("src/lib/biome"));

(async () => {
    await Roblox.JoinPrivateServer({ force: true })

    // wait roblox to open
    //// this could be solved by expecting play button

    // detect play button
    // click play button
    //// we have two options here:
    //// blindly click play button expected location
    //// or, we can use ocr to identify the play button then click

    // align for biome identification?

    const detectedBiome = await Biomes.determineBiome();
    // detect biome until its not a NORMAL biome? (detect-biome-change)

    // if INTERESTING_BIOME notify/ping/spam
    //// this is more of a config-based thing, so ill leave it as a TODO for now

    // .. repeat everything infinitely
    await Roblox.JoinPrivateServer({ force: true })

})();