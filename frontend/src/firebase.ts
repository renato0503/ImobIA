import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAYCrHRbskUcdPIr3MwoJYyp66EnqY0Rrk',
  authDomain: 'imobia-65bda.firebaseapp.com',
  projectId: 'imobia-65bda',
  storageBucket: 'imobia-65bda.firebasestorage.app',
  messagingSenderId: '142147893778',
  appId: '1:142147893778:web:271ba2f1cc6596d234b6cb',
  measurementId: 'G-DHJRG2P28X',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
