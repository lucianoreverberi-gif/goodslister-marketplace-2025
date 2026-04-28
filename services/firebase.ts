import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection successful.');
  } catch (error) {
    console.error('Please check your Firebase configuration.');
  }
}

testConnection();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};
