const { UUID } = require("bson");
const { readFileSync, existsSync } = require("fs");
const fs = require("fs-extra");
const { url } = require("inspector");
const path = require("path");
const sharp = require("sharp");
const { pathToFileURL } = require("url");

require("dotenv").config();

module.exports = (db) => {
  const express = require("express");
  const app = express();
  const port = 3000;

  app.use(
    "/mock-bb-storage",

    async (req, res) => {
      const formatted_url = decodeURIComponent(req.originalUrl);

      const filePath = path.posix.join(__dirname, "public", formatted_url);
      const fileName = path.parse(filePath);

      const sharpStream = sharp({
        failOnError: false,
      });
      const readStream = fs.createReadStream(filePath);

      readStream.on("open", async function () {
        // This just pipes the read stream to the response object (which goes to the client)
        readStream.pipe(sharpStream);
        const savePath = path.join("./temp", fileName.base + fileName.ext);

        if (existsSync(savePath)) {
          res.sendFile(savePath, {
            root: __dirname,
          });
          return;
        }
        await sharpStream
          .resize({
            width: 100,
            height: 100,
          })
          .toFile(savePath);

        res.sendFile(savePath, {
          root: __dirname,
        });
      });
    }
  );
  app.use(express.static("public"));

  var router = express.Router();

  const router2 = express.Router();
  const router3 = express.Router();
  const mobileRoutes = express.Router();
  const cors = require("cors");

  require("./routes")(router, db);

  require("./db-routes")(router3, db);
  require("./mobileRoutes")(mobileRoutes, db);
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cors());
  app.use("/api", router);
  app.use("/api/mobile", mobileRoutes);

  app.use(router2);
  app.use("/db", router3);

  const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });

  return server;
};
