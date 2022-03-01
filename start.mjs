let connection;

import server from "./server.js";
import db from "./db.js";
async function main() {
  const dbIns = await db;
  server();
}
main();
