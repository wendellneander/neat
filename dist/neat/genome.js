"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Genome {
    constructor(connectionGenes, nodeGenes, innovationCounter, fitness = 0) {
        this.connectionGenes = connectionGenes;
        this.nodeGenes = nodeGenes;
        this.innovationCounter = innovationCounter;
        this.fitness = fitness;
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
    hasActiveConnectionsBetweenInputAndOutput() {
        const inputNodeIds = this.nodeGenes.filter(node => node.type === 'input').map(node => node.id);
        const outputNodeIds = this.nodeGenes.filter(node => node.type === 'input').map(node => node.id);
        for (const connection of this.connectionGenes) {
            if (connection.enabled &&
                inputNodeIds.some(input => input === connection.inNode) &&
                outputNodeIds.some(output => output === connection.outNode)) {
                return true;
            }
        }
        return false;
    }
}
exports.default = Genome;
//# sourceMappingURL=genome.js.map