import InnovationCounter from "./innovation-counter";
import { ConnectionGene, NodeGene } from "./types";

export default class Genome {
  constructor(
    readonly connectionGenes: ConnectionGene[],
    readonly nodeGenes: NodeGene[],
    readonly innovationCounter: InnovationCounter,
    public fitness: number = 0
  ) { }

  mutate(): void {
    const mutationType = Math.random();

    if (mutationType < 0.8) {
      this.mutateWeights();
    } else if (mutationType < 0.9) {
      this.addConnection(this.innovationCounter);
    } else {
      this.addNode(this.innovationCounter);
    }
  }

  mutateWeights(): void {
    for (const connection of this.connectionGenes) {
      if (Math.random() < 0.9) {
        // Perturbe o peso
        connection.weight += (Math.random() * 2 - 1) * 0.5;
      } else {
        // Atribua um novo peso aleatório
        connection.weight = Math.random() * 2 - 1;
      }
    }
  }

  addConnection(innovationCounter: InnovationCounter): void {
    const availableNodes = this.nodeGenes.filter((node) => node.type !== 'output');
    const inputNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
    const outputNodes = this.nodeGenes.filter((node) => node.type !== 'input' && node.id !== inputNode.id);
    const outputNode = outputNodes[Math.floor(Math.random() * outputNodes.length)];

    const existingConnection = this.connectionGenes.find(
      connection => connection.inNode === inputNode.id && connection.outNode === outputNode.id
    );

    if (!existingConnection) {
      const newConnection: ConnectionGene = {
        inNode: inputNode.id,
        outNode: outputNode.id,
        weight: Math.random() * 2 - 1,
        enabled: true,
        innovation: innovationCounter.next(),
      };

      this.connectionGenes.push(newConnection);
    }
  }

  addNode(innovationCounter: InnovationCounter): void {
    if (this.connectionGenes.length === 0) return;

    const connectionToSplit = this.connectionGenes[Math.floor(Math.random() * this.connectionGenes.length)];
    connectionToSplit.enabled = false;

    const newNodeId = Math.max(...this.nodeGenes.map((node) => node.id)) + 1;
    const newNode: NodeGene = {
      id: newNodeId,
      type: 'hidden',
      weight: Math.random() * 2 - 1
    };
    this.nodeGenes.push(newNode);

    const newConnection1: ConnectionGene = {
      inNode: connectionToSplit.inNode,
      outNode: newNode.id,
      weight: Math.random() * 2 - 1,
      enabled: true,
      innovation: innovationCounter.next(),
    };

    const newConnection2: ConnectionGene = {
      inNode: newNode.id,
      outNode: connectionToSplit.outNode,
      weight: connectionToSplit.weight,
      enabled: true,
      innovation: innovationCounter.next(),
    };

    this.connectionGenes.push(newConnection1);
    this.connectionGenes.push(newConnection2);
  }

  // Retorna um array com as camadas de neurônios
  getLayers(): NodeGene[][] {
    const inputLayer = this.nodeGenes.filter(node => node.type === 'input');
    const outputLayer = this.nodeGenes.filter(node => node.type === 'output');
    const hiddenNodes = this.nodeGenes.filter(node => node.type === 'hidden');
    const layers: NodeGene[][] = [inputLayer];
    let currentLayerIndex = 0;

    while (hiddenNodes.length > 0) {
      const currentLayer: NodeGene[] = [];

      for (let i = 0; i < hiddenNodes.length; i++) {
        const node = hiddenNodes[i];
        const incomingConnections = this.connectionGenes.filter(
          connection => connection.outNode === node.id && connection.enabled
        );

        const allConnectionsComeFromLayers = incomingConnections.every(connection => layers[currentLayerIndex].some(layerNode => layerNode.id === connection.inNode))
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

  // Verifica se existem conexões ativas
  hasActiveConnections(): ConnectionGene[] {
    return this.connectionGenes.filter(c => c.enabled)
  }

  // Verifica se neurônios na mesma camada têm conexões entre si
  hasConnectionsInSameLayer(): boolean {
    const layers = this.getLayers();
    for (const layer of layers) {
      const nodeIds = layer.map(node => node.id);
      for (const nodeId of nodeIds) {
        const connections = this.connectionGenes.filter(conn => conn.enabled && conn.inNode === nodeId && nodeIds.includes(conn.outNode));
        if (connections.length > 0) {
          return true;
        }
      }
    }

    return false;
  }

  // Verifica se somente neurônios da camada mais oculta têm conexões com o output
  hasOutputConnectionsFromHiddenLayer(): boolean {
    const outputNodes = this.nodeGenes.filter(node => node.type === 'output');
    const hiddenNodes = this.nodeGenes.filter(node => node.type === 'hidden' && node.id > outputNodes.length);

    for (const hiddenNode of hiddenNodes) {
      for (const outputNode of outputNodes) {
        const connectionExists = this.connectionGenes.some(conn => conn.inNode === hiddenNode.id && conn.outNode === outputNode.id);
        if (!connectionExists) {
          return false;
        }
      }
    }

    return true;
  }

  // Verifica se todos os neurônios de output recebem conexões da camada mais oculta
  hasAllOutputNodesConnected(): boolean {
    const outputNodes = this.nodeGenes.filter(node => node.type === 'output');
    const hiddenNodes = this.nodeGenes.filter(node => node.type === 'hidden' && node.id > outputNodes.length);

    for (const outputNode of outputNodes) {
      let connected = false;
      for (const hiddenNode of hiddenNodes) {
        const connectionExists = this.connectionGenes.some(conn => conn.inNode === hiddenNode.id && conn.outNode === outputNode.id);
        if (connectionExists) {
          connected = true;
          break;
        }
      }
      if (!connected) {
        return false;
      }
    }

    return true;
  }

  // Verifica se neurônios na mesma camada se conectam apenas com neurônios da próxima camada
  hasConnectionsOnlyToNextLayer(): boolean {
    const layers = this.getLayers();
    for (let i = 0; i < layers.length - 1; i++) {
      const currentLayer = layers[i];
      const nextLayer = layers[i + 1];

      for (const node of currentLayer) {
        const connections = this.connectionGenes.filter(conn => conn.enabled && conn.inNode === node.id && !nextLayer.some(nextNode => nextNode.id === conn.outNode));
        if (connections.length > 0) {
          return false;
        }
      }
    }

    return true;
  }
}