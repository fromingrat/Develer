import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAbaXVwa2v5WUupKpysCWObXQ14dId8ivI",
  authDomain: "noir-form-store.firebaseapp.com",
  projectId: "noir-form-store",
  storageBucket: "noir-form-store.firebasestorage.app",
  messagingSenderId: "351164394730",
  appId: "1:351164394730:web:7d384350bcb1f8e9907b93"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
