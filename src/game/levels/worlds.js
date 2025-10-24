import { WORLD_KEYS } from '../constants.js';

/**
 * High level world metadata used by menus and encyclopedia.
 */
export const WORLD_CATALOG = {
  emerald_forest: {
    name: 'Emerald Forest',
    theme: 'Lush beginner forest with layered parallax and gentle learning curve.',
    levels: [
      {
        key: 'w1-1',
        name: 'First Steps',
        objectives: ['Reach the exit', 'Collect coins', 'Discover the hidden alcove'],
        teaches: ['Movement basics', 'Jump timing', 'Collectible flow'],
      },
      {
        key: 'w1-2',
        name: 'Rising Challenge',
        objectives: ['Master moving platforms', 'Defeat walkers', 'Find the hidden room'],
        teaches: ['Jump hold height', 'Horizontal movers', 'Enemy introductions'],
      },
      {
        key: 'w1-3',
        name: 'Dash Forward',
        objectives: ['Break dash walls', 'Keep dash cooldown low', 'Discover shortcut'],
        teaches: ['Dash ability', 'Momentum conservation', 'Secret hunting'],
      },
      {
        key: 'w1-4',
        name: 'Wall Runners',
        objectives: ['Wall jump to the summit', 'Avoid the first pit', 'Unlock triangle jump achievement'],
        teaches: ['Wall slide', 'Wall jump', 'Triangle jump timing'],
      },
      {
        key: 'w1-5',
        name: "Guardian's Path",
        objectives: ['Stomp enemies', 'Avoid spike traps', 'Complete no damage challenge'],
        teaches: ['Stomp attack', 'Enemy variety', 'Hazard awareness'],
      },
      {
        key: 'w1-6',
        name: 'Canopy Sprint',
        objectives: ['Maintain sprint chain', 'Navigate falling platforms', 'Unlock speed route'],
        teaches: ['Sprint stamina', 'Falling tiles', 'Momentum puzzles'],
      },
      {
        key: 'w1-7',
        name: 'Depths Below',
        objectives: ['Explore underwater cave', 'Use ledge grab escapes', 'Survive burrower ambush'],
        teaches: ['Water physics', 'One-way platforms', 'Ledge grabs'],
      },
      {
        key: 'w1-8',
        name: 'Storm Approach',
        objectives: ['Weather the windstorm', 'Find all three secrets', 'Complete speed route'],
        teaches: ['Wind hazards', 'Route selection', 'Comprehensive skill check'],
      },
      { key: 'w1-9', name: 'Forest Guardian', type: 'mini-boss' },
      { key: 'w1-10', name: 'The Iron Colossus', type: 'boss' },
    ],
  },
  crystal_caverns: {
    name: 'Crystal Caverns',
    theme: 'Shimmering caves with ice physics and dynamic lighting.',
    levels: [
      { key: 'w2-1', name: 'Frozen Entry', teaches: ['Ice friction', 'Sliding momentum'] },
      { key: 'w2-2', name: 'Slippery Slopes', teaches: ['Speed control', 'Slope boost'] },
      { key: 'w2-3', name: 'Dark Descent', teaches: ['Light radius', 'Crystal activators'] },
      { key: 'w2-4', name: 'Crystal Climb', teaches: ['Fragile platforms', 'Vertical gauntlets'] },
      { key: 'w2-5', name: 'Frozen Fortress', teaches: ['Combat on ice', 'Mini golems'] },
      { key: 'w2-6', name: 'Underground River', teaches: ['Currents', 'Platform timing'] },
      { key: 'w2-7', name: 'Light and Shadow', teaches: ['Adaptive AI', 'Light puzzles'] },
      { key: 'w2-8', name: 'Cavern Escape', teaches: ['Auto-scroller', 'High pressure movement'] },
      { key: 'w2-9', name: 'Ice Wraith', type: 'mini-boss' },
      { key: 'w2-10', name: 'Crystalline Colossus', type: 'boss' },
    ],
  },
  scorched_wasteland: {
    name: 'Scorched Wasteland',
    theme: 'Desert ruins with heat, sand, and ancient machinery.',
    levels: [
      { key: 'w3-1', name: 'Desert Entrance', teaches: ['Sand drag', 'Heat vents'] },
      { key: 'w3-2', name: 'Sandstorm Sprint', teaches: ['Wind push', 'Debris dodging'] },
      { key: 'w3-3', name: 'Ancient Temple', teaches: ['Collapse hazards', 'Switch puzzles'] },
      { key: 'w3-4', name: 'Flame Corridors', teaches: ['Fire timing', 'Dash windows'] },
      { key: 'w3-5', name: 'Quicksand Crossing', teaches: ['Momentum hops', 'Patience'] },
      { key: 'w3-6', name: 'Scorpion Nest', teaches: ['Swarm control', 'Area attacks'] },
      { key: 'w3-7', name: 'The Oasis', teaches: ['Exploration', 'Rest hubs'] },
      { key: 'w3-8', name: 'Temple Summit', teaches: ['Vertical dash', 'Wind interplay'] },
      { key: 'w3-9', name: 'Scorpion Queen', type: 'mini-boss' },
      { key: 'w3-10', name: 'Sun God Construct', type: 'boss' },
    ],
  },
  storm_peaks: {
    name: 'Storm Peaks',
    theme: 'Thunderous mountains with severe weather and precision challenges.',
    levels: [
      { key: 'w4-1', name: 'Ascent Begins', teaches: ['Wind gusts', 'Thin air jumps'] },
      { key: 'w4-2', name: 'Lightning Field', teaches: ['Strike indicators', 'Cover mechanics'] },
      { key: 'w4-3', name: 'Cliffside Trial', teaches: ['Precision wall jump', 'Narrow ledges'] },
      { key: 'w4-4', name: 'Thunderbird Territory', teaches: ['Aerial combat', 'Lightning enemies'] },
      { key: 'w4-5', name: 'The Bridge', teaches: ['Time pressure', 'Falling structures'] },
      { key: 'w4-6', name: 'Monastery Ruins', teaches: ['Puzzle combat', 'Parry duels'] },
      { key: 'w4-7', name: 'Summit Gale', teaches: ['Extreme winds', 'Air dash finesse'] },
      { key: 'w4-8', name: 'Tempest Core', teaches: ['Combo hazards', 'Sustained endurance'] },
      { key: 'w4-9', name: 'Storm Titan', type: 'mini-boss' },
      { key: 'w4-10', name: 'Sky Fortress Commander', type: 'boss' },
    ],
  },
  abyssal_depths: {
    name: 'Abyssal Depths',
    theme: 'Dark ocean trenches with bioluminescent flora and oppressive atmosphere.',
    levels: [
      { key: 'w5-1', name: 'Twilight Descent', teaches: ['Pressure currents', 'Buoyancy control'] },
      { key: 'w5-2', name: 'Luminous Gardens', teaches: ['Light chains', 'Stealth predators'] },
      { key: 'w5-3', name: 'Gloom Rift', teaches: ['Shadow platforms', 'Vision cones'] },
      { key: 'w5-4', name: 'Siren Ruins', teaches: ['Sound cues', 'Parry timing'] },
      { key: 'w5-5', name: 'Trench Run', teaches: ['Speed boosts', 'Tight corridors'] },
      { key: 'w5-6', name: 'Leviathan Graveyard', teaches: ['Massive hazards', 'Verticality'] },
      { key: 'w5-7', name: 'Obsidian Vault', teaches: ['Elite gauntlets', 'Resource management'] },
      { key: 'w5-8', name: 'Throne of Echoes', teaches: ['Multi-phase endurance', 'Ability mastery'] },
      { key: 'w5-9', name: 'Abyssal Warden', type: 'mini-boss' },
      { key: 'w5-10', name: 'The Hollow King', type: 'boss' },
    ],
  },
};

export const WORLD_LIST = WORLD_KEYS.map((key) => ({ key, ...WORLD_CATALOG[key] }));
