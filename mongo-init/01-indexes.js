/*
 * Runs on container bootstrap.
 * Creates a compound index to speed up:
 *   GET /api/netlists?userId=&skip=&limit=
 */
db = db.getSiblingDB('pcb');   // same name used in docker-compose MONGO_URI
db.netlists.createIndex(
  { userId: 1, createdAt: -1 },
  { name: 'user_created_idx', background: true }
);
