'use client';

import { forwardRef } from 'react';

/**
 * Thin wrapper around the <canvas> element.
 * The actual game engine is bootstrapped via the useGame hook
 * which receives a ref to this canvas.
 */
const GameCanvas = forwardRef<HTMLCanvasElement>(function GameCanvas(_props, ref) {
  return (
    <canvas
      ref={ref}
      id="gameCanvas"
      width={800}
      height={600}
      style={{ display: 'block', border: 'none', background: 'transparent' }}
    />
  );
});

export default GameCanvas;
