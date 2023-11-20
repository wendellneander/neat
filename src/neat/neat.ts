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

    for (let generation = 1; generation < this.generations; generation++) {
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
    this.logger.log('BestGenome', best)
    this.logger.log('Population', population)
    this.logger.exportFile()
    return best;
  }

  createInitialPopulation(inputNodes: number, outputNodes: number): Genome[] {
    const initialPopulation: Genome[] = [];

    for (let i = 0; i < this.populationSize; i++) {
      const nodeGenes: NodeGene[] = [];

      for (let j = 0; j < inputNodes; j++) {
        nodeGenes.push({ id: j, type: 'input', weight: Math.random() * 2 - 1 });
      }

      for (let j = 0; j < outputNodes; j++) {
        nodeGenes.push({ id: inputNodes + j, type: 'output', weight: Math.random() * 2 - 1 });
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
      if (!bestFitness) {
        bestFitness = genome.fitness
      }

      if (genome.fitness >= bestFitness) {
        bestFitness = genome.fitness;
        bestGenome = genome;
      }
    }

    return bestGenome!;
  }

  crossover(parent1: Genome, parent2: Genome): Genome {
    // Inicializa as listas de genes de conexão e nós do descendente
    const offspringConnectionGenes: ConnectionGene[] = [];
    const offspringNodeGenes: NodeGene[] = [];

    // Alinha os genes de conexão dos pais com base nos números de inovação
    let i = 0;
    let j = 0;

    while (i < parent1.connectionGenes.length || j < parent2.connectionGenes.length) {
      if (i >= parent1.connectionGenes.length) {
        // O pai 1 não tem mais genes, adicione os genes restantes do pai 2 ao descendente
        offspringConnectionGenes.push(parent2.connectionGenes[j]);
        j++;
      } else if (j >= parent2.connectionGenes.length) {
        // O pai 2 não tem mais genes, adicione os genes restantes do pai 1 ao descendente
        offspringConnectionGenes.push(parent1.connectionGenes[i]);
        i++;
      } else if (parent1.connectionGenes[i].innovation === parent2.connectionGenes[j].innovation) {
        // Genes correspondentes: escolha aleatoriamente um dos pais e adicione o gene ao descendente
        offspringConnectionGenes.push(Math.random() < 0.5 ? parent1.connectionGenes[i] : parent2.connectionGenes[j]);
        i++;
        j++;
      } else if (parent1.connectionGenes[i].innovation < parent2.connectionGenes[j].innovation) {
        // O gene do pai 1 é disjunto ou excedente, adicione-o ao descendente
        offspringConnectionGenes.push(parent1.connectionGenes[i]);
        i++;
      } else {
        // O gene do pai 2 é disjunto ou excedente, adicione-o ao descendente
        offspringConnectionGenes.push(parent2.connectionGenes[j]);
        j++;
      }
    }

    // Combina os genes dos nós dos pais para criar os genes dos nós do descendente
    const parentNodeIds1 = new Set(parent1.nodeGenes.map((node) => node.id));
    const parentNodeIds2 = new Set(parent2.nodeGenes.map((node) => node.id));

    for (const nodeId of new Set([...Array.from(parentNodeIds1), ...Array.from(parentNodeIds2)])) {
      const node1 = parent1.nodeGenes.find((node) => node.id === nodeId);
      const node2 = parent2.nodeGenes.find((node) => node.id === nodeId);

      if (node1 && node2) {
        // Nós correspondentes: escolha aleatoriamente um dos pais e adicione o nó ao descendente
        offspringNodeGenes.push(Math.random() < 0.5 ? node1 : node2);
      } else if (node1) {
        // O nó está presente apenas no pai 1, adicione-o ao descendente
        offspringNodeGenes.push(node1);
      } else {
        // O nó está presente apenas no pai 2, adicione-o ao descendente
        offspringNodeGenes.push(node2!);
      }
    }

    // Retorna um novo genoma descendente com os genes de conexão e nós combinados dos pais
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
    for (const s of species) {
      for (const genome of s.members) {
        const fitnessResult = this.fitnessFunction(genome)
        const adjustedFitness = fitnessResult / s.members.length;
        genome.fitness = adjustedFitness;
      }
    }
  }

  reproduce(species: Species[], newPopulationSize: number): Genome[] {
    // calcula a aptidão total ajustada de todas as espécies e determina quantos descendentes cada espécie deve produzir 
    // na próxima geração com base em sua aptidão média ajustada proporcional
    const totalAdjustedFitness = species.reduce((sum, s) => sum + s.members.reduce((sSum, g) => sSum + g.fitness, 0), 0);
    const offspringCountPerSpecies = species.map((s) => {
      // Mesmo que a especie inteira tenha fitness 0 um individuo ainda permanece, TODO: Verificar esse comportamento
      const count = Math.floor((s.members.reduce((sSum, g) => sSum + g.fitness, 0) / totalAdjustedFitness) * newPopulationSize) || 2
      return {
        speciesId: s.id,
        count,
      }
    });

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