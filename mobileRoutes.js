const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const upload = multer();
const _ = require("lodash");
const ObjectID = require("mongodb").ObjectId;

const {
  parseJSON,
  uploadFromBuffer,
  ObjToArr,
  getMediaCols,
  getModel,
  getImageMetaData,
  uploadImage,
} = require("./utils");

module.exports = async (router) => {
  const db = await require("./db");
  router.post("/pages", async (req, res) => {
    const currentFolder = "bts";
    const page = "behind-the-scenes";
    const type = "gallery";
    const collection = "mobile";
    // const imagesPath = require(path.join("./images", currentFolder, "images"));
    const subFolder = "phase2";
    const imageData1 = JSON.parse(
      fs.readFileSync(
        path.join("./images", currentFolder, "phase1", "data.json")
      )
    );
    const imageData2 = JSON.parse(
      fs.readFileSync(
        path.join("./images", currentFolder, "phase2", "data.json")
      )
    );
    await db.collection(collection).insert({
      page,
      order: 6,
      type,
      phases: [
        {
          phase: 1,
          images: imageData1.map((item) => {
            return {
              url: `https://f004.backblazeb2.com/file/AmitApelMain/${item.fileName}`,
              order: item.order,
            };
          }),
        },
        {
          phase: 2,
          images: imageData2.map((item) => {
            return {
              url: `https://f004.backblazeb2.com/file/AmitApelMain/${item.fileName}`,
              order: item.order,
            };
          }),
        },
      ],
    });

    res.json("nice");
  });
  router.get("/pages", async (req, res) => {
    const data = await db.collection("mobile").find().toArray();

    res.json(data);
  });
};
