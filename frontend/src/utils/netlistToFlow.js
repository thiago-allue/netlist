// src/utils/netlistToFlow.js

// Transform JSON netlist + rule violations into React Flow nodes & edges.
// This is kept separate so it can be unit-tested in isolation.


export default function netlistToFlow(netlist, violations = []) {

  // --------------------------------------------------
  // 1) Build lookup tables for invalid elements.
  // --------------------------------------------------

  const badComponents = new Set();
  const badNets       = new Set();

  violations.forEach(v => {
    if (v.location?.startsWith('component:')) {
      badComponents.add(v.location.split(':')[1]);
    }
    if (v.location?.startsWith('net:')) {
      badNets.add(v.location.split(':')[1]);
    }
  });

  // --------------------------------------------------
  // 2) Create nodes – one per component.
  // --------------------------------------------------

  const nodes = netlist.components.map((c, idx) => ({
    id: c.id,
    position: { x: idx * 120, y: 0 }, // Initial positions; laid out later.
    data: { label: `${c.name} (${c.type})`, pins: c.pins },
    style: badComponents.has(c.id)
      ? { border: '2px solid red' }
      : { border: '1px solid #999' },
  }));

  // --------------------------------------------------
  // 3) Create edges – connect first pin to the others.
  // --------------------------------------------------

  const edges = [];

  netlist.nets.forEach(net => {
    const [head, ...tails] = net.connections;

    tails.forEach((tail, i) => {
      edges.push({
        id: `${net.id}-${i}`,
        source: head.componentId,
        target: tail.componentId,
        label: net.name,
        animated: false,
        style: badNets.has(net.id) ? { stroke: 'red' } : undefined,
      });
    });
  });

  return { nodes, edges };
}
