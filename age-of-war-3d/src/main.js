import { Game3D } from './core/Game3D.js';

const canvas = document.getElementById('gameCanvas');
const game = new Game3D(canvas);

game.start();

export default game;
