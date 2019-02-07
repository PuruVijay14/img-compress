import * as functions from "firebase-functions";
import { storage, initializeApp } from "firebase-admin";
import { tmpdir } from "os";
import { join, normalize } from "path";

import * as imagemin from "imagemin";
import imageminPngquant from "imagemin-pngquant";
import { unlink } from "fs";

initializeApp(functions.config().firebase);

const compress = functions.storage.object().onFinalize(async object => {
    const fileName = `${object.name}`;
    const bucket = storage().bucket(object.bucket);
    const minFileName = `min@${fileName}`;
    const tmpFile = join(tmpdir(), minFileName);
    const metadata = object.metadata;
    // If the newly created file is minified, stop the function
    if (fileName.startsWith('@min')) {
        console.log(`Already minified.`);
        return null;
    }

    // Download the file
    await bucket.file(fileName).download({
        destination: tmpFile
    });

    // Now minify
    const files = await imagemin([tmpFile], tmpdir(), {
        plugins: [
            imageminPngquant({
                quality: [0.1, 0.8]
            })
        ]
    });

    console.log(metadata);

    // Now upload
    await bucket.upload(normalize(tmpFile), {
        gzip: true
    });

    await bucket.file(fileName).delete();

    // Delete the tmpdir
    return unlink(tmpFile, err => console.log(err));

});

export { compress }