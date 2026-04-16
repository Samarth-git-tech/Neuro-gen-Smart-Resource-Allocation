import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC7XrQrAn9tLpDmgcKpi23ksIjQN9-2JVA",
  authDomain: "e-sanyog.firebaseapp.com",
  projectId: "e-sanyog",
  storageBucket: "e-sanyog.firebasestorage.app",
  messagingSenderId: "208684359349",
  appId: "1:208684359349:web:a179fa56b87612a1c228fc",
  measurementId: "G-EXZJ0N6R75"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);