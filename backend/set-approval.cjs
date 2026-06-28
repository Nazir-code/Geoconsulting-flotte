// Script de TEST : bascule drivers/{uid}.approvalStatus
// Usage : node set-approval.js <uid> <pending|approved|rejected>
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const uid = process.argv[2];
const status = process.argv[3];

(async () => {
  if (!uid || !status) {
    console.error('Usage: node set-approval.js <uid> <pending|approved|rejected>');
    process.exit(1);
  }
  const ref = admin.firestore().collection('drivers').doc(uid);
  const before = (await ref.get()).data() || {};
  console.log(`AVANT : approvalStatus = ${before.approvalStatus ?? '(absent)'}  (name=${before.name})`);
  await ref.set(
    { approvalStatus: status, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
  const after = (await ref.get()).data() || {};
  console.log(`APRÈS : approvalStatus = ${after.approvalStatus}`);
  process.exit(0);
})();
