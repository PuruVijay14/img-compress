import { storage } from "firebase-admin";
import * as functions from "firebase-functions";
import { mkdir, unlinkSync } from "fs";
import { tmpdir } from "os";
import { basename, dirname, extname, join } from "path";
import imagemin = require("imagemin");
const imagePngQuant = require("imagemin-pngquant");

const compress = functions.storage.object().onFinalize(async object => {
  const filePath = `${object.name}`;
  const baseFileName = basename(filePath, extname(filePath));
  const fileDir = dirname(filePath);
  const tempLocalFile = join(tmpdir(), `min@${filePath}`);
  const tempLocalDir = dirname(tempLocalFile);
  const metadata = object.metadata;

  const bucket = storage().bucket(object.bucket);

  // Exit if this is triggered on a minified image
  if (filePath.startsWith("min@")) {
    return null;
  }

  // Create the temp directory where the storage file will be downloaded
  mkdir(tempLocalDir, async error => {
    if (error) {
      console.log(error);
      return;
    }

    // Download file from bucket
    await bucket.file(filePath).download({ destination: tempLocalFile });
    console.log(`The file has been downloaded to ${tempLocalFile}`);

    // Compress the image
    await imagemin([tempLocalFile], tempLocalDir, {
      plugins: [
        imagePngQuant({
          quality: [0.6, 0.8]
        })
      ]
    });

    // Upload
    await bucket.upload(tempLocalFile);
    
    unlinkSync(tempLocalFile);

    return null;

  });
});

export { compress };
