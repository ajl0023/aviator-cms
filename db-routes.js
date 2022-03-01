const knex = require("./knexInstance");
const fs = require("fs");
const path = require("path");
const ObjectID = require("mongodb").ObjectId;
const _ = require("lodash");
module.exports = (router) => {
  router.delete("/delete", async (req, res) => {
    const entries = await db.collection("behind-the-scenes").drop();
    res.json(entries);
  });
  router.post("/data-json", async (req, res) => {
    const data = await db.collection("mobile").find().toArray();
    fs.writeFileSync("mobile-db.json", JSON.stringify(data));
    res.json("s");
  });
  router.post("/category", async (req, res) => {
    const collection = await db.collection("categories");
    await collection.insert({
      category: "mobile",
      type: "mobile",
      title: _.startCase("mobile pages"),
      description: "these are categories for the mobile site",
    });
    res.json("done");
  });
  router.put("/page", async (req, res) => {
    const data = await db.collection("behind-the-scenes").find().toArray();
    const references = [];
    function findImages(data) {
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        if (element["images"]) {
          references.push(element["images"]);
        } else {
          const keys = Object.keys(element);
          for (const key of keys) {
            if (Array.isArray(element[key])) {
              findImages(element[key]);
            }
          }
        }
      }
    }
    findImages(data);
    references.forEach((item) => {
      item.forEach((img) => {
        const formatted = path.join(img.url).replace(/\\/gi, "/");

        img.url = "http://localhost:3000/" + formatted;
      });
    });
    for (const item of data) {
      await db.collection("behind-the-scenes").update(
        {
          _id: ObjectID(item._id),
        },
        {
          $set: {
            ...item,
          },
        }
      );
    }
    res.json("finish");
  });
};
