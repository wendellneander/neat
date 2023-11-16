"use strict";
class GeneticAlgorithm {
    constructor(populationSize, chromosomeLength, mutationRate, generations, fitnessFunction) {
        this.populationSize = populationSize;
        this.chromosomeLength = chromosomeLength;
        this.mutationRate = mutationRate;
        this.generations = generations;
        this.fitnessFunction = fitnessFunction;
    }
    createIndividual() {
        return Array.from({ length: this.chromosomeLength }, () => Math.random());
    }
    createPopulation() {
        return Array.from({ length: this.populationSize }, () => this.createIndividual());
    }
    mutate(individual) {
        return individual.map((gene) => (Math.random() < this.mutationRate ? Math.random() : gene));
    }
    crossover(parent1, parent2) {
        const crossoverPoint = Math.floor(Math.random() * this.chromosomeLength);
        return [
            ...parent1.slice(0, crossoverPoint),
            ...parent2.slice(crossoverPoint, this.chromosomeLength),
        ];
    }
    select(population) {
        const totalFitness = population.reduce((sum, individual) => sum + this.fitnessFunction(individual), 0);
        const selectionPoint = Math.random() * totalFitness;
        let currentSum = 0;
        for (const individual of population) {
            currentSum += this.fitnessFunction(individual);
            if (currentSum >= selectionPoint) {
                return individual;
            }
        }
        return population[population.length - 1];
    }
    run() {
        let population = this.createPopulation();
        for (let generation = 0; generation < this.generations; generation++) {
            const newPopulation = [];
            for (let i = 0; i < this.populationSize; i++) {
                const parent1 = this.select(population);
                const parent2 = this.select(population);
                let offspring = this.crossover(parent1, parent2);
                offspring = this.mutate(offspring);
                newPopulation.push(offspring);
            }
            population = newPopulation;
        }
        return population.reduce((best, individual) => this.fitnessFunction(individual) > this.fitnessFunction(best) ? individual : best);
    }
}
// // Exemplo de uso:
// const populationSize = 100;
// const chromosomeLength = 10;
// const mutationRate = 0.05;
// const generations = 100;
// const fitnessFunction = (individual: Individual) => individual.reduce((sum, gene) => sum + gene, 0);
// const ga = new GeneticAlgorithm(populationSize, chromosomeLength, mutationRate, generations, fitnessFunction);
// const bestIndividual = ga.run();
// console.log("Melhor indivíduo:", bestIndividual);
//# sourceMappingURL=genetic-algorithm.js.map