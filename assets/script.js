// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDCy0UB_zv7Z-PHuuXC6GEcrCV-u0QkSW0",
  authDomain: "registrationapi-1f476.firebaseapp.com",
  databaseURL: "https://registrationapi-1f476-default-rtdb.firebaseio.com",
  projectId: "registrationapi-1f476",
  storageBucket: "registrationapi-1f476.appspot.com",
  messagingSenderId: "409980116764",
  appId: "1:409980116764:web:6151575d4f286853e9e4d9",
  measurementId: "G-HPGT35JC8T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

document.addEventListener("DOMContentLoaded", () => {

  // Register Form
  const registerForm = document.getElementById('registrationForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const birth = document.getElementById('birth').value;
      const gender = document.getElementById('gender').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await set(ref(database, 'users/' + user.uid), {
          firstName,
          lastName,
          email,
          phone,
          birth,
          gender,
          createdAt: new Date().toISOString()
        });

        alert('Registration successful!');
        registerForm.reset();
        window.location.href = "index.html"; // Redirect to homepage or dashboard

      } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
      }
    });
  }

  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Login successful!');
        window.location.href = "index.html"; // Or dashboard.html

      } catch (error) {
        console.error(error);
        alert("Login failed: " + error.message);
      }
    });
  }

});