"use strict";
class NeuralNetwork3 {
    constructor(layers, chromosome) {
        this.layers = layers;
        this.weights = [];
        this.biases = [];
        let geneIndex = 0;
        for (let i = 1; i < layers.length; i++) {
            const weightMatrix = Array.from({ length: layers[i] }, () => Array.from({ length: layers[i - 1] }, () => chromosome[geneIndex++]));
            this.weights.push(weightMatrix);
            const biasVector = Array.from({ length: layers[i] }, () => chromosome[geneIndex++]);
            this.biases.push(biasVector);
        }
    }
    activationFunction(x) {
        return 1 / (1 + Math.exp(-x));
    }
    feedForward(input) {
        let currentInput = input;
        for (let i = 0; i < this.layers.length - 1; i++) {
            const nextInput = [];
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
// Exemplo de uso:
// const layers = [8, 16, 32, 3];
// const nn = new NeuralNetwork3(layers);
// const input = [1, 0, 0, 1, 0, 1, 1, 0];
// const output = nn.feedForward(input);
// console.log("Output:", output);
// // Função de fitness para avaliar a qualidade de uma rede neural
// function neuralNetworkFitness(individual: Individual): number {
//   const layers = [8, 16, 32, 3];
//   const nn = new NeuralNetwork(layers, individual);
//   // Avalie a rede neural usando seus próprios critérios, por exemplo, dados de treinamento e validação
//   // Retorne um valor de fitness baseado na performance da rede neural, como acurácia ou erro quadrático médio
//   return fitnessValue;
// }
// // Parâmetros do algoritmo genético
// const populationSize = 100;
// const chromosomeLength = calculateChromosomeLength([8, 16, 32, 3]);
// const mutationRate = 0.05;
// const generations = 100;
// function calculateChromosomeLength(layers: number[]): number {
//   let length = 0;
//   for (let i = 1; i < layers.length; i++) {
//     length += layers[i] * layers[i - 1] + layers[i];
//   }
//   return length;
// }
// // Crie e execute o algoritmo genético
// const ga = new GeneticAlgorithm(
//   populationSize,
//   chromosomeLength,
//   mutationRate,
//   generations,
//   neuralNetworkFitness
// );
// const bestChromosome = ga.run();
// // Crie a melhor rede neural encontrada pelo algoritmo genético
// const bestNeuralNetwork = new NeuralNetwork([8, 16, 32, 3], bestChromosome);
// console.log("Melhor rede neural:", bestNeuralNetwork);
//# sourceMappingURL=neural-genetic.js.map