const CONFIG = {
  VIEWPORT: { WIDTH: 1200, HEIGHT: 600 },
  WORLD: { WIDTH: 2400, HEIGHT: 600 },

  CAMERA_SCROLL_SPEED: 12,
  CAMERA_EDGE_MARGIN: 50,

  BASE_HP: 5000,
  BASE_X_OFFSET: 100,
  BASE_WIDTH: 80,
  BASE_HEIGHT: 120,

  STARTING_GOLD: 200,
  STARTING_XP: 0,
  GOLD_PER_SECOND: 2,
  XP_PER_SECOND: 0.5,

  EVOLVE_XP: [0, 500, 1500, 3500, 7000],
  EVOLVE_HEAL: 0.25,

  SPECIAL_COOLDOWN: 30,

  AI_THINK_INTERVAL: 2500,

  AGES: [
    {
      name: 'Stone Age',
      color: '#8B7355',
      groundColor: '#5a4a3a',
      skyGradient: ['#2c1810', '#5a3a2a'],
      specialName: 'Meteor Shower',
      specialDamage: 300,
      turretCost: 150,
      units: [
        { name: 'Clubman', type: 'melee', cost: 50, hp: 120, damage: 25, speed: 0.8, range: 30, attackSpeed: 1.0, xpReward: 15, goldReward: 10 },
        { name: 'Slingshot', type: 'ranged', cost: 75, hp: 80, damage: 15, speed: 0.6, range: 180, attackSpeed: 1.5, projectileSpeed: 4, xpReward: 20, goldReward: 15 },
        { name: 'Raptor Rider', type: 'fast', cost: 100, hp: 90, damage: 20, speed: 1.8, range: 25, attackSpeed: 0.8, xpReward: 20, goldReward: 15 },
      ],
      turret: { name: 'Egg Turret', cost: 150, hp: 300, damage: 10, range: 200, attackSpeed: 2.0, projectileSpeed: 5 },
    },
    {
      name: 'Castle Age',
      color: '#4444aa',
      groundColor: '#3a4a3a',
      skyGradient: ['#1a1a3e', '#2a2a5e'],
      specialName: 'Arrow Volley',
      specialDamage: 450,
      turretCost: 250,
      units: [
        { name: 'Swordsman', type: 'melee', cost: 80, hp: 180, damage: 35, speed: 0.9, range: 28, attackSpeed: 1.0, xpReward: 25, goldReward: 18 },
        { name: 'Archer', type: 'ranged', cost: 100, hp: 100, damage: 22, speed: 0.65, range: 200, attackSpeed: 1.3, projectileSpeed: 5, xpReward: 30, goldReward: 22 },
        { name: 'Cavalry', type: 'fast', cost: 150, hp: 150, damage: 30, speed: 2.0, range: 28, attackSpeed: 0.9, xpReward: 30, goldReward: 22 },
      ],
      turret: { name: 'Arrow Tower', cost: 250, hp: 400, damage: 15, range: 220, attackSpeed: 1.5, projectileSpeed: 6 },
    },
    {
      name: 'Renaissance',
      color: '#8B6914',
      groundColor: '#4a4a30',
      skyGradient: ['#2a2010', '#5a4a20'],
      specialName: 'Artillery Strike',
      specialDamage: 600,
      turretCost: 350,
      units: [
        { name: 'Pikeman', type: 'melee', cost: 100, hp: 220, damage: 40, speed: 0.85, range: 35, attackSpeed: 1.1, xpReward: 35, goldReward: 25 },
        { name: 'Musketeer', type: 'ranged', cost: 140, hp: 120, damage: 35, speed: 0.6, range: 220, attackSpeed: 1.8, projectileSpeed: 6, xpReward: 40, goldReward: 30 },
        { name: 'Cannon', type: 'siege', cost: 200, hp: 200, damage: 60, speed: 0.4, range: 250, attackSpeed: 3.0, projectileSpeed: 4, splashRadius: 40, xpReward: 45, goldReward: 35 },
      ],
      turret: { name: 'Cannon Emplacement', cost: 350, hp: 500, damage: 25, range: 240, attackSpeed: 2.5, projectileSpeed: 5, splashRadius: 30 },
    },
    {
      name: 'Modern Age',
      color: '#556B2F',
      groundColor: '#3a3a2a',
      skyGradient: ['#1a2a1a', '#2a3a2a'],
      specialName: 'Airstrike',
      specialDamage: 800,
      turretCost: 500,
      units: [
        { name: 'Rifleman', type: 'melee', cost: 150, hp: 280, damage: 50, speed: 0.9, range: 30, attackSpeed: 0.8, xpReward: 50, goldReward: 40 },
        { name: 'Tank', type: 'armored', cost: 300, hp: 600, damage: 70, speed: 0.5, range: 180, attackSpeed: 2.5, projectileSpeed: 7, xpReward: 80, goldReward: 60 },
        { name: 'Helicopter', type: 'air', cost: 250, hp: 200, damage: 45, speed: 1.5, range: 200, attackSpeed: 1.2, projectileSpeed: 6, xpReward: 65, goldReward: 50 },
      ],
      turret: { name: 'Machine Gun Nest', cost: 500, hp: 600, damage: 35, range: 260, attackSpeed: 0.5, projectileSpeed: 8 },
    },
    {
      name: 'Future Age',
      color: '#00e5ff',
      groundColor: '#1a2a3a',
      skyGradient: ['#0a0a2a', '#1a1a4a'],
      specialName: 'Orbital Laser',
      specialDamage: 1200,
      turretCost: 750,
      units: [
        { name: 'Laser Mech', type: 'melee', cost: 250, hp: 400, damage: 80, speed: 1.0, range: 32, attackSpeed: 0.7, xpReward: 80, goldReward: 60 },
        { name: 'Super Soldier', type: 'ranged', cost: 300, hp: 250, damage: 65, speed: 0.8, range: 240, attackSpeed: 1.0, projectileSpeed: 8, xpReward: 90, goldReward: 70 },
        { name: 'Drone', type: 'ranged', cost: 350, hp: 180, damage: 55, speed: 2.2, range: 200, attackSpeed: 0.8, projectileSpeed: 9, xpReward: 100, goldReward: 80 },
      ],
      turret: { name: 'Energy Turret', cost: 750, hp: 800, damage: 50, range: 280, attackSpeed: 0.6, projectileSpeed: 9 },
    },
  ],
};
