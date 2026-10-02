import { NODES, NODE_WIDTH, X_BY_STAGE, type MapNode, type NodeStatus } from './levelTestPreviewModel.ts';

// One grid for all unit reviews; half rows center a parent between its branches.
const ROWS: Record<string, number> = {
  'sum-rule': 0, 'product-rule': 1, factorial: 1, permutation: 1,
  combination: 0, circular: 1, 'repeated-permutation': 2,
  'repeated-combination': 0, 'binomial-theorem': 1, 'same-permutation': 2,
  'combination-use': 0, 'binomial-coeff': 1,
  'sample-space': 1, 'math-probability': 1, complement: .5, disjoint: 1.5,
  addition: .5, multiplication: 1.5, conditional: .5, independence: 1.5,
  'independent-trials': 1,
  'random-variable': 1.5, discrete: .5, continuous: 3, pmf: 0, expected: 1,
  pdf: 3, binomial: 0, variance: 1, normal: 3, stddev: 1,
  'standard-normal': 2, standardization: 3, 'normal-approx': 3,
  'frequency-table': 2, histogram: 0, 'frequency-polygon': 1, average: 2,
  median: 3, mode: 4, spread: 2, scatter: 2, correlation: 2,
  population: 5.5, 'sample-survey': 5.5, 'random-sampling': 5.5,
  'sample-mean': 5, 'sample-ratio': 6, confidence: 5.5,
};

export function unitMapLayout(domain: string, variant: 'review' | 'result' = 'review') {
  const rowGap = variant === 'result' ? 80 : 96;
  const nodes: MapNode[] = NODES.filter(node => node.domain === domain)
    .map(node => ({ ...node, y: 48 + ROWS[node.id] * rowGap }));
  return {
    nodes,
    nodeById: new Map(nodes.map(node => [node.id, node])),
    // Keep the same horizontal extent even for shorter units.
    width: X_BY_STAGE.at(-1)! + NODE_WIDTH + 54,
    height: Math.max(0, ...nodes.map(node => node.y)) + 108,
  };
}

export function unitMapEdgeStatus(statuses: Record<string, NodeStatus>, from: string, to: string) {
  if (statuses[from] === 'failed' || statuses[from] === 'pruned'
    || statuses[to] === 'failed' || statuses[to] === 'pruned') return 'pruned';
  return statuses[from] === 'passed' && statuses[to] === 'passed' ? 'passed' : 'idle';
}
