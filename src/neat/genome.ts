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
      (connection) => connection.inNode === inputNode.id && connection.outNode === outputNode.id
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
    };
    this.nodeGenes.push(newNode);

    const newConnection1: ConnectionGene = {
      inNode: connectionToSplit.inNode,
      outNode: newNode.id,
      weight: 1,
      enabled: true,
      innovation: innovationCounter.next(),
    };

    const newConnection2: ConnectionGene = {
      inNode: newNode.id,
      outNode: connectionToSplit.outNode,
      weight: connectionToSplit.weight,
      enabled: true,
      innovation: innovationCounter.next(), // Atualize este valor com o número de inovação correto
    };

    this.connectionGenes.push(newConnection1);
    this.connectionGenes.push(newConnection2);
  }
}