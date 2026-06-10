// customer-ordering/frontend/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyABC9PkFRyEf3G5MVoN3m6whJY0Z7Q1ydA",
  authDomain: "sds-venturesense-team5-375e9.firebaseapp.com",
  projectId: "sds-venturesense-team5-375e9",
  storageBucket: "sds-venturesense-team5-375e9.firebasestorage.app",
  messagingSenderId: "1096293683878",
  appId: "1:1096293683878:web:cedb1b5b8b9841cbbd9a67",
  measurementId: "G-SNFND5SSE6"
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
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
};
