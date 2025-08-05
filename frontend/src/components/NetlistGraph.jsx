// src/components/NetlistGraph.jsx
//
// Converts a JSON netlist into a React Flow graph with automatic layout.
//

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import netlistToFlow from '../utils/netlistToFlow';

// Dagre graph instance used for automatic layout.

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

// Node dimensions (px) used by Dagre.

const nodeWidth  = 160;
const nodeHeight = 60;

/**
 * Run Dagre layout on the supplied nodes + edges.
 */
const layout = (nodes, edges) => {
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 80 });

  nodes.forEach(n => dagreGraph.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach(e => dagreGraph.setEdge(e.source, e.target));

  dagre.layout(dagreGraph);

  return nodes.map(n => {
    const pos   = dagreGraph.node(n.id);
    n.position  = { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 };
    return n;
  });
};

export default function NetlistGraph({ netlist, violations }) {

  // Translate netlist JSON → React Flow format {nodes, edges}

  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => netlistToFlow(netlist, violations),
    [netlist, violations]
  );

  // Memoised layout so it re-runs only when data changes.

  const laidOut = useMemo(() => {
    const n = JSON.parse(JSON.stringify(rawNodes)); // deep copy
    const e = JSON.parse(JSON.stringify(rawEdges));
    return { nodes: layout(n, e), edges: e };
  }, [rawNodes, rawEdges]);

  // Local state enables interactive editing.

  const [nodes, setNodes, onNodesChange] = useNodesState(laidOut.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(laidOut.edges);

  // We disable edge creation; placeholder kept for completeness.
  const onConnect = useCallback(() => {}, []);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap pannable zoomable />
        <Background gap={12} />
      </ReactFlow>
    </div>
  );
}
