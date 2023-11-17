"use strict";
class InnovationCounter {
    constructor(count) {
        this.count = count;
        this.count = 0;
    }
    next() {
        this.count++;
        return this.count;
    }
}
class Genome {
    constructor(connectionGenes, nodeGenes, innovationCounter) {
        this.connectionGenes = connectionGenes;
        this.nodeGenes = nodeGenes;
        this.innovationCounter = innovationCounter;
    }
    mutate() {
        const mutationType = Math.random();
        if (mutationType < 0.8) {
            this.mutateWeights();
        }
        else if (mutationType < 0.9) {
            this.addConnection(this.innovationCounter);
        }
        else {
            this.addNode(this.innovationCounter);
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
    addConnection(innovationCounter) {
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
                innovation: innovationCounter.next(),
            };
            this.connectionGenes.push(newConnection);
        }
    }
    addNode(innovationCounter) {
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
            innovation: innovationCounter.next(),
        };
        const newConnection2 = {
            inNode: newNode.id,
            outNode: connectionToSplit.outNode,
            weight: connectionToSplit.weight,
            enabled: true,
            innovation: innovationCounter.next(), // Atualize este valor com o número de inovação correto
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
    constructor(populationSize, mutationRate, generations, innovationCounter, fitnessFunction) {
        this.populationSize = populationSize;
        this.mutationRate = mutationRate;
        this.generations = generations;
        this.innovationCounter = innovationCounter;
        this.fitnessFunction = fitnessFunction;
    }
    run(inputNodes, outputNodes) {
        let population = this.createInitialPopulation(inputNodes, outputNodes);
        for (let generation = 0; generation < this.generations; generation++) {
            const fitnessValues = population.map((genome) => ({ genome, fitness: this.fitnessFunction(genome) }));
            const selectedGenomes = this.selectBestGenomes(fitnessValues);
            const nextGeneration = [];
            for (let i = 0; i < this.populationSize; i++) {
                if (Math.random() < this.mutationRate) {
                    // Mutação
                    const parent = selectedGenomes[Math.floor(Math.random() * selectedGenomes.length)];
                    const offspring = new Genome([...parent.connectionGenes], [...parent.nodeGenes], this.innovationCounter);
                    offspring.mutate();
                    nextGeneration.push(offspring);
                }
                else {
                    // Crossover
                    const parent1 = selectedGenomes[Math.floor(Math.random() * selectedGenomes.length)];
                    const parent2 = selectedGenomes[Math.floor(Math.random() * selectedGenomes.length)];
                    const offspring = this.crossover(parent1, parent2);
                    nextGeneration.push(offspring);
                }
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
            initialPopulation.push(new Genome(connectionGenes, nodeGenes, this.innovationCounter));
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
            const fitness = this.fitnessFunction(genome);
            if (fitness > bestFitness) {
                bestFitness = fitness;
                bestGenome = genome;
            }
        }
        return bestGenome;
    }
    crossover(parent1, parent2) {
        const offspringConnectionGenes = [];
        const offspringNodeGenes = [];
        // Alinhar genes de conexão com base nos números de inovação
        let i = 0;
        let j = 0;
        while (i < parent1.connectionGenes.length || j < parent2.connectionGenes.length) {
            if (i >= parent1.connectionGenes.length) {
                offspringConnectionGenes.push(parent2.connectionGenes[j]);
                j++;
            }
            else if (j >= parent2.connectionGenes.length) {
                offspringConnectionGenes.push(parent1.connectionGenes[i]);
                i++;
            }
            else if (parent1.connectionGenes[i].innovation === parent2.connectionGenes[j].innovation) {
                // Genes correspondentes: escolha aleatoriamente um dos pais
                offspringConnectionGenes.push(Math.random() < 0.5 ? parent1.connectionGenes[i] : parent2.connectionGenes[j]);
                i++;
                j++;
            }
            else if (parent1.connectionGenes[i].innovation < parent2.connectionGenes[j].innovation) {
                offspringConnectionGenes.push(parent1.connectionGenes[i]);
                i++;
            }
            else {
                offspringConnectionGenes.push(parent2.connectionGenes[j]);
                j++;
            }
        }
        // Combinar genes de nós
        const parentNodeIds1 = new Set(parent1.nodeGenes.map((node) => node.id));
        const parentNodeIds2 = new Set(parent2.nodeGenes.map((node) => node.id));
        for (const nodeId of new Set([...Array.from(parentNodeIds1), ...Array.from(parentNodeIds2)])) {
            const node1 = parent1.nodeGenes.find((node) => node.id === nodeId);
            const node2 = parent2.nodeGenes.find((node) => node.id === nodeId);
            if (node1 && node2) {
                offspringNodeGenes.push(Math.random() < 0.5 ? node1 : node2);
            }
            else if (node1) {
                offspringNodeGenes.push(node1);
            }
            else {
                offspringNodeGenes.push(node2);
            }
        }
        return new Genome(offspringConnectionGenes, offspringNodeGenes, this.innovationCounter);
    }
    calculateGeneticDistance(genome1, genome2, c1 = 1, c2 = 1, c3 = 0.4) {
        let disjointGenes = 0;
        let excessGenes = 0;
        let matchingGenes = 0;
        let weightDifferenceSum = 0;
        let i = 0;
        let j = 0;
        while (i < genome1.connectionGenes.length || j < genome2.connectionGenes.length) {
            if (i >= genome1.connectionGenes.length) {
                excessGenes++;
                j++;
            }
            else if (j >= genome2.connectionGenes.length) {
                excessGenes++;
                i++;
            }
            else if (genome1.connectionGenes[i].innovation === genome2.connectionGenes[j].innovation) {
                matchingGenes++;
                weightDifferenceSum += Math.abs(genome1.connectionGenes[i].weight - genome2.connectionGenes[j].weight);
                i++;
                j++;
            }
            else if (genome1.connectionGenes[i].innovation < genome2.connectionGenes[j].innovation) {
                disjointGenes++;
                i++;
            }
            else {
                disjointGenes++;
                j++;
            }
        }
        const N = Math.max(genome1.connectionGenes.length, genome2.connectionGenes.length);
        const normalizedWeightDifference = matchingGenes > 0 ? weightDifferenceSum / matchingGenes : 0;
        return (c1 * disjointGenes) / N + (c2 * excessGenes) / N + c3 * normalizedWeightDifference;
    }
}
// Função de fitness personalizada para avaliar a qualidade de um genoma no problema XOR
function fitnessFunction(genome) {
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
const innovationCounter = new InnovationCounter(1);
// Crie e execute o algoritmo NEAT
const neat = new NEAT(populationSize, mutationRate, generations, innovationCounter, fitnessFunction);
console.log("Procurando melhor rede neural...");
console.time('neat-time');
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
console.timeEnd('neat-time');
//# sourceMappingURL=neat-algorithm.js.map