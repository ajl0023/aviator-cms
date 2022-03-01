const knex = require("./knexInstance");
var knexnest = require("knexnest");
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");

const _ = require("lodash");
const ObjectID = require("mongodb").ObjectId;
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const {
  parseJSON,
  uploadFromBuffer,
  ObjToArr,
  getMediaCols,
  getModel,
  getImageMetaData,
  uploadImage,
  compressImage,
} = require("./utils");

var Mustache = require("mustache");
const { randomUUID } = require("crypto");

const sharp = require("sharp");
const utils = require("./utils");
const { dataTypes, types } = require("./column-types");
const { deletePhotos } = require("./bblaze");
const { start } = require("repl");

module.exports = async (router) => {
  const db = await require("./db.js");
  router.get("/pages", async (req, res) => {
    if (req.query.title) {
    } else {
      const pages = await db
        .collection("pages")
        .find(
          {},
          {
            projection: {
              name: 1,
            },
          }
        )
        .toArray();
    }
    res.json(pages);
  });

  // router.get("/pages/:name", async (req, res) => {
  //   const page_id = req.params.id;

  //   const page = await db.collection("pages").findOne({
  //     _id: ObjectID(page_id),
  //   });
  //   console.log(page);
  //   res.json(page);
  // });

  router.get("/bg-pages", async (req, res) => {
    const pages = await db.collection("bg-pages").find({}).toArray();

    res.json(pages);
  });

  router.put("/bg-pages", upload.single("url"), async (req, res) => {
    const category = "bg-pages";

    const idToUpdate = req.body._id;
    const collection = db.collection(category);
    const categoryData = await db.collection("categories").findOne({
      category,
    });
    const savePath = categoryData.imageFolder;
    const editableFields = categoryData.editableFields;
    const update_data = {};
    const merged_data = {};

    for (const field of editableFields) {
      update_data[field.name] = merged_data[field.name];
    }

    if (req.file) {
      const fileName = req.file.originalname;
      const image = req.file.buffer;
      const compressed = await compressImage(image);
      const newUrl =
        "http://localhost:3000/" +
        path.posix.join("mock-bb-storage", savePath, fileName);
      update_data["url"] = newUrl;
      const update = await collection.updateOne(
        {
          _id: new ObjectID(idToUpdate),
        },
        {
          $set: {
            ...update_data,
          },
        }
      );
      fs.writeFileSync(
        path.join("./public/mock-bb-storage", savePath, fileName),
        compressed.image
      );
    }
    res.json("nice");
  });
  router.get("/page-carousels", async (req, res) => {
    const pages = await db.collection("page-carousels").find({}).toArray();

    res.json(pages);
  });
  router.get("/mobile", async (req, res) => {
    const pages = await db.collection("mobile").find({}).toArray();
    res.json(pages);
  });
  router.put(
    "/mobile",
    upload.fields([
      { name: "image", maxCount: 1 },
      {
        name: "images",
      },
      {
        name: "phases",
      },
    ]),
    async (req, res) => {
      console.log("ffffffffffff");
      const category = "mobile";
      const collection = db.collection("mobile");
      const idToUpdate = req.body._id;
      const categoryData = await collection
        .findOne({
          _id: ObjectID(idToUpdate),
        })
        .then((res) => {
          return db.collection("categories").findOne({
            _id: ObjectID(res.category),
          });
        });

      const savePath = categoryData.imageFolder;
      const editableFields = categoryData.editableFields_mobile;

      const media_fields = editableFields
        .filter((item) => {
          return item.type === "media";
        })
        .reduce((acc, b) => {
          acc[b.name] = [];
          return acc;
        }, {});

      for (const field in media_fields) {
        const starting_order = (
          await collection
            .aggregate([
              { $unwind: `$${field}` },
              {
                $match: {
                  _id: ObjectID(idToUpdate),
                },
              },
              {
                $group: {
                  _id: "$_id",
                  order: { $max: `$${field}.order` },
                },
              },
            ])
            .toArray()
        )[0].order;

        const compress = req.files[field].map((item, i) => {
          const newUrl =
            "http://localhost:3000/" +
            path.posix.join("mock-bb-storage", savePath, item.originalname);

          return compressImage(item.buffer).then((compressed) => {
            fs.writeFileSync(
              path.join(
                "./public/mock-bb-storage",
                savePath,
                item.originalname
              ),
              compressed.image
            );
            return {
              url: newUrl,
              order: starting_order + i + 1,
            };
          });
        });
        media_fields[field] = { $each: await Promise.all(compress) };
      }

      res.json(3);
    }
  );

  router.put(
    "/mobile/behind-the-scenes",
    upload.fields([
      {
        name: "phases",
      },
    ]),
    async (req, res) => {
      const category = "mobile";
      const collection = db.collection(category);
      const idToUpdate = req.body._id;
      const phase = parseInt(req.body.phase);

      const categoryData = await collection
        .findOne({
          _id: ObjectID(idToUpdate),
        })
        .then((res) => {
          return db.collection("categories").findOne({
            _id: ObjectID(res.category),
          });
        });

      const savePath = categoryData.imageFolder;
      const editableFields = categoryData.editableFields_mobile;

      const media_fields = editableFields
        .filter((item) => {
          return item.type === "media";
        })
        .reduce((acc, b) => {
          acc[b.name] = [];
          return acc;
        }, {});

      for (const field in media_fields) {
        const starting_order = (
          await collection
            .aggregate([
              { $unwind: `$${field}` },
              { $unwind: `$phases.images` },
              {
                $match: {
                  "phases.phase": phase,
                },
              },
              {
                $group: {
                  _id: "$phases.phase",
                  order: { $max: `$phases.images.order` },
                },
              },
            ])
            .toArray()
        )[0].order;

        const compress = req.files[field].map((item, i) => {
          const newUrl =
            "http://localhost:3000/" +
            path.posix.join("mock-bb-storage", savePath, item.originalname);

          return compressImage(item.buffer).then((compressed) => {
            fs.writeFileSync(
              path.join(
                "./public/mock-bb-storage",
                savePath,
                item.originalname
              ),
              compressed.image
            );
            return {
              url: newUrl,
              order: starting_order + i + 1,
            };
          });
        });

        media_fields[field] = {
          "phases.$[outer].images": {
            $each: await Promise.all(compress),
          },
        };
        await Promise.all(compress);
        await collection.updateOne(
          {
            _id: new ObjectID(idToUpdate),
          },
          {
            $push: {
              ...media_fields[field],
            },
          },
          {
            arrayFilters: [{ "outer.phase": phase }],
          }
        );
      }

      res.status(200).json("");
    }
  );
  router.put(
    "/page-carousels",
    upload.fields([{ name: "images" }]),
    async (req, res) => {
      const category = "page-carousels";

      const idToUpdate = req.body._id;

      const collection = db.collection(category);
      const categoryData = await db.collection("categories").findOne({
        category,
      });
      const savePath = categoryData.imageFolder;
      const editableFields = categoryData.editableFields;
      const update_data = {};
      const media_fields = editableFields
        .filter((item) => {
          return item.type === "media";
        })
        .reduce((acc, b) => {
          acc[b.name] = [];
          return acc;
        }, {});

      for (const field in media_fields) {
        const starting_order = (
          await collection
            .aggregate([
              { $unwind: `$${field}` },
              {
                $match: {
                  _id: ObjectID(idToUpdate),
                },
              },
              {
                $group: {
                  _id: "$_id",
                  order: { $max: `$${field}.order` },
                },
              },
            ])
            .toArray()
        )[0].order;
        const compress = req.files[field].map((item, i) => {
          const newUrl =
            "http://localhost:3000/" +
            path.posix.join("mock-bb-storage", savePath, item.originalname);

          return compressImage(item.buffer).then((compressed) => {
            fs.writeFileSync(
              path.join(
                "./public/mock-bb-storage",
                savePath,
                item.originalname
              ),
              compressed.image
            );
            return {
              url: newUrl,
              order: starting_order + i + 1,
            };
          });
        });
        media_fields[field] = { $each: await Promise.all(compress) };
      }

      if (req.files) {
        const update = await collection.updateOne(
          {
            _id: new ObjectID(idToUpdate),
          },
          {
            $push: {
              ...media_fields,
            },
          }
        );

        res.json("nice");
      }
    }
  );
  router.get("/behind-the-scenes", async (req, res) => {
    const pages = await db.collection("behind-the-scenes").find({}).toArray();

    res.json(pages);
  });
  router.put("/behind-the-scenes", upload.array("images"), async (req, res) => {
    const category = "behind-the-scenes";

    const idToUpdate = req.body._id;
    const collection = db.collection(category);
    const categoryData = await db.collection("categories").findOne({
      category,
    });
    const savePath = categoryData.imageFolder;
    const editableFields = categoryData.editableFields;
    const update_data = {};
    const merged_data = {};

    for (const field of editableFields) {
      update_data[field.name] = merged_data[field.name];
    }
    const compress = req.files.map((item) => {
      const newUrl =
        "http://localhost:3000/" +
        path.posix.join("mock-bb-storage", savePath, item.originalname);
      return compressImage(item.buffer).then((compressed) => {
        fs.writeFileSync(
          path.join("./public/mock-bb-storage", savePath, item.originalname),
          compressed.image
        );
        return {
          url: newUrl,
        };
      });
    });
    const compressedFiles = await Promise.all(compress);

    if (req.files) {
      const update = await collection.updateOne(
        {
          _id: new ObjectID(idToUpdate),
        },
        {
          $push: {
            images: {
              $each: compressedFiles,
            },
          },
        }
      );
    }
    res.json("nice");
  });

  router.get("/carousel-renders", async (req, res) => {
    const fetched = await db
      .collection("carousel-renders")
      .find(
        {
          thumb: false,
        },
        {}
      )
      .toArray();

    res.json(fetched);
  });
  router.put(
    "/carousel-renders",
    upload.fields([{ name: "thumbs" }, { name: "left" }, { name: "right" }]),
    async (req, res) => {
      const category = "carousel-renders";

      const idToUpdate = req.body._id;

      const collection = db.collection(category);
      const categoryData = await db.collection("categories").findOne({
        category,
      });
      const savePath = categoryData.imageFolder;
      const editableFields = categoryData.editableFields;
      const update_data = {};
      const media_fields = editableFields
        .filter((item) => {
          return item.type === "media";
        })
        .reduce((acc, b) => {
          acc[b.name] = [];
          return acc;
        }, {});

      for (const field in media_fields) {
        const starting_order = (
          await collection
            .aggregate([
              { $unwind: `$${field}` },
              {
                $match: {
                  _id: ObjectID(idToUpdate),
                },
              },
              {
                $group: {
                  _id: "$_id",
                  order: { $max: `$${field}.order` },
                },
              },
            ])
            .toArray()
        )[0].order;
        const compress = req.files[field].map((item, i) => {
          const newUrl =
            "http://localhost:3000/" +
            path.posix.join("mock-bb-storage", savePath, item.originalname);
          return compressImage(item.buffer).then((compressed) => {
            fs.writeFileSync(
              path.join(
                "./public/mock-bb-storage",
                savePath,
                item.originalname
              ),
              compressed.image
            );
            return {
              url: newUrl,
              order: starting_order + i + 1,
            };
          });
        });
        media_fields[field] = { $each: await Promise.all(compress) };
      }

      if (req.files) {
        const update = await collection.updateOne(
          {
            _id: new ObjectID(idToUpdate),
          },
          {
            $push: {
              ...media_fields,
            },
          }
        );
      }
      res.json("nice");
    }
  );
  router.get("/categories", async (req, res) => {
    const pages = await db.collection("categories").find().toArray();

    res.json(pages);
  });
  router.delete("/pages/:id", async (req, res) => {
    const page_id = req.params.id;

    const page = await db.collection("pages").findOne({
      _id: ObjectID(page_id),
    });
    const images = page.images;
    deletePhotos(images);
    res.json(page);
  });
  router.post("/pages", async (req, res) => {
    const currentFolder = "bg-pages";
    const collection = "bg-pages";
    // const imagesPath = require(path.join("./images", currentFolder, "images"));
    const subFolder = "contact";
    const currOrder = 4;
    const imageData1 = JSON.parse(
      fs.readFileSync(
        path.join("./images", currentFolder, subFolder, "data.json")
      )
    );
    // const imageData2 = JSON.parse(
    //   fs.readFileSync(
    //     path.join("./images", currentFolder, "phase2", "data.json")
    //   )
    // );
    // const formattedPath = imageData[0].path.replace(/public\\/i, "");
    const formattedPath = imageData1[0].path
      .replace(/public\\/i, "")
      .replace(/\\/gi, "/");
    await db.collection(collection).insert({
      page: "contact",
      // order: currOrder,
      // type: "video",
      url: "http://localhost:3000/" + formattedPath,

      // images: imageData1.map((item) => {
      //   return {
      //     url:
      //       "http://localhost:3000/" +
      //       item.path.replace(/public\\/i, "").replace(/\\/gi, "/"),
      //     order: item.order,
      //   };
      // }),
      type: "image",
      order: 2,
      // category: ObjectID("62198b33f38911e118d08032"),
    });

    res.json("nice");
  });

  router.put("/test", async (req, res) => {
    const thumbs = require("./imageData2.json").map((file) => {
      return `https://f004.backblazeb2.com/file/AmitApelMain/${file.fileName}`;
    });
    const images = require("./imageData.json")
      .files.filter((file) => {
        return !file.ignore;
      })
      .map((file) => {
        return `https://f004.backblazeb2.com/file/AmitApelMain/${file.fileName}`;
      });

    const update = await db.collection("pages").update(
      {
        _id: ObjectID("6216a987c211e0c8da16e9d5"),
      },
      {
        $set: {
          name: "malibu",
          type: "lg_image",
          order: 0,
          images: [
            "https://f004.backblazeb2.com/file/AmitApelMain/Background+Tab+Pic+(1072+x+796).jpg",
          ],
        },
      }
    );

    res.json("finished");
  });
  router.get("/templates", async (req, res) => {
    const templateColumns = types;
    res.json(templateColumns);
  });
  router.get("/columns", async (req, res) => {
    const category = req.query.category;

    const model = require(`./models/${category}/${category}`).model;
    const jsonSchema = model.clientCols;

    const columnsToArr = ObjToArr(jsonSchema);
    res.json(columnsToArr);
  });
  router.put("/category", async (req, res) => {
    const updated_items = req.body.reordered;
    const category = req.query.category;
    const Model = getModel(category);
    const sorted = updated_items.sort((a, b) => {
      return a.sort_index - b.sort_index;
    });
    //1. the issue is is that the sort_index already exists when trying to update, trying to update uid with new index 0 doesnt work, because 0 index already exists

    //2. never want to sacrfice db integrity validation stuff
    //3. i think i got a decent working solution that doesn't cause any unncessary update????
    //4. old indexes are initially set to null, replaced by the new indexs, maintains data integrity and unique values and deosnt update entire set of data...?
    for (const item of sorted) {
      await Model.query()
        .patch({
          m_order: null,
        })
        .where({
          m_order: item.sort_index,
        });

      await Model.query()
        .patch({
          m_order: item.sort_index,
        })
        .where({
          uid: item.uid,
        });
    }

    res.json("test");
  });
  router.get("/category", async (req, res) => {
    const category = req.query.category;
    const Model = getModel(category);

    // const media_cols = getMediaCols(Model);

    const relations = Model.getRelations();
    const columns = [];
    for (const col in Model.clientCols) {
      if (Object.hasOwnProperty.call(Model.clientCols, col)) {
        const element = Model.clientCols[col];
        if (!element.media) {
          columns.push(col);
        }
      }
    }

    const relationQuery = Object.keys(relations).reduce((a, b) => {
      a[b] = true;
      return a;
    }, {});

    const data = await Model.query()
      .orderBy("m_order", "asc")
      .cursorPage(req.query.next || req.query.previous);

    const arr = [];
    for (let item of data.results) {
      const formatted = _.pick(item, columns);

      for (const relation in relationQuery) {
        formatted[relation] = await item.$relatedQuery(relation).limit(3);
      }

      arr.push(formatted);
    }

    res.json({
      results: arr,

      page: data.pageInfo,
    });
  });
  router.get("/test", async () => {
    var view = {
      modelName: "Test",
      tableName: "test",
    };
    const test = fs.readFileSync("./test.mustache").toString();

    var output = Mustache.render(test, view);
    fs.writeFileSync("test2.js", output);
  });
  router.delete("/delete-test", async (req, res) => {
    const CategoryMaster = category_master.model;
    await require("./models/hospitality/hospitality").model.query().delete();

    res.json("success");
  });
  router.post(
    "/entry",
    upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "images" }]),
    async function (req, res) {
      const body = req.body;
      const tableExists = await knex.schema.hasTable(body.category);
      const req_schema = JSON.parse(req.body.schema);
      if (tableExists) {
        let table = body.category;
        const Model = getModel(table);

        const max_order = await Model.query().max({
          order: "m_order",
        });
        const new_order = max_order[0].order + 1;
        const new_entry = {
          ...req_schema,
          m_order: new_order,
        };

        const validated = Model.fromJson({ ...new_entry });

        if (validated) {
          const shared_id = randomUUID();

          const parent_db = Model.superTable;
          const ParentModel =
            require(`./models/${parent_db}/${parent_db}`).model;
          const query = ParentModel.query().insert({
            uid: shared_id,
          });

          query.context({
            child: table,
            data: {
              ...validated,
              parentId: shared_id,
            },
          });
          await query;
          utils.uploadImage(req.files, shared_id);

          res.json("success");
        }
      } else {
        res.status(404).json("meh");
      }
    }
  );

  router.post("/category_item", async (req, res) => {
    //1.) upload to cloudinary
    const Images = require("./models/image/image").model;
    const category = req.body.category;
    const table_name = req.body.category;
    const imagesDir = fs.readdirSync(path.join("./images", category));
    await category_master.model.query().delete().where({
      category: category,
    });
    let test = true;
    for (const uid of imagesDir) {
      const data = parseJSON(
        fs.readFileSync(path.join("./images", category, uid, "data.json"))
      );

      const imagesFinal = [];
      const orig_image_path = path.join("./images", category, uid);
      const images = fs
        .readdirSync(path.join(orig_image_path, "images"))
        .map((img) => {
          return path.join(orig_image_path, "images", img);
        });

      const thumb = path.join(
        path.join("./images", category, uid, "thumb"),
        fs.readdirSync(path.join("./images", category, uid, "thumb"))[0]
      );
      const label = data.label;

      const sub_category = data.category;

      for (const img of images) {
        const file = path.parse(img).base;
        fs.copyFileSync(img, path.join("./public/images", file));
      }
      fs.copyFileSync(
        thumb,
        path.join("./public/images", path.parse(thumb).base)
      );

      // metadata of image
      // get filepath of image
      // determine if photo is main

      await category_master.model
        .query()
        .context({
          child: table_name,
          data: {
            label: label,
            parentId: uid,
            sub_category,
          },
        })
        .insert({
          category: table_name,
          label: label,
          uid: uid,
        });

      for (const img of images) {
        const metadata = await sharp(img).metadata();

        await Images.query().insert({
          url: path.parse(img).base,
          width: metadata.width,
          main: false,
          height: metadata.height,
          parentId: uid,
        });
      }
      const metadata = await sharp(thumb).metadata();
      await Images.query().insert({
        url: path.parse(thumb).base,
        width: metadata.width,
        main: true,
        height: metadata.height,
        parentId: uid,
      });
    }
    res.json("done");
  });
};
