// Every tunable number in the game lives here. Game logic reads CONFIG; it never
// hardcodes a value of its own.
const CONFIG = {
  VIEWPORT: { WIDTH: 960, HEIGHT: 540 },

  COLORS: {
    BACKGROUND: '#151a24',
    PLAYER: '#4a8af4',
    TARGET: '#f4c14a',
    TEXT: '#e8ecf4',
    DIM: '#7b849b',
  },

  PLAYER_RADIUS: 18,
  PLAYER_SPEED: 260,

  TARGET_RADIUS: 14,
  TARGETS_TO_WIN: 10,
  TIME_LIMIT: 30,
};
