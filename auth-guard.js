// auth-guard.js
// Include this on any page that should require login (e.g. main.html, history.html, power.html).
// Redirects to login.html if no one is signed in.

import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "./login.html";
  }
});

// Optional: wire this to a "Log out" button anywhere in your UI, e.g.
// <button onclick="logout()">Log out</button>
window.logout = () => {
  signOut(auth).then(() => {
    window.location.href = "./login.html";
  });
};
