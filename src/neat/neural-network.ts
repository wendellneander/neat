import Genome from "./genome";
import { ConnectionGene, NodeGene } from "./types";

export default class NeuralNetwork {
  layers: NodeGene[][];
  connectionGenes: ConnectionGene[];

  constructor(genome: Genome) {
    this.connectionGenes = genome.connectionGenes;
    this.layers = this.buildLayers(genome.nodeGenes);
  }

  buildLayers(nodeGenes: NodeGene[]): NodeGene[][] {
    const inputLayer = nodeGenes.filter((node) => node.type === 'input');
    const outputLayer = nodeGenes.filter((node) => node.type === 'output');
    const hiddenNodes = nodeGenes.filter((node) => node.type === 'hidden');

    const layers: NodeGene[][] = [inputLayer];

    while (hiddenNodes.length > 0) {
      const currentLayer: NodeGene[] = [];

      for (let i = 0; i < hiddenNodes.length; i++) {
        const node = hiddenNodes[i];
        const incomingConnections = this.connectionGenes.filter(
          (connection) => connection.outNode === node.id && connection.enabled
        );

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

  activationFunction(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  feedForward(input: number[]): number[] {
    const nodeValues: { [id: number]: number } = {};

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