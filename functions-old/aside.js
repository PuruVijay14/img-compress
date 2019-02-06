const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const imagemin = require("imagemin");
const imageminPngQuant = require("imagemin-pngquant");
const fs = require("fs-extra");
const { tmpdir } = require("os");

const { join, dirname } = require("path");

const storage = new Storage();

admin.initializeApp();

/* const compress = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const storage = gcs.Storage

    for (let i = 0; i < req.body.filePaths.length; i++) {
      const file = req.body.filePaths[i];
      try {
        const ref = await storage.storage;
        // const compressed = await imagemin(ref.)
      } catch (e) {
        console.log(e);
      }
    }


    const response = {
      id: '1',
    };

    return res.json(response);

  });
}); */
const compress = functions.storage.object().onFinalize(async object => {
  const bucket = storage.bucket(object.bucket);
  const filePath = object.name;
  const fileName = filePath.split("/").pop();

  const bucketDir = dirname(filePath);

  const workingDir = join(tmpdir(), "thumbs");
  const tmpFilePath = join(workingDir, "source.png");

  if (fileName.includes("thumb@") || !object.contentType.includes("image")) {
    return false;
  }

  // 1. Ensure thumbnail dir exists
  await fs.ensureDir(workingDir);

  // 2. Download source file
  await bucket.file(filePath).download({
    destination: tmpFilePath
  });

  // 3. Compress Image
  const thumbName = `thumb@${fileName}`;
  const thumbPath = join(workingDir, thumbName);

  const uploadPromise = await imagemin([tmpFilePath], thumbPath, {
    plugins: [
      imageminPngQuant({
        quality: [0.6, 0.8]
      })
    ]
  });

  // Upload to GCS
  await bucket.upload(thumbPath, {
    destination: join(bucketDir, thumbName)
  });

  console.log(uploadPromise);
  return fs.remove(workingDir);
  /*
  // 3. Resize the images and define an array of upload promises
  const sizes = [64, 128, 256];
  const uploadPromises = sizes.map(async size => {
    const thumbName = `thumb@${size}_${fileName}`;
    const thumbPath = join(workingDir, thumbName);

    // Resize source image
    await sharp(tmpFilePath)
      .resize(size, size)
      .toFile(thumbPath);

    // Upload to GCS
    return bucket.upload(thumbPath, {
      destination: join(bucketDir, thumbName)
    });
  });

  // 4. Run the upload operations
  await Promise.all(uploadPromises);

  // 5. Cleanup remove the tmp/thumbs from the filesystem
  return fs.remove(workingDir);
 */
});
exports.compress = compress;
