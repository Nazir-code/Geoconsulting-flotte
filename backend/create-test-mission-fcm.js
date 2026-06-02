#!/usr/bin/env node
/**
 * Create a Firestore mission to trigger existing FCM Cloud Functions.
 *
 * Does NOT modify Cloud Functions or Firestore structure.
 *
 * Usage:
 *   node create-test-mission-fcm.js --driverUid <UID> [--status pending] [--mode created]
 *
 * Flags:
 *   --driverUid   REQUIRED. Value to set in missions.assignedTo
 *   --status      Optional. Default: pending
 *   --mode        Optional. Default: created
 *                 created: create mission directly with target status
 *                 updated-to-pending: create first with draft then update to pending
 *
 * Notes:
 * - The functions in functions/index.js currently send when status is
 *   in ['pending','in_progress'] and for actionable changes.
 * - This script keeps Firestore payload minimal + required fields.
 */

import admin from 'firebase-admin';
import firebaseAdmin from './firebaseAdmin.js';



function getArg(flag, fallback = undefined) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith('--')) return fallback;
  return val;
}



async function main() {
  console.log('🧪 [create-test-mission-fcm] Starting...');

  const driverUid = getArg('--driverUid');
  const status = getArg('--status', 'pending');
  const mode = getArg('--mode', 'created');

  if (!driverUid) {
    console.error('❌ Missing required flag: --driverUid <UID>');
    console.error('Example: node create-test-mission-fcm.js --driverUid abcd1234 --status pending');
    process.exit(1);
  }

  if (!['created', 'updated-to-pending'].includes(mode)) {
    console.error(`❌ Invalid --mode '${mode}'. Use: created | updated-to-pending`);
    process.exit(1);
  }

  console.log('----------------------------------------');
  console.log(`driverUid: ${driverUid}`);
  console.log(`status:    ${status}`);
  console.log(`mode:      ${mode}`);
  console.log('----------------------------------------');

  console.log('🔧 Initializing Firebase Admin...');
  // firebaseAdmin.js initializes admin on import (side-effect) and exports the instance
  await Promise.resolve(firebaseAdmin);

  const db = admin.firestore();

  // Minimal mission fields (must include assignedTo + status)
  const baseMission = {
    title: 'TEST PUSH NOTIFICATION',
    location: 'Test',
    assignedTo: driverUid,
    status: mode === 'updated-to-pending' ? 'draft' : status,
    // Extra optional fields to help mobile payload display (no schema changes)
    // If your app expects different names, adjust locally without changing structure.
    purpose: 'Test des notifications FCM',
    description: 'Ceci est une mission de test pour valider la pipeline FCM.',
    destination: 'Test',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  console.log('📝 Creating mission...');
  const missionRef = await db.collection('missions').add(baseMission);
  console.log(`✅ missionId: ${missionRef.id}`);

  if (mode === 'updated-to-pending') {
    console.log('⏱️ Waiting a moment before updating status to trigger onDocumentUpdated...');
    await new Promise((r) => setTimeout(r, 1500));

    console.log(`➡️ Updating mission ${missionRef.id} status -> '${status}' ...`);
    await missionRef.update({
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  // Read token presence (best-effort; no structure change)
  console.log('🔎 Checking token presence (best-effort)...');
  const driverDoc = await db.collection('drivers').doc(driverUid).get();
  if (!driverDoc.exists) {
    console.warn(`⚠️ Driver doc not found: /drivers/${driverUid}`);
  } else {
    const d = driverDoc.data() || {};
    const hasFcmToken = typeof d.fcmToken === 'string' && d.fcmToken.trim().length > 0;
    const hasFcmTokens = Array.isArray(d.fcmTokens) && d.fcmTokens.length > 0;

    console.log(`Token fcmToken present: ${hasFcmToken ? 'YES' : 'NO'}`);
    console.log(`Token fcmTokens present: ${hasFcmTokens ? 'YES' : 'NO'}`);

    if (hasFcmToken) {
      console.log(`fcmToken (truncated): ${d.fcmToken.substring(0, 20)}...`);
    }
    if (hasFcmTokens) {
      console.log(`fcmTokens count: ${d.fcmTokens.length}`);
      const first = d.fcmTokens.find(t => typeof t === 'string' && t.trim());
      if (first) console.log(`first fcmTokens (truncated): ${first.substring(0, 20)}...`);
    }
  }

  console.log('----------------------------------------');
  console.log('✅ Done creating mission test.' );
  console.log(`Next steps:`);
  console.log(`1) Check Firebase Functions logs for this missionId: ${missionRef.id}`);
  console.log(`2) Verify mobile device logs (foreground/background/terminated)`);
  console.log('----------------------------------------');

  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});

