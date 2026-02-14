import { IPegFactory, IPeg } from '../core/interfaces';
import { Peg } from '../entities/peg';

/**
 * PegFactory — Factory Pattern for creating pegs and peg grids.
 * Encapsulates the complex layout logic for the peg board.
 */
export class PegFactory implements IPegFactory {
  createPeg(x: number, y: number, radius: number, color: string): IPeg {
    return new Peg(x, y, radius, color);
  }

  /**
   * Creates a triangular/offset peg grid — the classic Plinko layout.
   * Odd rows are offset by half the horizontal spacing.
   */
  createPegGrid(canvasWidth: number, rows: number = 10, cols: number = 9): IPeg[] {
    const pegs: IPeg[] = [];
    const pegRadius = 5;
    const horizontalSpacing = 40;
    const verticalSpacing = 40;
    const startY = 60;

    for (let row = 0; row < rows; row++) {
      const colsInRow = row % 2 === 0 ? cols : cols - 1;
      const offsetX = row % 2 === 0 ? 0 : horizontalSpacing / 2;
      const baseX = canvasWidth / 2 - ((colsInRow - 1) * horizontalSpacing) / 2;

      for (let col = 0; col < colsInRow; col++) {
        const x = baseX + col * horizontalSpacing + offsetX;
        const y = startY + row * verticalSpacing;
        const color = row % 2 === 0 ? '#e0e0e0' : '#c0c0c0';

        pegs.push(this.createPeg(x, y, pegRadius, color));
      }
    }
    return pegs;
  }
}
