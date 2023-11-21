"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const neat_1 = __importDefault(require("./neat/neat"));
const innovation_counter_1 = __importDefault(require("./neat/innovation-counter"));
const neural_network_1 = __importDefault(require("./neat/neural-network"));
const logger_1 = __importDefault(require("./logger"));
// Parâmetros do algoritmo NEAT
const populationSize = 100;
const inputNodes = 3;
const outputNodes = 2;
const mutationRate = 0.4;
const generations = 100;
const innovationCounter = new innovation_counter_1.default();
const logger = new logger_1.default();
const xorExamples = [
    { input: [0, 0, 0], output: [0, 0] },
    { input: [0, 1, 0], output: [1, 1] },
    { input: [1, 0, 1], output: [1, 1] },
    { input: [1, 1, 1], output: [0, 0] },
];
// Função de fitness personalizada para avaliar a qualidade de um genoma no problema XOR
function fitnessFunction(genome) {
    const nn = new neural_network_1.default(genome);
    let fitness = 0;
    if (genome.hasActiveConnections().length > 0) {
        fitness += 5;
    }
    else {
        fitness -= 10;
    }
    if (!genome.hasConnectionsInSameLayer()) {
        fitness += 5;
    }
    else {
        fitness -= 10;
    }
    if (genome.hasConnectionsOnlyToNextLayer()) {
        fitness += 2;
    }
    else {
        fitness -= 10;
    }
    if (genome.hasOutputConnectionsFromHiddenLayer()) {
        fitness += 2;
    }
    else {
        fitness -= 10;
    }
    if (genome.hasAllOutputNodesConnected()) {
        fitness += 1;
    }
    else {
        fitness -= 10;
    }
    for (const example of xorExamples) {
        const networkOutput = nn.feedForward(example.input)[0];
        const error = networkOutput - example.output[0];
        fitness += error;
    }
    return fitness;
}
// Crie e execute o algoritmo NEAT
console.time('Execution time');
const neat = new neat_1.default(populationSize, mutationRate, generations, innovationCounter, fitnessFunction, logger);
const bestGenome = neat.run(inputNodes, outputNodes);
neat.logger.exportFile();
// Crie a melhor rede neural encontrada pelo algoritmo NEAT
const bestNeuralNetwork = new neural_network_1.default(bestGenome);
for (const example of xorExamples) {
    const networkOutput = bestNeuralNetwork.feedForward(example.input)[0];
    console.log(`Input: ${example.input}, Output: ${JSON.stringify(networkOutput)}, Expected: ${example.output}`);
}
console.log({
    'Fitness': bestNeuralNetwork.genome.fitness,
    'NodeValues': bestNeuralNetwork.nodeValues
});
console.timeEnd('Execution time');
process.exit();
//# sourceMappingURL=main.js.map