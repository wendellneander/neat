import Genome from "./genome";
import { ConnectionGene, NodeGene } from "./types";

export default class NeuralNetwork {
  layers: NodeGene[][];
  connectionGenes: ConnectionGene[];
  nodeValues: { [id: number]: number }

  constructor(readonly genome: Genome) {
    this.connectionGenes = genome.connectionGenes;
    this.layers = this.buildLayers(genome.nodeGenes);
    this.nodeValues = {}
    this.initializeWeightsRandomly()
  }

  buildLayers(nodeGenes: NodeGene[]): NodeGene[][] {
    const inputLayer = nodeGenes.filter(node => node.type === 'input');
    const outputLayer = nodeGenes.filter(node => node.type === 'output');
    const hiddenNodes = nodeGenes.filter(node => node.type === 'hidden');
    const layers: NodeGene[][] = [inputLayer];
    let currentLayerIndex = 0;

    while (hiddenNodes.length > 0) {
      const currentLayer: NodeGene[] = [];

      for (let i = 0; i < hiddenNodes.length; i++) {
        const node = hiddenNodes[i];
        const incomingConnections = this.connectionGenes.filter(
          connection => connection.outNode === node.id && connection.enabled
        );

        const allConnectionsComeFromLayers = incomingConnections.every(connection => layers[currentLayerIndex].some((layerNode) => layerNode.id === connection.inNode))
        if (allConnectionsComeFromLayers) {
          currentLayer.push(node);
          hiddenNodes.splice(i, 1);
          i--;
        }
      }

      if (currentLayer.length > 0) {
        layers.push(currentLayer);
        currentLayerIndex++;
      } else {
        break;
      }
    }

    layers.push(outputLayer);
    return layers;
  }

  initializeWeightsRandomly(minWeight = -1.0, maxWeight = 1.0): void {
    for (const connection of this.connectionGenes) {
      connection.weight = Math.random() * (maxWeight - minWeight) + minWeight;
    }
  }

  activationFunction(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  feedForward(input: number[]): number[] {
    // Inicializa um objeto para armazenar os valores dos nós
    const nodeValues: { [id: number]: number } = {};

    if (input.length !== this.layers[0].length) {
      throw new Error('Input data dont match with input layer.');
    }
    // Atribui os valores de entrada aos nós de entrada
    for (let i = 0; i < input.length; i++) {
      nodeValues[this.layers[0][i].id] = input[i];
    }

    // Itera pelas camadas e nós da rede neural, começando pela primeira camada oculta
    for (const layer of this.layers.slice(1)) {
      for (const node of layer) {
        let weightedSum = 0;

        // Calcula a soma ponderada das entradas do nó atual usando apenas conexões ativas
        for (const connection of this.connectionGenes) {
          if (connection.outNode === node.id && connection.enabled) {
            weightedSum += (nodeValues[connection.inNode] ?? node.weight) * connection.weight;
            if (isNaN(weightedSum)) {
              console.log('\n\nInvalidNodeId:', connection.inNode)
              console.log('Nodes:', this.genome.nodeGenes.map(node => node.id));
              console.log('WeightedSum:', { weightedSum, localWeight: { a: nodeValues[connection.inNode], b: connection.weight }, connection, node, nodeValues })
            }
          }
        }

        // Aplica a função de ativação à soma ponderada e armazena o resultado no objeto nodeValues
        nodeValues[node.id] = this.activationFunction(weightedSum);
      }
    }

    this.nodeValues = nodeValues

    // Extrai os valores dos nós de saída da última camada e retorna como resultado
    const outputLayer = this.layers[this.layers.length - 1];
    const output = outputLayer.map((node) => nodeValues[node.id]);
    return output;
  }

  activationFunctionDerivative(x: number): number {
    const sigmoid = this.activationFunction(x);
    return sigmoid * (1 - sigmoid);
  }

  train(input: number[], targetOutput: number[], learningRate: number): void {
    // Feedforward
    const output = this.feedForward(input);

    // Inicializa os gradientes dos erros para cada nó
    const errorGradients: { [id: number]: number } = {};

    // Backpropagation
    for (let layerIndex = this.layers.length - 1; layerIndex >= 0; layerIndex--) {
      const layer = this.layers[layerIndex];

      for (const node of layer) {
        if (node.type === 'output') {
          // Camada de saída: calcule o erro e o gradiente do erro
          const error = targetOutput[node.id - this.layers[this.layers.length - 2].length] - output[node.id];
          errorGradients[node.id] = error * this.activationFunctionDerivative(node.id);
        } else if (node.type === 'hidden') {
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