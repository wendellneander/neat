export default class InnovationCounter {
  constructor(private count: number) {
    this.count = 0;
  }

  next(): number {
    this.count++;
    return this.count;
  }
}