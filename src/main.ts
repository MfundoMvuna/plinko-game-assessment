import { Game } from './game';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const playButton = document.getElementById('playButton') as HTMLButtonElement;
  const scoreElement = document.getElementById('scoreDisplay') as HTMLElement;

  const ctx = canvas.getContext('2d')!;

  if (!ctx) {
    throw new Error("Unable to get CanvasRenderingContext2D");
  }
  
  canvas.width = 800;
  canvas.height = 600;

  const game = new Game(canvas, ctx, scoreElement);

  function requestFullscreen() {
    const docElm = document.documentElement;
    if(docElm.requestFullscreen) {
      docElm.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen omode: ${err.message} (${err.name})`);
      });
    } 
  }

  playButton.addEventListener('click',() => {
    requestFullscreen();
    game.createPuck();
  });
  
  game.start();
  
});
