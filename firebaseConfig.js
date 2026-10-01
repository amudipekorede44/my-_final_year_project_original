// firebaseConfig.js
// Shared Firebase setup — imported by login.js and auth-guard.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Replace with the values from Firebase Console -> Project Settings -> Your apps -> Web app
const firebaseConfig = {
  apiKey: "AIzaSyCyuUG7eYY-YAFrTcyH4odbcV0DO-bBtdg",
  authDomain: "my-project-name-7e236.firebaseapp.com",
  databaseURL: "https://my-project-name-7e236-default-rtdb.firebaseio.com",
  projectId: "my-project-name-7e236",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
