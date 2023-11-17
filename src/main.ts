import NEAT from "./neat";
import Genome from "./neat/genome";
import InnovationCounter from "./neat/innovation-counter";
import NeuralNetwork from "./neat/neural-network";
import Logger from './logger'

// Função de fitness personalizada para avaliar a qualidade de um genoma no problema XOR
function fitnessFunction(genome: Genome): number {
  const nn = new NeuralNetwork(genome);

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
    // console.log('networkOutput', { input: example.input, networkOutput, error });
    fitness += 1 - error;
  }

  return fitness;
}

// Parâmetros do algoritmo NEAT
const populationSize = 100;
const inputNodes = 2;
const outputNodes = 1;
const mutationRate = 0.3;
const generations = 100;
const innovationCounter = new InnovationCounter(1);
const logger = new Logger();

// Crie e execute o algoritmo NEAT
console.time('Execution time');
const neat = new NEAT(populationSize, mutationRate, generations, innovationCounter, fitnessFunction, logger);
const bestGenome = neat.run(inputNodes, outputNodes);
neat.logger.exportFile()
console.log("Melhor genoma:", JSON.stringify(bestGenome));

// Crie a melhor rede neural encontrada pelo algoritmo NEAT
const bestNeuralNetwork = new NeuralNetwork(bestGenome);
console.log("Melhor rede neural:", JSON.stringify(bestNeuralNetwork));

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