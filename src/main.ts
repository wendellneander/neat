import NEAT from "./neat/neat";
import Genome from "./neat/genome";
import InnovationCounter from "./neat/innovation-counter";
import NeuralNetwork from "./neat/neural-network";
import Logger from './logger'

// Parâmetros do algoritmo NEAT
const populationSize = 100;
const inputNodes = 2;
const outputNodes = 1;
const mutationRate = 0.4;
const generations = 100;
const innovationCounter = new InnovationCounter();
const logger = new Logger();

// Função de fitness personalizada para avaliar a qualidade de um genoma no problema XOR
function fitnessFunction(genome: Genome): number {
  let squaredErrorSum = 0;

  if (!genome.hasIndirectActiveConnectionsBetweenInputAndOutput()) {
    squaredErrorSum = -10;
  } else {
    squaredErrorSum += 20
  }

  const nn = new NeuralNetwork(genome);

  const xorExamples = [
    { input: [0, 0], output: 0 },
    { input: [0, 1], output: 1 },
    { input: [1, 0], output: 1 },
    { input: [1, 1], output: 0 },
  ];

  for (const example of xorExamples) {
    const networkOutput = nn.feedForward(example.input)[0];
    const error = networkOutput - example.output;
    squaredErrorSum += error * error;
  }

  const meanSquaredError = squaredErrorSum / xorExamples.length;

  // Retorna o inverso do erro quadrático médio como aptidão
  const fit = 1 / meanSquaredError;
  genome.fitness = fit
  return fit;
}

// Crie e execute o algoritmo NEAT
console.time('Execution time');
const neat = new NEAT(populationSize, mutationRate, generations, innovationCounter, fitnessFunction, logger);
const bestGenome = neat.run(inputNodes, outputNodes);
neat.logger.exportFile();

// Crie a melhor rede neural encontrada pelo algoritmo NEAT
const bestNeuralNetwork = new NeuralNetwork(bestGenome);

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

console.log('Fitness:', bestNeuralNetwork.genome.fitness);
console.log('Layers:', bestNeuralNetwork.layers);
console.log('NodeValues:', bestNeuralNetwork.nodeValues);
console.timeEnd('Execution time');
process.exit();