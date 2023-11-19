"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NeuralNetwork {
    constructor(genome) {
        this.connectionGenes = genome.connectionGenes;
        this.layers = this.buildLayers(genome.nodeGenes);
        this.nodeValues = {};
    }
    buildLayers(nodeGenes) {
        const inputLayer = nodeGenes.filter(node => node.type === 'input');
        const outputLayer = nodeGenes.filter(node => node.type === 'output');
        const hiddenNodes = nodeGenes.filter(node => node.type === 'hidden');
        const layers = [inputLayer];
        while (hiddenNodes.length > 0) {
            const currentLayer = [];
            for (let i = 0; i < hiddenNodes.length; i++) {
                const node = hiddenNodes[i];
                const incomingConnections = this.connectionGenes.filter(connection => connection.outNode === node.id && connection.enabled);
                const hasConnections = incomingConnections.every(connection => layers.flat().some(layerNode => layerNode.id === connection.inNode));
                if (hasConnections) {
                    currentLayer.push(node);
                }
                hiddenNodes.splice(i, 1);
                i--;
            }
            if (currentLayer.length > 0) {
                layers.push(currentLayer);
            }
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
                        const localWeight = nodeValues[connection.inNode] * connection.weight;
                        weightedSum += (nodeValues[connection.inNode] || 0) * connection.weight;
                        if (isNaN(weightedSum)) {
                            console.log('WeightedSum:', { connection, localWeight, weightedSum, nodeValues });
                        }
                    }
                }
                nodeValues[node.id] = this.activationFunction(weightedSum);
            }
        }
        this.nodeValues = nodeValues;
        const outputLayer = this.layers[this.layers.length - 1];
        const output = outputLayer.map(node => nodeValues[node.id]);
        return output;
    }
    activationFunctionDerivative(x) {
        const sigmoid = this.activationFunction(x);
        return sigmoid * (1 - sigmoid);
    }
    train(input, targetOutput, learningRate) {
        // Feedforward
        const output = this.feedForward(input);
        // Inicializa os gradientes dos erros para cada nó
        const errorGradients = {};
        // Backpropagation
        for (let layerIndex = this.layers.length - 1; layerIndex >= 0; layerIndex--) {
            const layer = this.layers[layerIndex];
            for (const node of layer) {
                if (node.type === 'output') {
                    // Camada de saída: calcule o erro e o gradiente do erro
                    const error = targetOutput[node.id - this.layers[this.layers.length - 2].length] - output[node.id];
                    errorGradients[node.id] = error * this.activationFunctionDerivative(node.id);
                }
                else if (node.type === 'hidden') {
                    // Camadas ocultas: calcule o erro e o gradiente do erro
                    let downstreamErrorSum = 0;
                    for (const connection of this.connectionGenes.filter((c) => c.inNode === node.id && c.enabled)) {
                        downstreamErrorSum += errorGradients[connection.outNode] * connection.weight;
                    }
                    errorGradients[node.id] = downstreamErrorSum * this.activationFunctionDerivative(node.id);
                }
                // Atualize os pesos das conexões de entrada
                for (const connection of this.connectionGenes.filter((c) => c.outNode === node.id && c.enabled)) {
                    connection.weight += learningRate * errorGradients[node.id] * this.activationFunction(connection.inNode);
                }
            }
        }
    }
}
exports.default = NeuralNetwork;
//# sourceMappingURL=neural-network.js.map