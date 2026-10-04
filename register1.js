// register.js
// Use this on your registration page (index3.html) so login.html actually
// has real accounts to authenticate against.
// Expects a form with #reg-username and #reg-password inputs (adjust ids to match your markup).

import { auth } from "./firebaseConfig.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const AUTH_DOMAIN_SUFFIX = "@smartroom.local"; // must match login.js exactly

const form = document.querySelector("form");
const usernameInput = document.getElementById("reg-username");
const passwordInput = document.getElementById("reg-password");
const confirmInput = document.getElementById("reg-confirm-password");
const submitBtn = document.querySelector(".btn");

// Setup password visibility toggles
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

const errorBox = document.createElement("div");
errorBox.style.cssText = "color:#ff5c5c; font-size:0.85rem; margin:8px 0; display:none;";
form.insertBefore(errorBox, submitBtn);

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.style.display = "none";

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const confirm = confirmInput ? confirmInput.value : password;

  if (!username || password.length < 6) {
    showError("Username required, password must be at least 6 characters.");
    return;
  }

  if (password !== confirm) {
    showError("Passwords do not match.");
    return;
  }

  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = "CREATING ACCOUNT...";

  const internalEmail = `${username.toLowerCase()}${AUTH_DOMAIN_SUFFIX}`;

  try {
    await createUserWithEmailAndPassword(auth, internalEmail, password);
    // Account created — send them to log in with their new credentials
    window.location.href = "./login.html";
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      showError("That username is already taken.");
    } else if (error.code === "auth/weak-password") {
      showError("Password is too weak — use at least 6 characters.");
    } else {
      showError("Could not create account. Please try again.");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
});
