// lib/firestoreService.ts
// Service Firestore pour opérations générales

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  onSnapshot,
  Unsubscribe,
  QuerySnapshot,
  DocumentData,
  serverTimestamp,
  FieldValue,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Service général Firestore
 * Fournit des opérations CRUD communes
 */
export class FirestoreService {
  /**
   * Créer ou mettre à jour un document
   */
  static async setDocument<T extends DocumentData>(
    path: string,
    data: T,
    merge: boolean = false
  ): Promise<void> {
    await setDoc(doc(db, path), data, { merge });
  }

  /**
   * Obtenir un document
   */
  static async getDocument<T extends DocumentData>(
    path: string
  ): Promise<T | null> {
    const snapshot = await getDoc(doc(db, path));
    return (snapshot.exists() ? snapshot.data() : null) as T | null;
  }

  /**
   * Mettre à jour un document (merge)
   */
  static async updateDocument(
    path: string,
    data: Partial<DocumentData>
  ): Promise<void> {
    await updateDoc(doc(db, path), data);
  }

  /**
   * Supprimer un document
   */
  static async deleteDocument(path: string): Promise<void> {
    await deleteDoc(doc(db, path));
  }

  /**
   * Écouter un document en temps réel
   */
  static onSnapshot<T extends DocumentData>(
    path: string,
    callback: (data: T | null) => void
  ): Unsubscribe {
    return onSnapshot(doc(db, path), (snapshot) => {
      callback((snapshot.exists() ? snapshot.data() : null) as T | null);
    });
  }

  /**
   * Écouter une collection en temps réel
   */
  static onCollectionSnapshot<T extends DocumentData>(
    collectionName: string,
    constraints: any[] = [],
    callback: (docs: (T & { id: string })[]) => void
  ): Unsubscribe {
    const q = query(collection(db, collectionName), ...constraints);
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as T & { id: string }));
      callback(docs);
    });
  }

  /**
   * Retourne un serverTimestamp Firebase (écrit par le serveur, cohérent cross-platform)
   */
  static getServerTimestamp(): FieldValue {
    return serverTimestamp();
  }
}

export default FirestoreService;
