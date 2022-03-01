const express = require("express");
const app = express();
const port = 3000;
const crypto = require("crypto");
const sharp = require("sharp");
var router = express.Router();
const fs = require("fs-extra");
const router2 = express.Router();
const axios = require("axios").default;
const streamifier = require("streamifier");
var _ = require("lodash");
const ploptest = require("./ploptest");

const path = require("path");
const Images = require("./models/image/image").model;
module.exports = {
  async downloadImage(url) {
    const buffer = await axios.get(url, {
      responseType: "arraybuffer",
    });

    return buffer.data;
  },
  async getEditFields() {
    const fields = await db;
  },
  async getImageMetaData(img) {
    const metadata = await sharp(img).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  },

  uploadImage: async function (files, parentId) {
    if (!_.isEmpty(files)) {
      for (const field in files) {
        if (Object.hasOwnProperty.call(files, field)) {
          const images = files[field]; // array of images
          const savePaths = images.map((item) => {
            const pathToSave = path.join("./public/images", item.originalname);
            return fs
              .writeFile(pathToSave, item.buffer)
              .then(async (file) => {
                return {
                  file: item.originalname,
                  uploadData: await this.getImageMetaData(item.buffer),
                };
              })
              .then((data) => {
                const metadata = data.uploadData;
                return Images.query().insert({
                  url: data.file,
                  width: metadata.width,
                  main: field === "thumbnail" ? true : false,
                  height: metadata.height,
                  parentId: parentId,
                });
              });
          });

          await Promise.all(savePaths);
        }
      }
    }
  },
  async generateModel(name, cols, has_media) {
    for (const type in cols) {
      if (Object.hasOwnProperty.call(cols, type)) {
        const element = cols[type];
      }
    }

    const view = {
      modelName: name.charAt(0).toUpperCase() + name.slice(1),
      tableName: name,
      requireds: [],
      properties: cols,

      has_media: Boolean(has_media),
      is_parent: name === "category_master",
    };

    if (
      cols.find((item) => {
        return item.schema.name === "label";
      }) &&
      cols.find((item) => {
        return item.schema.name === "parentId";
      })
    ) {
      view["has_parent"] = true;
    }

    ploptest(view);
  },
  ObjToArr(obj) {
    return Object.entries(obj).map(([k, v]) => {
      return { ...v, name: _.startCase(k) };
    });
  },

  getModel(category) {
    const rootDirectory = path.resolve("./models");

    const filename = path.join(rootDirectory, category, category);

    if (filename.indexOf(rootDirectory) !== 0) {
      return;
    }
    const Model = require(filename).model;
    return Model;
  },
  flatten(data, category) {
    const main_data = data[category];
    const images = {};
    for (const key in main_data.properties) {
      if (Object.hasOwnProperty.call(main_data.properties, key)) {
        const element = main_data.properties[key];
        images[key] = {
          label: null,
          images: [],
          uid: element.images[0].key,
        };
        for (const image of element.images) {
          image["parentId"] = image.key;

          image["isMain"] = image["tags"][1] === "true";
          images[key]["images"].push(image);
          if (image.label) {
            images[key]["label"] = image.label;
          }
        }
      }
    }
    return images;
  },
  parseJSON(file) {
    return JSON.parse(file);
  },

  async getMediaCols(Model) {
    const cols = Model.clientCols;
  },
  async compressImage(buffer) {
    const metadata = await sharp(buffer).metadata();
    const image = sharp(buffer);
    let result = {};
    if (metadata.width >= 950) {
      result["image"] = await image
        .resize({ width: 900 })

        .toBuffer();
    } else {
      result["image"] = await image
        .resize({ width: 900 })

        .toBuffer();
    }
    result["metadata"] = metadata;
    return result;
  },
};
