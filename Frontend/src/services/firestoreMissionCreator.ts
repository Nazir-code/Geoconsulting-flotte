// services/firestoreMissionCreator.ts
// Service pour créer des missions directement dans Firestore avec synchronisation des UIDs

import { collection, query, where, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { FirestoreMissionService, type Mission } from './firestoreMissionService';

/**
 * Trouver un driver par email et retourner son UID Firebase
 * Cela garantit que le driverId utilisé dans la mission correspond au UID réel
 */
export async function findDriverUidByEmail(email: string): Promise<string | null> {
  try {
    const driversRef = collection(db, 'drivers');
    const q = query(driversRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.warn(`❌ Driver avec email "${email}" non trouvé dans Firestore`);
      return null;
    }
    
    const uid = querySnapshot.docs[0].id;
    console.log(`✅ Driver trouvé: ${email} -> UID: ${uid}`);
    return uid;
  } catch (error) {
    console.error('Erreur lors de la recherche du driver:', error);
    return null;
  }
}

/**
 * Trouver un driver par son UID et vérifier qu'il existe
 */
export async function verifyDriverExists(uid: string): Promise<boolean> {
  try {
    const driverRef = doc(db, 'drivers', uid);
    const driverDoc = await getDocs(query(collection(db, 'drivers'), where('uid', '==', uid)));
    return !driverDoc.empty;
  } catch (error) {
    console.error('Erreur lors de la vérification du driver:', error);
    return false;
  }
}

/**
 * Créer une mission Firestore avec vérification du UID du driver
 * 
 * IMPORTANT: Cette fonction s'assure que assignedTo = uid Firebase réel du driver
 * et pas un ID mock du système
 */
export async function createMissionWithFirebaseUid(
  driverEmail: string,
  location: string,
  title: string,
  description: string,
  priority: 'low' | 'medium' | 'high' = 'medium',
  createdBy: string = 'admin'
): Promise<{ success: boolean; missionId?: string; error?: string }> {
  try {
    console.log(`📋 [MissionCreator] Création de mission pour: ${driverEmail}`);
    
    // 1. Trouver l'UID Firebase du driver par son email
    const driverUid = await findDriverUidByEmail(driverEmail);
    
    if (!driverUid) {
      return {
        success: false,
        error: `❌ Driver "${driverEmail}" non trouvé. Assurez-vous qu'il est connecté une première fois.`,
      };
    }
    
    console.log(`✅ UID driver trouvé: ${driverUid}`);
    
    // 2. Créer la mission avec le bon UID
    const timestamp = Timestamp.now();
    const missionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const missionData = {
      id: missionId,
      title,
      description,
      location,
      priority,
      assignedTo: driverUid, // ✅ UID FIREBASE, pas ID mock!
      createdBy,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    // 3. Insérer dans Firestore
    const missionRef = doc(db, 'missions', missionId);
    await setDoc(missionRef, missionData);
    
    console.log(`✅ [MissionCreator] Mission créée avec succès!`);
    console.log(`   ID: ${missionId}`);
    console.log(`   Assignée à (UID): ${driverUid}`);
    console.log(`   Destination: ${location}`);
    
    return {
      success: true,
      missionId,
    };
  } catch (error) {
    console.error('❌ Erreur création mission:', error);
    return {
      success: false,
      error: `Erreur lors de la création: ${error instanceof Error ? error.message : 'Inconnue'}`,
    };
  }
}

/**
 * Lister tous les drivers dans Firestore avec leurs emails et UIDs
 * Utile pour faire un mapping manuel
 */
export async function listAllDriversInFirestore(): Promise<
  Array<{ uid: string; email: string; name: string; status: string }>
> {
  try {
    const driversRef = collection(db, 'drivers');
    const querySnapshot = await getDocs(driversRef);
    
    const drivers = querySnapshot.docs.map(doc => ({
      uid: doc.id,
      email: (doc.data().email || '').toLowerCase(),
      name: doc.data().name || 'Sans nom',
      status: doc.data().status || 'unknown',
    }));
    
    console.log('📋 Drivers dans Firestore:', drivers);
    return drivers;
  } catch (error) {
    console.error('Erreur lors du listing des drivers:', error);
    return [];
  }
}

/**
 * DEBUG: Afficher l'état de synchronisation web/mobile
 */
export async function debugMissionSync(): Promise<void> {
  try {
    console.log('\n🔍 DEBUG SYNCHRONISATION WEB/MOBILE\n');
    
    // Lister les drivers
    const drivers = await listAllDriversInFirestore();
    console.log('Drivers disponibles:');
    drivers.forEach(d => {
      console.log(`  - ${d.name} (${d.email}) | UID: ${d.uid} | Status: ${d.status}`);
    });
    
    // Lister les missions
    const missionsRef = collection(db, 'missions');
    const querySnapshot = await getDocs(missionsRef);
    console.log(`\nMissions dans Firestore (${querySnapshot.size} total):`);
    querySnapshot.docs.forEach(doc => {
      const m = doc.data();
      console.log(`  - ${m.title} | assignedTo: ${m.assignedTo} | status: ${m.status}`);
    });
    
    console.log('\n✅ DEBUG terminé\n');
  } catch (error) {
    console.error('Erreur debug:', error);
  }
}
