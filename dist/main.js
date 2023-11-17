"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const neat_1 = __importDefault(require("./neat/neat"));
const innovation_counter_1 = __importDefault(require("./neat/innovation-counter"));
const neural_network_1 = __importDefault(require("./neat/neural-network"));
const logger_1 = __importDefault(require("./logger"));
// Função de fitness personalizada para avaliar a qualidade de um genoma no problema XOR
function fitnessFunction(genome) {
    const nn = new neural_network_1.default(genome);
    const xorExamples = [
        { input: [0, 0], output: 0 },
        { input: [0, 1], output: 1 },
        { input: [1, 0], output: 1 },
        { input: [1, 1], output: 0 },
    ];
    let fitness = 0;
    for (const example of xorExamples) {
        const networkOutput = nn.feedForward(example.input)[0];
        const error = networkOutput - example.output;
        fitness += 1 - error;
    }
    return fitness;
}
// Parâmetros do algoritmo NEAT
const populationSize = 100;
const inputNodes = 2;
const outputNodes = 1;
const mutationRate = 0.03;
const generations = 100;
const innovationCounter = new innovation_counter_1.default(1);
const logger = new logger_1.default();
// Crie e execute o algoritmo NEAT
console.time('Execution time');
const neat = new neat_1.default(populationSize, mutationRate, generations, innovationCounter, fitnessFunction, logger);
const bestGenome = neat.run(inputNodes, outputNodes);
console.log('bestGenome', bestGenome);
neat.logger.exportFile();
// Crie a melhor rede neural encontrada pelo algoritmo NEAT
const bestNeuralNetwork = new neural_network_1.default(bestGenome);
// Teste a melhor rede neural nos exemplos XOR
const xorExamples = [
    { input: [0, 0], output: 0 },
    { input: [0, 1], output: 1 },
    { input: [1, 0], output: 1 },
    { input: [1, 1], output: 0 },
];
for (const example of xorExamples) {
    const networkOutput = bestNeuralNetwork.feedForward(example.input)[0];
    console.log(`Input: ${example.input}, Output: ${JSON.stringify(networkOutput)}, Expected: ${example.output}`);
}
console.timeEnd('Execution time');
process.exit();
//# sourceMappingURL=main.js.map