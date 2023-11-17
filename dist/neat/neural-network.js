"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        const maxAttempts = hiddenNodes.length * 2 || 3;
        let attempts = 0;
        while (hiddenNodes.length > 0 && attempts < maxAttempts) {
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
            attempts++;
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
        // console.log('outputLayer', outputLayer)
        const output = outputLayer.map((node) => nodeValues[node.id]);
        return output;
    }
}
exports.default = NeuralNetwork;
//# sourceMappingURL=neural-network.js.map