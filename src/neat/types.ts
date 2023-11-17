import Genome from "./genome";

export type NodeGene = {
  id: number;
  type: 'input' | 'hidden' | 'output';
}

export type ConnectionGene = {
  inNode: number;
  outNode: number;
  weight: number;
  enabled: boolean;
  innovation: number;
}

export type Species = {
  id: number;
  members: Genome[];
}