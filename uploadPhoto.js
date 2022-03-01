const { uploadb2, getPhotos } = require("./bblaze");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const sharp = require("sharp");
const { promisify } = require("util");

const root = "./images";
const imageData = [];
const promises = [];
const mainFolder = "bg-pages";
const subFolder = "contact";
const bbFolder = "bg-image-page";
const mockFolder = "./public/mock-bb-storage";
const copyFile = promisify(fs.copyFile);
async function main(folder) {
  const folderPath = path.join("./images", folder, subFolder, "images");
  const dir = fs.readdirSync(folderPath);
  const sort = dir.sort((a, b) => {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  for (let i = 0; i < sort.length; i++) {
    const file = sort[i];
    const filePath = path.join(folderPath, file);
    const buffer = fs.readFileSync(filePath);

    const fileName = path
      .join("maliview", bbFolder, randomUUID() + path.parse(filePath).base)
      .replace(/\\/g, "/");

    // const data = uploadb2(buffer, fileName).then((data) => {
    //   imageData.push({
    //     ...data.data,
    //     order: i,

    //     page: subFolder,
    //   });
    // });
    const dest = path.join(mockFolder, bbFolder, path.parse(fileName).base);
    const metadata = await sharp(buffer).metadata();

    const data = copyFile(filePath, dest).then(() => {
      imageData.push({
        path: dest,
        width: metadata.width,
        height: metadata.height,
        order: i,
      });
    });

    promises.push(data);
  }

  const jsonPath = path.join("./images", folder, subFolder, "data.json");

  const res = await Promise.all(promises);

  fs.writeFileSync(jsonPath, JSON.stringify(imageData));
}
main(mainFolder);
