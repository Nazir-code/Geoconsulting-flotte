/**
 * Test E2E "Terminer la mission".
 * Usage:
 *   node test_complete_flow.cjs setup   → crée + active une mission (in_progress)
 *   node test_complete_flow.cjs check   → affiche l'état actuel de la mission
 *   node test_complete_flow.cjs cleanup → supprime la mission de test
 */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const DRIVER_UID = '2rPIVhq8gpavE86PBGr3A97OKfh2';
const MISSION_ID = 'TEST_TERMINER_FLOW_001';

async function setup() {
  const ref = db.collection('missions').doc(MISSION_ID);
  await ref.set({
    title: 'Mission Test Terminer',
    description: 'E2E test du bouton Terminer la mission',
    location: 'Niamey Centre, Niger',
    priority: 'medium',
    status: 'in_progress',          // déjà en cours → bouton Terminer actif
    assignedTo: DRIVER_UID,
    createdBy: 'test-script',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  // Marquer cette mission comme la mission active du chauffeur
  await db.collection('drivers').doc(DRIVER_UID).set({
    currentMission: MISSION_ID,
    status: 'online',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log('✅ SETUP terminé');
  console.log('   Mission:', MISSION_ID, '→ status=in_progress, assignedTo=' + DRIVER_UID);
  console.log('   drivers/' + DRIVER_UID + '.currentMission =', MISSION_ID);
  console.log('   → Sur le mobile : ouvrir Carte/Tracking, le bouton "TERMINER LA MISSION" doit être visible.');
}

async function check() {
  const m = await db.collection('missions').doc(MISSION_ID).get();
  const d = await db.collection('drivers').doc(DRIVER_UID).get();
  if (!m.exists) { console.log('❌ Mission introuvable'); return; }
  const md = m.data();
  console.log('📋 ÉTAT MISSION', MISSION_ID);
  console.log('   status        :', md.status);
  console.log('   completedAt   :', md.completedAt ? md.completedAt.toDate().toISOString() : '(non défini)');
  console.log('   updatedAt     :', md.updatedAt ? md.updatedAt.toDate().toISOString() : '(non défini)');
  console.log('   driver.currentMission :', d.data()?.currentMission ?? '(null)');
  if (md.status === 'completed' && md.completedAt) {
    console.log('\n🎉 SUCCÈS : mission marquée "completed" avec completedAt serveur.');
  } else {
    console.log('\n⏳ En attente : la mission n\'est pas encore terminée.');
  }
}

async function cleanup() {
  await db.collection('missions').doc(MISSION_ID).delete();
  await db.collection('drivers').doc(DRIVER_UID).set({
    currentMission: null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('🧹 CLEANUP : mission de test supprimée, currentMission remis à null.');
}

const cmd = process.argv[2];
const fn = { setup, check, cleanup }[cmd];
if (!fn) { console.log('Usage: node test_complete_flow.cjs [setup|check|cleanup]'); process.exit(1); }
fn().then(() => process.exit(0)).catch((e) => { console.error('❌', e.message); process.exit(1); });
