import { InputController } from './input.js';
import { Game } from './game.js';

const canvas = document.querySelector('#gameCanvas');
const titleScreen = document.querySelector('#titleScreen');
const startButton = document.querySelector('#startButton');
const controls = document.querySelector('#controls');
const hudElement = document.querySelector('#hud');

const input = new InputController(
  document.querySelector('#stick'),
  document.querySelector('#stickKnob')
);

const game = new Game(canvas, input, {
  distance: document.querySelector('#distanceText'),
  plus: document.querySelector('#plusScore'),
  minus: document.querySelector('#minusScore')
});

startButton.addEventListener('click', () => {
  titleScreen.classList.add('hidden');
  controls.classList.remove('hidden');
  hudElement.classList.remove('hidden');
  game.start();
});

document.querySelector('#windButton').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  game.cast('wind');
});
document.querySelector('#waterButton').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  game.cast('water');
});
document.querySelector('#chickLeftButton').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  game.guideChick(-1);
});
document.querySelector('#chickRightButton').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  game.guideChick(1);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'j') game.cast('wind');
  if (e.key === 'k') game.cast('water');
  if (e.key === 'q') game.guideChick(-1);
  if (e.key === 'e') game.guideChick(1);
});
