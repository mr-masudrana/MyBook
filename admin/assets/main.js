// Firebase config (replace with your config)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let chart; // chart reference

// Auth check for admin
onAuthStateChanged(auth, (user) => {
  if (!user || user.email !== "admin@mybook.com") {
    window.location.href = "login.html";
  }
});

// Logout function
document.getElementById("logoutLink").addEventListener("click", (event) => {
  event.preventDefault();
  const auth = getAuth();
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    console.error("Logout failed", error);
  });
});

// Load everything after DOM ready
document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  loadPosts();
  loadMessages();
  initChart();
});

// Initialize Chart.js
function initChart() {
  const ctx = document.getElementById("growthChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Users", "Posts", "Messages"],
      datasets: [{
        label: "Count",
        data: [0, 0, 0],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        fill: true,
      }]
    },
    options: {
      responsive: true,
    }
  });
}

// Load Users
function loadUsers() {
  const usersRef = ref(db, "users");
  onValue(usersRef, (snapshot) => {
    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "";
    let count = 0;

    snapshot.forEach(child => {
      const user = child.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${child.key}</td>
        <td>${user.name || ""}</td>
        <td>${user.email || ""}</td>
      `;
      tbody.appendChild(tr);
      count++;
    });

    document.getElementById("totalUsers").textContent = count;
    updateChart(0, count);
    initializeDataTable("usersTable");
    checkLoadingDone();
  });
}

// Load Posts
function loadPosts() {
  const postsRef = ref(db, "posts");
  onValue(postsRef, (snapshot) => {
    const tbody = document.querySelector("#postsTable tbody");
    tbody.innerHTML = "";
    let count = 0;

    snapshot.forEach(child => {
      const post = child.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${post.userId || ""}</td>
        <td>${post.content || ""}</td>
        <td>${new Date(post.timestamp || Date.now()).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
      count++;
    });

    document.getElementById("totalPosts").textContent = count;
    updateChart(1, count);
    initializeDataTable("postsTable");
    checkLoadingDone();
  });
}

// Load Messages
function loadMessages() {
  const messagesRef = ref(db, "contactMessages"); // Updated path
  onValue(messagesRef, (snapshot) => {
    const tbody = document.querySelector("#messagesTable tbody");
    tbody.innerHTML = "";
    let count = 0;

    snapshot.forEach(child => {
      const msg = child.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${msg.name || ""}</td>
        <td>${msg.email || ""}</td>
        <td>${msg.subject || ""}</td>
        <td>${msg.message || ""}</td>
        <td>${new Date(msg.timestamp || Date.now()).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
      count++;
    });

    document.getElementById("totalMessages").textContent = count;
    updateChart(2, count);
    initializeDataTable("messagesTable");
    checkLoadingDone();
  });
}

// Update chart dataset
function updateChart(index, value) {
  if (chart) {
    chart.data.datasets[0].data[index] = value;
    chart.update();
  }
}

// Initialize DataTables
function initializeDataTable(tableId) {
  const table = $(`#${tableId}`);
  if ($.fn.DataTable.isDataTable(table)) {
    table.DataTable().clear().destroy();
  }

  table.DataTable({
    pageLength: 10,
    responsive: true,
    dom: 'Bfrtip',
    buttons: [
      { extend: 'excelHtml5', className: 'btn btn-success' },
      { extend: 'csvHtml5', className: 'btn btn-primary' },
      { extend: 'pdfHtml5', className: 'btn btn-danger', orientation: 'landscape', pageSize: 'A4' }
    ]
  });
}

// Spinner hiding logic
let loadCounter = 0;
function checkLoadingDone() {
  loadCounter++;
  if (loadCounter >= 3) {
    document.getElementById("loadingSpinner").style.display = "none";
  }
}