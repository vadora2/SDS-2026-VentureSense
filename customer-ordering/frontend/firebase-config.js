// customer-ordering/frontend/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "PASTE_YOURS_HERE",
  authDomain: "PASTE_YOURS_HERE",
  projectId: "PASTE_YOURS_HERE",
  storageBucket: "PASTE_YOURS_HERE",
  messagingSenderId: "PASTE_YOURS_HERE",
  appId: "PASTE_YOURS_HERE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
};