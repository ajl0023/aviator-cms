const { writeFileSync } = require("fs-extra");
const { ObjectId } = require("mongodb");
const db = require("./db");

async function importData() {
  const collection = (await db).collection("categories");
  const data = require("./exported-data/categories.json");
  await collection.insertMany(data);
  process.exit();
}

async function main() {
  const collection = (await db).collection("carousel-renders");
  const res = await collection
    .aggregate([
      { $unwind: "$left" },
      {
        $match: {
          _id: ObjectId("62197503c745dafc80be4c65"),
        },
      },
      {
        $group: {
          _id: "$_id",
          order: { $max: "$left.order" },
        },
      },
    ])
    .toArray();
  console.log(res);
  const item = await collection.findOne({
    thumb: false,
  });

  const left = item.images.filter((item) => {
    const regex = /left/gi;
    return item.url.search(regex) > 0;
  });
  const right = item.images.filter((item) => {
    const regex = /right/gi;
    return item.url.search(regex) > 0;
  });
  const thumbs = await collection.findOne({
    thumb: true,
  });

  process.exit();
}

async function dataToJson() {
  const items = await (await db).collection("categories").find().toArray();
  writeFileSync("./exported-data/categories.json", JSON.stringify(items));
  process.exit();
}
async function addCol() {
  const collection = await (await db).collection("categories");
  await collection.updateMany(
    {},
    {
      $set: {
        visible: false,
      },
      // $push: {
      //   editableFields_mobile: {
      //     $each: [
      //       {
      //         type: "media",
      //         name: "phases",
      //         multi: true,
      //         client_label: "images",
      //       },
      //     ],
      //   },
      // },
    }
  );
  // await collection.updateOne(
  //   {
  //     _id: ObjectId("621977cce731cec56f5593a8"),
  //   },
  //   {
  //     $set: {
  //       category: ObjectId("62198acfee737dc5b139ea71"),
  //     },
  //   }
  // );
  process.exit(0);
}
addCol();
// dataToJson();
