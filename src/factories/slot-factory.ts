import { ISlotFactory, ISlot } from '../core/interfaces';
import { Slot } from '../entities/slot';

/**
 * SlotFactory — Factory Pattern for creating slots.
 * Handles layout calculation and even distribution across the bottom.
 */
export class SlotFactory implements ISlotFactory {
  createSlot(x: number, y: number, width: number, height: number, value: number): ISlot {
    return new Slot(x, y, width, height, value);
  }

  /**
   * Creates a row of evenly-spaced slots across the bottom of the canvas.
   * Slots span the full width of the peg grid area.
   */
  createSlotRow(
    canvasWidth: number,
    canvasHeight: number,
    values: number[] = [10, 5, 2, 1, 0, 1, 2, 5, 10],
  ): ISlot[] {
    const slots: ISlot[] = [];
    const slotHeight = 45;
    const totalPegWidth = 8 * 40; // (cols-1) * spacing
    const margin = (canvasWidth - totalPegWidth) / 2;
    const slotWidth = totalPegWidth / values.length;
    const y = canvasHeight - slotHeight;

    for (let i = 0; i < values.length; i++) {
      const x = margin + i * slotWidth;
      slots.push(this.createSlot(x, y, slotWidth, slotHeight, values[i]));
    }
    return slots;
  }
}
