"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const innovation_counter_1 = __importDefault(require("./neat/innovation-counter"));
const genome_1 = __importDefault(require("./neat/genome"));
const neural_network_1 = __importDefault(require("./neat/neural-network"));
// Exemplo de uso da classe NeuralNetwork para calcular o XOR
const inputNodes = 2;
const hiddenNodes = 2;
const outputNodes = 1;
// Crie uma rede neural simples com 2 nós de entrada, 2 nós ocultos e 1 nó de saída
const layers = [
    Array.from({ length: inputNodes }, (_, i) => ({ id: i, type: 'input', weight: Math.random() * 2 - 1 })),
    Array.from({ length: hiddenNodes }, (_, i) => ({ id: inputNodes + i, type: 'hidden', weight: Math.random() * 2 - 1 })),
    Array.from({ length: outputNodes }, (_, i) => ({ id: inputNodes + hiddenNodes + i, type: 'output', weight: Math.random() * 2 - 1 })),
];
const connectionGenes = [
    { inNode: 0, outNode: 2, weight: Math.random() * 2 - 1, enabled: true, innovation: 1 },
    { inNode: 0, outNode: 3, weight: Math.random() * 2 - 1, enabled: true, innovation: 2 },
    { inNode: 1, outNode: 2, weight: Math.random() * 2 - 1, enabled: true, innovation: 3 },
    { inNode: 1, outNode: 3, weight: Math.random() * 2 - 1, enabled: true, innovation: 4 },
    { inNode: 2, outNode: 4, weight: Math.random() * 2 - 1, enabled: true, innovation: 5 },
    { inNode: 3, outNode: 4, weight: Math.random() * 2 - 1, enabled: true, innovation: 6 },
];
const xorGenome = new genome_1.default(connectionGenes, layers.flat(), new innovation_counter_1.default(1));
const xorNeuralNetwork = new neural_network_1.default(xorGenome);
// Treine a rede neural usando backpropagation
const xorExamples = [
    { input: [0, 0], output: [0] },
    { input: [0, 1], output: [1] },
    { input: [1, 0], output: [1] },
    { input: [1, 1], output: [0] },
];
const learningRate = 0.5;
const epochs = 10000;
for (let epoch = 0; epoch < epochs; epoch++) {
    for (const example of xorExamples) {
        xorNeuralNetwork.train(example.input, example.output, learningRate);
    }
}
// Teste a rede neural treinada nos exemplos XOR
for (const example of xorExamples) {
    const networkOutput = xorNeuralNetwork.feedForward(example.input);
    console.log(`Input: ${example.input}, Output: ${networkOutput}, Expected: ${example.output}`);
}
//# sourceMappingURL=train-neural-network.js.map