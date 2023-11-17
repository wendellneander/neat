import Logger from "src/logger";
import Genome from "./genome";
import InnovationCounter from "./innovation-counter";
import { NodeGene, ConnectionGene, Species } from "./types";

export default class NEAT {
  constructor(
    readonly populationSize: number,
    readonly mutationRate: number,
    readonly generations: number,
    private innovationCounter: InnovationCounter,
    private fitnessFunction: (genome: Genome) => number,
    readonly logger: Logger
  ) { }

  run(inputNodes: number, outputNodes: number): Genome {
    let population = this.createInitialPopulation(inputNodes, outputNodes);

    for (let generation = 0; generation < this.generations; generation++) {
      console.log("Generation: " + generation)
      // Agrupe genomas em espécies com base na distância genética
      const compatibilityThreshold = 2.0; // Ajuste este valor conforme necessário
      const species = this.groupIntoSpecies(population, compatibilityThreshold);
      console.log("groupIntoSpecies: " + generation)

      // Ajuste a aptidão compartilhada dos genomas
      this.adjustFitness(species);
      console.log("adjustFitness: " + generation)

      // Selecione os melhores genomas de cada espécie para reprodução
      const newPopulation = this.reproduce(species, this.populationSize);
      console.log("reproduce: " + generation)
      population = newPopulation;
    }
    const best = this.getBestGenome(population);
    this.logger.log('BestGenome', best)
    this.logger.exportFile()
    return best;
  }

  createInitialPopulation(inputNodes: number, outputNodes: number): Genome[] {
    const initialPopulation: Genome[] = [];

    for (let i = 0; i < this.populationSize; i++) {
      const nodeGenes: NodeGene[] = [];

      for (let j = 0; j < inputNodes; j++) {
        nodeGenes.push({ id: j, type: 'input' });
      }

      for (let j = 0; j < outputNodes; j++) {
        nodeGenes.push({ id: inputNodes + j, type: 'output' });
      }

      const connectionGenes: ConnectionGene[] = [];
      initialPopulation.push(new Genome(connectionGenes, nodeGenes, this.innovationCounter, 0));
    }
    this.logger.log('InitialPopulation', initialPopulation)
    return initialPopulation;
  }

  getBestGenome(population: Genome[]): Genome {
    let bestGenome: Genome | null = null;
    let bestFitness = 0;

    for (const genome of population) {
      const fitness = this.fitnessFunction(genome);
      if (fitness > bestFitness) {
        bestFitness = fitness;
        bestGenome = genome;
      }
    }

    return bestGenome!;
  }

  crossover(parent1: Genome, parent2: Genome): Genome {
    const offspringConnectionGenes: ConnectionGene[] = [];
    const offspringNodeGenes: NodeGene[] = [];

    // Alinhar genes de conexão com base nos números de inovação
    let i = 0;
    let j = 0;

    while (i < parent1.connectionGenes.length || j < parent2.connectionGenes.length) {
      if (i >= parent1.connectionGenes.length) {
        offspringConnectionGenes.push(parent2.connectionGenes[j]);
        j++;
      } else if (j >= parent2.connectionGenes.length) {
        offspringConnectionGenes.push(parent1.connectionGenes[i]);
        i++;
      } else if (parent1.connectionGenes[i].innovation === parent2.connectionGenes[j].innovation) {
        // Genes correspondentes: escolha aleatoriamente um dos pais
        offspringConnectionGenes.push(Math.random() < 0.5 ? parent1.connectionGenes[i] : parent2.connectionGenes[j]);
        i++;
        j++;
      } else if (parent1.connectionGenes[i].innovation < parent2.connectionGenes[j].innovation) {
        offspringConnectionGenes.push(parent1.connectionGenes[i]);
        i++;
      } else {
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
      } else if (node1) {
        offspringNodeGenes.push(node1);
      } else {
        offspringNodeGenes.push(node2!);
      }
    }

    return new Genome(offspringConnectionGenes, offspringNodeGenes, this.innovationCounter);
  }

  calculateGeneticDistance(genome1: Genome, genome2: Genome, c1 = 1, c2 = 1, c3 = 0.4): number {
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
      } else if (j >= genome2.connectionGenes.length) {
        excessGenes++;
        i++;
      } else if (genome1.connectionGenes[i].innovation === genome2.connectionGenes[j].innovation) {
        matchingGenes++;
        weightDifferenceSum += Math.abs(genome1.connectionGenes[i].weight - genome2.connectionGenes[j].weight);
        i++;
        j++;
      } else if (genome1.connectionGenes[i].innovation < genome2.connectionGenes[j].innovation) {
        disjointGenes++;
        i++;
      } else {
        disjointGenes++;
        j++;
      }
    }

    const N = Math.max(genome1.connectionGenes.length, genome2.connectionGenes.length);
    const normalizedWeightDifference = matchingGenes > 0 ? weightDifferenceSum / matchingGenes : 0;

    return (c1 * disjointGenes) / N + (c2 * excessGenes) / N + c3 * normalizedWeightDifference;
  }

  groupIntoSpecies(population: Genome[], compatibilityThreshold: number): Species[] {
    const species: Species[] = [];

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

  adjustFitness(species: Species[]): void {
    console.log('adjustFitness(species):', species.length)
    for (const s of species) {
      for (const genome of s.members) {
        console.log('adjustFitness(species):', genome)
        const adjustedFitness = this.fitnessFunction(genome) / s.members.length;
        genome.fitness = adjustedFitness;
      }
    }
  }

  reproduce(species: Species[], newPopulationSize: number): Genome[] {
    // calcula a aptidão total ajustada de todas as espécies e determina quantos descendentes cada espécie deve produzir 
    // na próxima geração com base em sua aptidão média ajustada proporcional
    const totalAdjustedFitness = species.reduce((sum, s) => sum + s.members.reduce((sSum, g) => sSum + g.fitness, 0), 0);
    const offspringCountPerSpecies = species.map((s) => ({
      speciesId: s.id,
      count: Math.floor((s.members.reduce((sSum, g) => sSum + g.fitness, 0) / totalAdjustedFitness) * newPopulationSize),
    }));

    const newPopulation: Genome[] = [];

    for (const { speciesId, count } of offspringCountPerSpecies) {
      const s = species.find((sp) => sp.id === speciesId)!;

      for (let i = 0; i < count; i++) {
        if (Math.random() < this.mutationRate) {
          // Mutação
          const parent = this.select(s.members);
          const offspring = new Genome([...parent.connectionGenes], [...parent.nodeGenes], this.innovationCounter);
          offspring.mutate();
          newPopulation.push(offspring);
        } else {
          // Crossover
          const parent1 = this.select(s.members);
          const parent2 = this.select(s.members);
          let offspring = this.crossover(parent1, parent2);

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

  select(genomes: Genome[]): Genome {
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