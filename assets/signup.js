// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Your Firebase configuration
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

// Form Submit
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const birth = document.getElementById('brith').value;
  const gender = document.getElementById('gender').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }

  try {
    // Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save extra data to Realtime Database
    await set(ref(database, 'users/' + user.uid), {
      firstName,
      lastName,
      email,
      phone,
      birth,
      gender,
      createdAt: new Date().toISOString()
    });

    alert('Registration Successful!');
    document.getElementById('registrationForm').reset();
    window.location.href = "index.html";
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});