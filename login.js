// login.js
// Handles the login.html form: turns "username" into an internal email,
// authenticates against Firebase, redirects to main.html on success,
// shows "Not registered" on failure.

import { auth } from "./firebaseConfig.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Fixed domain used only internally to turn a username into a Firebase-compatible email.
// The user never sees or types this.
const AUTH_DOMAIN_SUFFIX = "@smartroom.local";

const form = document.querySelector("form");
const usernameInput = document.getElementById("name");
const passwordInput = document.getElementById("password");
const submitBtn = document.querySelector(".btn");

// Setup password visibility toggle
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const container = btn.closest(".password-wrap") || btn.parentElement;
    const input = container.querySelector("input");
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    btn.classList.toggle("is-visible", isPassword);
    btn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    btn.setAttribute("title", isPassword ? "Hide password" : "Show password");
    input.focus();
  });
});

// Create (once) a small error message element, placed just above the Sign In button
const errorBox = document.createElement("div");
errorBox.className = "login-error";
errorBox.style.cssText =
  "color:#ff5c5c; font-size:0.85rem; margin:8px 0; min-height:1em; display:none;";
form.insertBefore(errorBox, submitBtn);

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
}

function clearError() {
  errorBox.style.display = "none";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showError("Please enter both username and password.");
    return;
  }

  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = "SIGNING IN...";

  const internalEmail = `${username.toLowerCase()}${AUTH_DOMAIN_SUFFIX}`;

  try {
    await signInWithEmailAndPassword(auth, internalEmail, password);
    // Success — go to the dashboard
    window.location.href = "./frontend/main.html";
  } catch (error) {
    console.error("Login error:", error.code);

    // Newer Firebase versions collapse "wrong password" and "no such user" into
    // one generic code (auth/invalid-credential) on purpose, to stop attackers
    // from figuring out which usernames exist. We show one message for all of them.
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      showError("Not registered — check your username and password.");
    } else if (error.code === "auth/too-many-requests") {
      showError("Too many attempts. Please wait a moment and try again.");
    } else {
      showError("Something went wrong. Please try again.");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
});
