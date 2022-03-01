const { MongoClient } = require("mongodb");

let connection;

async function main() {
  const uri =
    "mongodb+srv://a:a@cluster0.2e6a1.mongodb.net/aviator?retryWrites=true&w=majority";

  const client = new MongoClient(uri);

  connection = await client.connect();
  const db = connection.db("aviator");

  return db;
}
module.exports = main();
process.on("SIGINT", async () => {
  if (connection) {
    await connection.close();
    console.log("connection closed");
    process.exit(0);
  }
});
