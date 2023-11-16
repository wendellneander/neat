class NeuralNetwork2 {
  layers: number[];
  weights: number[][][];
  biases: number[][];

  constructor(layers: number[]) {
    this.layers = layers;
    this.weights = [];
    this.biases = [];

    for (let i = 1; i < layers.length; i++) {
      const weightMatrix = Array.from({ length: layers[i] }, () =>
        Array.from({ length: layers[i - 1] }, () => Math.random() * 2 - 1)
      );
      this.weights.push(weightMatrix);

      const biasVector = Array.from({ length: layers[i] }, () => Math.random() * 2 - 1);
      this.biases.push(biasVector);
    }
  }

  activationFunction(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  feedForward(input: number[]): number[] {
    let currentInput = input;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const nextInput: number[] = [];

      for (let j = 0; j < this.layers[i + 1]; j++) {
        let weightedSum = 0;

        for (let k = 0; k < this.layers[i]; k++) {
          weightedSum += currentInput[k] * this.weights[i][j][k];
        }

        weightedSum += this.biases[i][j];
        nextInput.push(this.activationFunction(weightedSum));
      }

      currentInput = nextInput;
    }

    return currentInput;
  }
}

// // Exemplo de uso:
// const layers = [8, 16, 32, 3];
// const nn = new NeuralNetwork2(layers);
// const input = [1, 0, 0, 1, 0, 1, 1, 0];
// const output = nn.feedForward(input);
// console.log("Output:", output);