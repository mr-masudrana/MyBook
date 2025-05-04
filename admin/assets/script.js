// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDCy0UB_zv7Z-PHuuXC6GEcrCV-u0QkSW0",
  authDomain: "registrationapi-1f476.firebaseapp.com",
  databaseURL: "https://registrationapi-1f476-default-rtdb.firebaseio.com",
  projectId: "registrationapi-1f476",
  storageBucket: "registrationapi-1f476.appspot.com",
  messagingSenderId: "409980116764",
  appId: "1:409980116764:web:6151575d4f286853e9e4d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Elements
const form = document.getElementById("adminLoginForm");
const errorDiv = document.getElementById("loginError");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  // Only allow emails ending with "@mybook.com"
  if (!email.endsWith("@mybook.com")) {
    showError("Only for Admin!");
    return;
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Login failed:", error.message);
    showError("Invalid email or password");
  }
});

// Show alert with auto close
function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove("d-none");

  setTimeout(() => {
    errorDiv.classList.add("d-none");
  }, 5000);
}