
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBYpaLgPzCBvGSJn5wcfUItmdOQMzMbO8k",
  authDomain: "skolarupdb.firebaseapp.com",
  databaseURL: "https:
  projectId: "skolarupdb",
  storageBucket: "skolarupdb.firebasestorage.app",
  messagingSenderId: "659572301315",
  appId: "1:659572301315:web:917b095c1909f13bc1f836",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

