const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

functions.storage.object().onFinalize(data => {
    console.log(data);
});
