import { IPuckFactory, IPuck } from '../core/interfaces';
import { Puck } from '../entities/puck';

/**
 * PuckFactory — Factory Pattern for creating puck instances.
 */
export class PuckFactory implements IPuckFactory {
  createPuck(x: number, y: number, radius: number = 8): IPuck {
    return new Puck(x, y, radius);
  }
}
