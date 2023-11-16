"use strict";
class Genome {
    constructor(connectionGenes, nodeGenes) {
        this.connectionGenes = connectionGenes;
        this.nodeGenes = nodeGenes;
    }
    mutate() {
        const mutationType = Math.random();
        if (mutationType < 0.8) {
            this.mutateWeights();
        }
        else if (mutationType < 0.9) {
            this.addConnection();
        }
        else {
            this.addNode();
        }
    }
    mutateWeights() {
        for (const connection of this.connectionGenes) {
            if (Math.random() < 0.9) {
                // Perturbe o peso
                connection.weight += (Math.random() * 2 - 1) * 0.5;
            }
            else {
                // Atribua um novo peso aleatório
                connection.weight = Math.random() * 2 - 1;
            }
        }
    }
    addConnection() {
        const availableNodes = this.nodeGenes.filter((node) => node.type !== 'output');
        const inputNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
        const outputNodes = this.nodeGenes.filter((node) => node.type !== 'input' && node.id !== inputNode.id);
        const outputNode = outputNodes[Math.floor(Math.random() * outputNodes.length)];
        const existingConnection = this.connectionGenes.find((connection) => connection.inNode === inputNode.id && connection.outNode === outputNode.id);
        if (!existingConnection) {
            const newConnection = {
                inNode: inputNode.id,
                outNode: outputNode.id,
                weight: Math.random() * 2 - 1,
                enabled: true,
                innovation: 0, // Atualize este valor com o número de inovação correto
            };
            this.connectionGenes.push(newConnection);
        }
    }
    addNode() {
        if (this.connectionGenes.length === 0)
            return;
        const connectionToSplit = this.connectionGenes[Math.floor(Math.random() * this.connectionGenes.length)];
        connectionToSplit.enabled = false;
        const newNodeId = Math.max(...this.nodeGenes.map((node) => node.id)) + 1;
        const newNode = {
            id: newNodeId,
            type: 'hidden',
        };
        this.nodeGenes.push(newNode);
        const newConnection1 = {
            inNode: connectionToSplit.inNode,
            outNode: newNode.id,
            weight: 1,
            enabled: true,
            innovation: 0, // Atualize este valor com o número de inovação correto
        };
        const newConnection2 = {
            inNode: newNode.id,
            outNode: connectionToSplit.outNode,
            weight: connectionToSplit.weight,
            enabled: true,
            innovation: 0, // Atualize este valor com o número de inovação correto
        };
        this.connectionGenes.push(newConnection1);
        this.connectionGenes.push(newConnection2);
    }
}
class NeuralNetwork {
    constructor(genome) {
        this.connectionGenes = genome.connectionGenes;
        this.layers = this.buildLayers(genome.nodeGenes);
    }
    buildLayers(nodeGenes) {
        const inputLayer = nodeGenes.filter((node) => node.type === 'input');
        const outputLayer = nodeGenes.filter((node) => node.type === 'output');
        const hiddenNodes = nodeGenes.filter((node) => node.type === 'hidden');
        const layers = [inputLayer];
        while (hiddenNodes.length > 0) {
            const currentLayer = [];
            for (let i = 0; i < hiddenNodes.length; i++) {
                const node = hiddenNodes[i];
                const incomingConnections = this.connectionGenes.filter((connection) => connection.outNode === node.id && connection.enabled);
                if (incomingConnections.every((connection) => layers.flat().some((layerNode) => layerNode.id === connection.inNode))) {
                    currentLayer.push(node);
                    hiddenNodes.splice(i, 1);
                    i--;
                }
            }
            layers.push(currentLayer);
        }
        layers.push(outputLayer);
        return layers;
    }
    activationFunction(x) {
        return 1 / (1 + Math.exp(-x));
    }
    feedForward(input) {
        const nodeValues = {};
        for (let i = 0; i < input.length; i++) {
            nodeValues[this.layers[0][i].id] = input[i];
        }
        for (const layer of this.layers.slice(1)) {
            for (const node of layer) {
                let weightedSum = 0;
                for (const connection of this.connectionGenes) {
                    if (connection.outNode === node.id && connection.enabled) {
                        weightedSum += nodeValues[connection.inNode] * connection.weight;
                    }
                }
                nodeValues[node.id] = this.activationFunction(weightedSum);
            }
        }
        const outputLayer = this.layers[this.layers.length - 1];
        const output = outputLayer.map((node) => nodeValues[node.id]);
        return output;
    }
}
class NEAT {
    constructor(populationSize, mutationRate, generations) {
        this.populationSize = populationSize;
        this.mutationRate = mutationRate;
        this.generations = generations;
    }
    run(inputNodes, outputNodes) {
        let population = this.createInitialPopulation(inputNodes, outputNodes);
        for (let generation = 0; generation < this.generations; generation++) {
            // Avalie a população usando sua própria função de fitness
            const fitnessValues = population.map((genome) => {
                // Calcule o valor de fitness para cada genoma com base em seu problema específico
                const fitness = this.calculateFitness(genome);
                return { genome, fitness };
            });
            // Selecione os melhores genomas com base nos valores de fitness
            const selectedGenomes = this.selectBestGenomes(fitnessValues);
            // Crie a próxima geração aplicando mutações aos genomas selecionados
            const nextGeneration = [];
            for (let i = 0; i < this.populationSize; i++) {
                const parent = selectedGenomes[Math.floor(Math.random() * selectedGenomes.length)];
                const offspring = new Genome([...parent.connectionGenes], [...parent.nodeGenes]);
                offspring.mutate();
                nextGeneration.push(offspring);
            }
            population = nextGeneration;
        }
        // Retorne o melhor genoma encontrado
        return this.getBestGenome(population);
    }
    createInitialPopulation(inputNodes, outputNodes) {
        const initialPopulation = [];
        for (let i = 0; i < this.populationSize; i++) {
            const nodeGenes = [];
            for (let j = 0; j < inputNodes; j++) {
                nodeGenes.push({ id: j, type: 'input' });
            }
            for (let j = 0; j < outputNodes; j++) {
                nodeGenes.push({ id: inputNodes + j, type: 'output' });
            }
            const connectionGenes = [];
            initialPopulation.push(new Genome(connectionGenes, nodeGenes));
        }
        return initialPopulation;
    }
    selectBestGenomes(fitnessValues) {
        // Implemente a lógica de seleção aqui, como seleção por torneio ou seleção proporcional à aptidão (fitness)
        // Por exemplo, selecione os N melhores genomas:
        const n = Math.floor(this.populationSize / 2);
        fitnessValues.sort((a, b) => b.fitness - a.fitness);
        return fitnessValues.slice(0, n).map((entry) => entry.genome);
    }
    getBestGenome(population) {
        let bestGenome = null;
        let bestFitness = -Infinity;
        for (const genome of population) {
            const fitness = this.calculateFitness(genome);
            if (fitness > bestFitness) {
                bestFitness = fitness;
                bestGenome = genome;
            }
        }
        return bestGenome;
    }
    calculateFitness(genome) {
        // Implemente a lógica para calcular o valor de fitness para um genoma com base em seu problema específico
        return 0; // Substitua 0 pelo valor de fitness real
    }
}
// Função de fitness personalizada para avaliar a qualidade de um genoma no problema XOR
function calculateFitness(genome) {
    const layers = [2, 1]; // Exemplo: 2 nós de entrada e 1 nó de saída
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
        const error = Math.abs(networkOutput - example.output);
        fitness += 1 - error;
    }
    return fitness;
}
// Parâmetros do algoritmo NEAT
const populationSize = 100;
const inputNodes = 2;
const outputNodes = 1;
const mutationRate = 0.05;
const generations = 100;
// Crie e execute o algoritmo NEAT
const neat = new NEAT(populationSize, mutationRate, generations);
neat.calculateFitness = calculateFitness; // Substitua a função de fitness padrão pela função personalizada
const bestGenome = neat.run(inputNodes, outputNodes);
// Crie a melhor rede neural encontrada pelo algoritmo NEAT
const bestNeuralNetwork = new NeuralNetwork(bestGenome);
console.log("Melhor rede neural:", bestNeuralNetwork);
// Teste a melhor rede neural nos exemplos XOR
const xorExamples = [
    { input: [0, 0], output: 0 },
    { input: [0, 1], output: 1 },
    { input: [1, 0], output: 1 },
    { input: [1, 1], output: 0 },
];
for (const example of xorExamples) {
    const networkOutput = bestNeuralNetwork.feedForward(example.input)[0];
    console.log(`Input: ${example.input}, Output: ${networkOutput}, Expected: ${example.output}`);
}
//# sourceMappingURL=neat-algorithm.js.map