interface Outcome {
    [key: string]: number[];
  }
  
  interface Obstacle {
    x: number;
    y: number;
    radius: number;
  }
  
  interface Sink {
    x: number;
    y: number;
    width: number;
    height: number;
    multiplier?: number;
  }
  