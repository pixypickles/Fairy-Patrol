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

const windButton = document.querySelector('#windButton');
let windChargeStarted = 0;
let windChargeFrame = 0;

function updateWindChargeMeter() {
  if (!windChargeStarted) return;
  const ratio = Math.min(1, (performance.now() - windChargeStarted) / 900);
  windButton.style.setProperty('--charge', ratio.toFixed(3));
  windChargeFrame = requestAnimationFrame(updateWindChargeMeter);
}

function releaseWind(e) {
  if (!windChargeStarted) return;
  e?.preventDefault();
  const seconds = Math.min(0.9, (performance.now() - windChargeStarted) / 1000);
  windChargeStarted = 0;
  cancelAnimationFrame(windChargeFrame);
  windButton.classList.remove('charging');
  windButton.style.setProperty('--charge', '0');
  game.cast('wind', seconds);
}

windButton.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (windChargeStarted) return;
  windChargeStarted = performance.now();
  windButton.classList.add('charging');
  windButton.setPointerCapture?.(e.pointerId);
  updateWindChargeMeter();
});
windButton.addEventListener('pointerup', releaseWind);
windButton.addEventListener('pointercancel', releaseWind);
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
  if (e.key === 'j' && !e.repeat) game.cast('wind', 0.35);
  if (e.key === 'k') game.cast('water');
  if (e.key === 'q') game.guideChick(-1);
  if (e.key === 'e') game.guideChick(1);
});
