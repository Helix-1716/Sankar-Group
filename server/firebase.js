const admin = require('firebase-admin');
const path = require('path');

let serviceAccount;
try {
  serviceAccount = require(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, 'serviceAccountKey.json')
  );
} catch (err) {
  console.error(
    '\n⚠️  Firebase service account key not found!\n' +
    '   Place your serviceAccountKey.json in the server/ directory.\n' +
    '   Download it from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key\n'
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
