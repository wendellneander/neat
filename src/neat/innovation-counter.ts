export default class InnovationCounter {
  constructor(private count: number = 0) { }

  next(): number {
    this.count++;
    return this.count;
  }
}