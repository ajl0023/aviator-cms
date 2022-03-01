const B2 = require("backblaze-b2");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const b2 = new B2({
  // or accountId: 'accountId'
  applicationKey: "004f03a09f9abfdb6b0babb0f4850d4671cdd10925",
  applicationKeyId: "5a6988aa2e53",

  // or accountId: 'accountId'
  // or masterApplicationKey
});

const image = fs.readFileSync("./download.png");
async function authorize() {
  await b2.authorize();
  const url = await b2.getUploadUrl({
    bucketId: "d52aa6a96808ca0a72de0513",
  });
  return url;
}
module.exports = {
  uploadb2: async function (image, fileName, folder) {
    const auth = await authorize();

    const upload = b2.uploadFile({
      fileName: fileName,

      uploadUrl: auth.data.uploadUrl,
      uploadAuthToken: auth.data.authorizationToken,
      // optional data length, will default to data.byteLength or data.length if not provided
      // optional mime type, will default to 'b2/x-auto' if not provided
      data: image, // this is expecting a Buffer, not an encoded string
      // optional data hash, will use sha1(data) if not provided

      onUploadProgress: (event) => {}, // progress monitoring
      // ...common arguments (optional)
    });
    return upload;
  },
  getPhotos: async function (image, fileName) {
    const auth = await authorize();

    return await b2.listFileNames({
      bucketId: "d52aa6a96808ca0a72de0513",

      maxFileCount: 100,
      delimiter: "",
      prefix: "",
      // ...common arguments (optional)
    }); // returns promise
  },
};
