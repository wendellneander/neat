import InnovationCounter from "./neat/innovation-counter";
import Genome from "./neat/genome"
import NeuralNetwork from "./neat/neural-network";

// Exemplo de uso da classe NeuralNetwork para calcular o XOR
const inputNodes = 2;
const hiddenNodes = 2;
const outputNodes = 1;

// Crie uma rede neural simples com 2 nós de entrada, 2 nós ocultos e 1 nó de saída
const layers = [
  Array.from({ length: inputNodes }, (_, i) => ({ id: i, type: 'input' as const })),
  Array.from({ length: hiddenNodes }, (_, i) => ({ id: inputNodes + i, type: 'hidden' as const })),
  Array.from({ length: outputNodes }, (_, i) => ({ id: inputNodes + hiddenNodes + i, type: 'output' as const })),
];

const connectionGenes: ConnectionGene[] = [
  { inNode: 0, outNode: 2, weight: Math.random() * 2 - 1, enabled: true, innovation: 1 },
  { inNode: 0, outNode: 3, weight: Math.random() * 2 - 1, enabled: true, innovation: 2 },
  { inNode: 1, outNode: 2, weight: Math.random() * 2 - 1, enabled: true, innovation: 3 },
  { inNode: 1, outNode: 3, weight: Math.random() * 2 - 1, enabled: true, innovation: 4 },
  { inNode: 2, outNode: 4, weight: Math.random() * 2 - 1, enabled: true, innovation: 5 },
  { inNode: 3, outNode: 4, weight: Math.random() * 2 - 1, enabled: true, innovation: 6 },
];

const xorGenome = new Genome(connectionGenes, layers.flat(), new InnovationCounter(1));
const xorNeuralNetwork = new NeuralNetwork(xorGenome);

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