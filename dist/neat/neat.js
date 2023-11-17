"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const genome_1 = __importDefault(require("./genome"));
class NEAT {
    constructor(populationSize, mutationRate, generations, innovationCounter, fitnessFunction, logger) {
        this.populationSize = populationSize;
        this.mutationRate = mutationRate;
        this.generations = generations;
        this.innovationCounter = innovationCounter;
        this.fitnessFunction = fitnessFunction;
        this.logger = logger;
    }
    run(inputNodes, outputNodes) {
        let population = this.createInitialPopulation(inputNodes, outputNodes);
        for (let generation = 1; generation < this.generations; generation++) {
            console.log("Generation: " + generation);
            // Agrupe genomas em espécies com base na distância genética
            const compatibilityThreshold = 2.0; // Ajuste este valor conforme necessário
            const species = this.groupIntoSpecies(population, compatibilityThreshold);
            // Ajuste a aptidão compartilhada dos genomas
            this.adjustFitness(species);
            // Selecione os melhores genomas de cada espécie para reprodução
            const newPopulation = this.reproduce(species, this.populationSize);
            population = newPopulation;
        }
        const best = this.getBestGenome(population);
        this.logger.log('BestGenome', best);
        this.logger.log('Population', population);
        this.logger.exportFile();
        return best;
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
            initialPopulation.push(new genome_1.default(connectionGenes, nodeGenes, this.innovationCounter, 0));
        }
        this.logger.log('InitialPopulation', initialPopulation);
        return initialPopulation;
    }
    getBestGenome(population) {
        let bestGenome = null;
        let bestFitness = 0;
        for (const genome of population) {
            if (!bestFitness) {
                bestFitness = genome.fitness;
            }
            if (genome.fitness >= bestFitness) {
                bestFitness = genome.fitness;
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
        return new genome_1.default(offspringConnectionGenes, offspringNodeGenes, this.innovationCounter);
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
    groupIntoSpecies(population, compatibilityThreshold) {
        const species = [];
        for (const genome of population) {
            let foundSpecies = false;
            for (const s of species) {
                const representative = s.members[0];
                const distance = this.calculateGeneticDistance(genome, representative);
                if (distance < compatibilityThreshold) {
                    s.members.push(genome);
                    foundSpecies = true;
                    break;
                }
            }
            if (!foundSpecies) {
                species.push({ id: species.length + 1, members: [genome] });
            }
        }
        return species;
    }
    adjustFitness(species) {
        for (const s of species) {
            for (const genome of s.members) {
                const fitnessResult = this.fitnessFunction(genome);
                const adjustedFitness = fitnessResult / s.members.length;
                genome.fitness = adjustedFitness;
            }
        }
    }
    reproduce(species, newPopulationSize) {
        // calcula a aptidão total ajustada de todas as espécies e determina quantos descendentes cada espécie deve produzir 
        // na próxima geração com base em sua aptidão média ajustada proporcional
        const totalAdjustedFitness = species.reduce((sum, s) => sum + s.members.reduce((sSum, g) => sSum + g.fitness, 0), 0);
        const offspringCountPerSpecies = species.map((s) => {
            // Mesmo que a especie inteira tenha fitness 0 um individuo ainda permanece, TODO: Verificar esse comportamento
            const count = Math.floor((s.members.reduce((sSum, g) => sSum + g.fitness, 0) / totalAdjustedFitness) * newPopulationSize) || 1;
            return {
                speciesId: s.id,
                count,
            };
        });
        const newPopulation = [];
        for (const { speciesId, count } of offspringCountPerSpecies) {
            const s = species.find((sp) => sp.id === speciesId);
            for (let i = 0; i < count; i++) {
                if (Math.random() < this.mutationRate) {
                    // Mutação
                    const parent = this.select(s.members);
                    const offspring = new genome_1.default([...parent.connectionGenes], [...parent.nodeGenes], this.innovationCounter);
                    offspring.mutate();
                    newPopulation.push(offspring);
                }
                else {
                    // Crossover
                    const parent1 = this.select(s.members);
                    const parent2 = this.select(s.members);
                    const offspring = this.crossover(parent1, parent2);
                    // Aplicar mutação com probabilidade igual à taxa de mutação
                    if (Math.random() < this.mutationRate) {
                        offspring.mutate();
                    }
                    newPopulation.push(offspring);
                }
            }
        }
        return newPopulation;
    }
    select(genomes) {
        const totalAdjustedFitness = genomes.reduce((sum, genome) => sum + genome.fitness, 0);
        const selectionPoint = Math.random() * totalAdjustedFitness;
        let currentSum = 0;
        for (const genome of genomes) {
            currentSum += genome.fitness;
            if (currentSum >= selectionPoint) {
                return genome;
            }
        }
        return genomes[genomes.length - 1];
    }
}
exports.default = NEAT;
//# sourceMappingURL=neat.js.map