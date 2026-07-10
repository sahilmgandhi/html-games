const CONFIG = {
  VIEWPORT: { WIDTH: 1200, HEIGHT: 600 },
  WORLD: { WIDTH: 2400, HEIGHT: 600 },
  GROUND_Y: 500,

  COLORS: {
    PLAYER: '#4a8af4',
    ENEMY: '#f44a4a',
    PLAYER_LIGHT: '#8af',
    ENEMY_LIGHT: '#f88',
  },

  INCOME_GOLD_PER_SEC: 2,
  INCOME_XP_PER_SEC: 0.5,

  CAMERA_SCROLL_SPEED: 12,
  CAMERA_EDGE_MARGIN: 50,

  BASE_HP: 5000,
  BASE_X_OFFSET: 100,
  BASE_WIDTH: 80,
  BASE_HEIGHT: 120,

  STARTING_GOLD: 200,
  STARTING_XP: 0,

  EVOLVE_XP: [0, 4000, 14000, 80000, 200000],
  EVOLVE_HEAL: 0.25,

  SPECIAL_COOLDOWN: 40,

  TURRET_SLOTS: 4,
  TURRET_SLOT_COST: 250,

  AI_THINK_INTERVAL: 2500,

  AGES: [
    {
      name: 'Stone Age',
      color: '#8B7355',
      groundColor: '#5a4a3a',
      skyGradient: ['#2c1810', '#5a3a2a'],
      specialName: 'Meteor Shower',
      specialDamage: 250,
      units: [
        { name: 'Clubman', type: 'melee', cost: 15, hp: 55, damage: 16, speed: 0.8, range: 28, attackSpeed: 1.0, goldReward: 20, xpReward: 10 },
        { name: 'Slingshot', type: 'ranged', cost: 25, hp: 42, damage: 12, speed: 0.6, range: 150, attackSpeed: 1.2, projectileSpeed: 4, goldReward: 33, xpReward: 15 },
        { name: 'Dino Rider', type: 'fast', cost: 100, hp: 160, damage: 40, speed: 1.8, range: 30, attackSpeed: 0.8, goldReward: 130, xpReward: 40 },
      ],
      turrets: [
        { name: 'Rock Slingshot', cost: 100, damage: 12, range: 200, attackSpeed: 0.75, projectileSpeed: 5 },
        { name: 'Egg Automatic', cost: 200, damage: 5, range: 180, attackSpeed: 0.28, projectileSpeed: 6 },
        { name: 'Primit. Catapult', cost: 500, damage: 25, range: 250, attackSpeed: 1.75, projectileSpeed: 4, splashRadius: 30 },
      ],
    },
    {
      name: 'Castle Age',
      color: '#4444aa',
      groundColor: '#3a4a3a',
      skyGradient: ['#1a1a3e', '#2a2a5e'],
      specialName: 'Arrow Volley',
      specialDamage: 400,
      units: [
        { name: 'Swordsman', type: 'melee', cost: 50, hp: 100, damage: 32, speed: 0.9, range: 25, attackSpeed: 1.0, goldReward: 65, xpReward: 20 },
        { name: 'Archer', type: 'ranged', cost: 75, hp: 80, damage: 20, speed: 0.65, range: 170, attackSpeed: 1.3, projectileSpeed: 5, goldReward: 98, xpReward: 25 },
        { name: 'Knight', type: 'fast', cost: 500, hp: 300, damage: 60, speed: 1.4, range: 30, attackSpeed: 1.1, goldReward: 650, xpReward: 80 },
      ],
      turrets: [
        { name: 'Catapult', cost: 500, damage: 40, range: 250, attackSpeed: 1.75, projectileSpeed: 5 },
        { name: 'Fire Catapult', cost: 750, damage: 50, range: 250, attackSpeed: 1.75, projectileSpeed: 5, splashRadius: 25 },
        { name: 'Oil', cost: 1000, damage: 4, range: 180, attackSpeed: 0.5, projectileSpeed: 3, splashRadius: 50 },
      ],
    },
    {
      name: 'Renaissance',
      color: '#8B6914',
      groundColor: '#4a4a30',
      skyGradient: ['#2a2010', '#5a4a20'],
      specialName: 'Artillery Strike',
      specialDamage: 550,
      units: [
        { name: 'Dueler', type: 'melee', cost: 200, hp: 200, damage: 79, speed: 0.85, range: 28, attackSpeed: 1.0, goldReward: 260, xpReward: 40 },
        { name: 'Musketeer', type: 'ranged', cost: 400, hp: 160, damage: 40, speed: 0.6, range: 180, attackSpeed: 1.5, projectileSpeed: 6, goldReward: 520, xpReward: 60 },
        { name: 'Cannoneer', type: 'siege', cost: 1000, hp: 600, damage: 120, speed: 0.4, range: 200, attackSpeed: 2.5, projectileSpeed: 4, splashRadius: 40, goldReward: 1300, xpReward: 100 },
      ],
      turrets: [
        { name: 'Small Cannon', cost: 1500, damage: 30, range: 300, attackSpeed: 1.75, projectileSpeed: 6 },
        { name: 'Large Cannon', cost: 3000, damage: 70, range: 300, attackSpeed: 1.75, projectileSpeed: 6, splashRadius: 20 },
        { name: 'Explos. Cannon', cost: 6000, damage: 100, range: 300, attackSpeed: 1.75, projectileSpeed: 6, splashRadius: 35 },
      ],
    },
    {
      name: 'Modern Age',
      color: '#556B2F',
      groundColor: '#3a3a2a',
      skyGradient: ['#1a2a1a', '#2a3a2a'],
      specialName: 'Airstrike',
      specialDamage: 700,
      units: [
        { name: 'Melee Infantry', type: 'melee', cost: 1500, hp: 350, damage: 100, speed: 0.8, range: 28, attackSpeed: 0.9, goldReward: 1950, xpReward: 150 },
        { name: 'Infantry', type: 'ranged', cost: 2000, hp: 300, damage: 60, speed: 0.7, range: 170, attackSpeed: 1.2, projectileSpeed: 7, goldReward: 2600, xpReward: 200 },
        { name: 'Tank', type: 'armored', cost: 7000, hp: 1200, damage: 300, speed: 0.4, range: 180, attackSpeed: 2.0, projectileSpeed: 8, goldReward: 9100, xpReward: 500 },
      ],
      turrets: [
        { name: 'Single Turret', cost: 7000, damage: 70, range: 300, attackSpeed: 1.0, projectileSpeed: 8 },
        { name: 'Rocket Turret', cost: 9000, damage: 100, range: 300, attackSpeed: 1.25, projectileSpeed: 8 },
        { name: 'Double Turret', cost: 14000, damage: 70, range: 300, attackSpeed: 0.55, projectileSpeed: 8 },
      ],
    },
    {
      name: 'Future Age',
      color: '#00e5ff',
      groundColor: '#1a2a3a',
      skyGradient: ['#0a0a2a', '#1a1a4a'],
      specialName: 'Orbital Laser',
      specialDamage: 1000,
      units: [
        { name: "God's Blade", type: 'melee', cost: 5000, hp: 1000, damage: 250, speed: 0.9, range: 35, attackSpeed: 0.8, goldReward: 6500, xpReward: 400 },
        { name: 'Blaster', type: 'ranged', cost: 6000, hp: 800, damage: 130, speed: 0.75, range: 200, attackSpeed: 1.0, projectileSpeed: 9, goldReward: 7800, xpReward: 500 },
        { name: 'War Machine', type: 'armored', cost: 20000, hp: 3000, damage: 600, speed: 0.35, range: 200, attackSpeed: 2.5, projectileSpeed: 8, goldReward: 26000, xpReward: 1000 },
        { name: 'Super Soldier', type: 'elite', cost: 150000, hp: 4000, damage: 400, speed: 0.8, range: 150, attackSpeed: 1.0, projectileSpeed: 10, goldReward: 200000, xpReward: 0 },
      ],
      turrets: [
        { name: 'Titanium Shooter', cost: 24000, damage: 100, range: 250, attackSpeed: 1.0, projectileSpeed: 9 },
        { name: 'Lazer Cannon', cost: 40000, damage: 40, range: 300, attackSpeed: 0.25, projectileSpeed: 10 },
        { name: 'Ion Ray', cost: 100000, damage: 60, range: 400, attackSpeed: 0.25, projectileSpeed: 10 },
      ],
    },
  ],
};
