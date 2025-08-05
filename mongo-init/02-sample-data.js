/*
 * Inserts a single “hello world” netlist so the
 * frontend has data right after `docker compose up`.
 * Safe to remove later.
 */

db = db.getSiblingDB('pcb');

const now = new Date().toISOString();

db.netlists.insertOne({
  userId: 'demo@example.com',
  createdAt: now,
  netlist: {
    components: [
      { id: 'U1', name: 'ATmega328P', type: 'IC',
        pins: [{ id: '1', name: 'VCC' }, { id: '2', name: 'GND' }] }
    ],
    nets: [
      { id: 'N1', name: 'GND',
        connections: [{ componentId: 'U1', pinId: '2' }] },
      { id: 'N2', name: 'VCC',
        connections: [{ componentId: 'U1', pinId: '1' }] }
    ]
  },
  validation: {
    status: 'valid',
    violations: []
  }
});
