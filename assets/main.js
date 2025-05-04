// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDatabase, ref, push, set, onChildAdded, onValue, get, query, orderByChild } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

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
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const userEmailEl = document.getElementById("userEmail");
const fullNameEl = document.getElementById("fullName");
const profilePicEl = document.getElementById("profilePic");
const feed = document.getElementById("feed");
const loadingSpinner = document.getElementById("loadingSpinner");

let currentUser = null;

// Auth State
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    userEmailEl.innerText = user.email;

    const userSnap = await get(ref(db, `users/${user.uid}`));
    if (userSnap.exists()) {
      const userInfo = userSnap.val();
      const fullName = `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim();
      fullNameEl.innerText = fullName || "User";
      profilePicEl.src = userInfo.profilePic || "https://via.placeholder.com/50";
    }

    loadPosts();
  } else {
    window.location.href = "signin.html";
  }
});

// Logout
window.logout = function () {
  signOut(auth).then(() => window.location.href = "signin.html");
};

// Create Post
window.createPost = async function () {
  const content = document.getElementById("postContent").value.trim();
  const imageFile = document.getElementById("postImage").files[0];
  if (!content && !imageFile) return;

  let imageUrl = null;

  if (imageFile) {
    if (!imageFile.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", "MyData");

    try {
      const response = await fetch("https://api.cloudinary.com/v1_1/dtkbdxhft/image/upload", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      imageUrl = data.secure_url;
    } catch (error) {
      alert("Image upload failed");
      return;
    }
  }

  const userSnap = await get(ref(db, `users/${currentUser.uid}`));
  const userInfo = userSnap.exists() ? userSnap.val() : {};

  const postRef = ref(db, "posts");
  push(postRef, {
    content,
    user: currentUser.email,
    userId: currentUser.uid,
    timestamp: Date.now(),
    imageUrl,
    profilePic: userInfo.profilePic || null
  });

  document.getElementById("postContent").value = "";
  document.getElementById("postImage").value = "";
};

// Load Posts
function loadPosts() {
  const postsRef = query(ref(db, "posts"), orderByChild("timestamp"));

  onChildAdded(postsRef, async (snapshot) => {
    loadingSpinner.style.display = "none";

    const post = snapshot.val();
    const postId = snapshot.key;

    const userSnap = await get(ref(db, `users/${post.userId}`));
    const userInfo = userSnap.exists() ? userSnap.val() : {};
    const fullName = `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim();
    const email = post.user || "Unknown";

    const postDiv = document.createElement("div");
    postDiv.className = "card mb-3 p-3";
    postDiv.setAttribute("data-aos", "fade-up");

    postDiv.innerHTML = `
      <div class="d-flex align-items-center mb-2">
        <img src="${post.profilePic || 'https://via.placeholder.com/40'}" class="rounded-circle me-2" style="width: 40px; height: 40px;">
        <div>
          <a class="text-decoration-none" href="profile.html?uid=${post.userId}"><strong>${fullName || "User"}</strong></a><br>
          <small class="text-muted">${email}</small>
        </div>
      </div>
      <p>${post.content}</p>
      ${post.imageUrl ? `<img src="${post.imageUrl}" class="img-fluid my-2 rounded">` : ""}
      <small class="text-muted">${formatDateTime(post.timestamp)}</small>
      <hr>
      <div class="d-flex justify-content-between">
        <div class="d-flex align-items-center mt-2">
          <button class="btn btn-sm btn-outline-primary me-2 like-btn" id="like-${postId}">
            <i class="bi bi-hand-thumbs-up-fill"></i> Like
          </button>
          <span id="like-count-${postId}" class="text-muted small">0 Likes</span>
        </div>
        <div class="mt-2">
          <button class="btn btn-sm btn-outline-secondary toggle-comments" data-post-id="${postId}">
            <i class="bi bi-chat-left-dots"></i> Comments
          </button>
          <small id="comment-count-${postId}" class="text-muted ms-2">0 Comments</small>
        </div>
      </div>
        <div class="mt-2">
          <div id="comments-${postId}" class="mt-2 d-none">
            <div id="comment-list-${postId}" class="mb-2"></div>
            <div class="input-group">
              <input type="text" class="form-control" placeholder="Write a comment..." id="comment-input-${postId}">
              <button class="btn btn-primary" id="comment-btn-${postId}">Post</button>
            </div>
          </div>
        </div>
      </div>
    `;
    feed.prepend(postDiv);

    // Likes
    const likeBtn = document.getElementById(`like-${postId}`);
    const likeCountEl = document.getElementById(`like-count-${postId}`);
    const likePath = `likes/${postId}`;

    const updateLikeButton = async () => {
      const likeSnap = await get(ref(db, `${likePath}/${currentUser.uid}`));
      if (likeSnap.exists()) {
        likeBtn.classList.replace("btn-outline-primary", "btn-primary");
      } else {
        likeBtn.classList.replace("btn-primary", "btn-outline-primary");
      }

      const allLikes = await get(ref(db, likePath));
      likeCountEl.innerText = `${allLikes.exists() ? Object.keys(allLikes.val()).length : 0} Likes`;
    };

    likeBtn.addEventListener("click", async () => {
      const userLikeRef = ref(db, `${likePath}/${currentUser.uid}`);
      const liked = await get(userLikeRef);
      set(userLikeRef, liked.exists() ? null : true);
      updateLikeButton();
    });

    updateLikeButton();

    // Comments
    const commentListEl = document.getElementById(`comment-list-${postId}`);
    const commentBoxEl = document.getElementById(`comments-${postId}`);
    const toggleBtn = postDiv.querySelector(`.toggle-comments`);
    const inputEl = document.getElementById(`comment-input-${postId}`);
    const btnEl = document.getElementById(`comment-btn-${postId}`);
    const commentCountEl = document.getElementById(`comment-count-${postId}`);

    toggleBtn.addEventListener("click", () => {
      commentBoxEl.classList.toggle("d-none");
    });

    const commentsRef = ref(db, `comments/${postId}`);
    onChildAdded(commentsRef, (snap) => {
      const c = snap.val();
      const commentDiv = document.createElement("div");
      commentDiv.className = "border p-2 rounded mb-1 bg-light";
      commentDiv.innerHTML = `<a class="text-decoration-none" href="profile.html?uid=${post.userId}"><strong>${c.user || "User"}:</strong></a> <small>${c.text}</small>`;
      commentListEl.appendChild(commentDiv);
      updateCommentCount(postId);
    });

    btnEl.addEventListener("click", async () => {
      const text = inputEl.value.trim();
      if (!text) return;
      const userSnap = await get(ref(db, `users/${currentUser.uid}`));
      const userInfo = userSnap.exists() ? userSnap.val() : {};
      const fullName = `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim();

      await push(ref(db, `comments/${postId}`), {
        user: fullName || currentUser.email,
        userId: currentUser.uid,
        text,
        timestamp: Date.now()
      });
      inputEl.value = "";
    });
  });
}

// Update Comment Count
function updateCommentCount(postKey) {
  get(ref(db, `comments/${postKey}`)).then(snapshot => {
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    const el = document.getElementById(`comment-count-${postKey}`);
    if (el) el.innerText = `${count} Comment${count !== 1 ? 's' : ''}`;
  });
}

// Format Timestamp
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString('default', { month: 'short' });
  const year = String(date.getFullYear()).slice(-2);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

// Back to Top
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  backToTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
});
backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Search Bar 
const searchUserInput = document.getElementById("searchUserInput");
const userSearchResults = document.getElementById("userSearchResults");
const clearSearchBtn = document.getElementById("clearSearchBtn");

searchUserInput.addEventListener("input", async () => {
  const query = searchUserInput.value.toLowerCase().trim();
  userSearchResults.innerHTML = "";
  userSearchResults.classList.add("d-none");
  clearSearchBtn.classList.toggle("d-none", !query);

  if (!query) return;

  const usersRef = ref(db, "users");
  const snap = await get(usersRef);

  if (snap.exists()) {
    const users = snap.val();
    let matches = 0;
    Object.keys(users).forEach((uid) => {
      const user = users[uid];
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase();
      if (fullName.includes(query)) {
        matches++;
        const item = document.createElement("a");
        item.href = `profile.html?uid=${uid}`;
        item.className = "dropdown-item d-flex align-items-center";
        item.innerHTML = `
          <img src="${user.profilePic || 'https://via.placeholder.com/40'}" class="rounded-circle me-2" width="30" height="30">
          <div>
            <div><strong>${user.firstName || ""} ${user.lastName || ""}</strong></div>
            <small class="text-muted">${user.email || ""}</small>
          </div>
        `;
        userSearchResults.appendChild(item);
      }
    });
    if (matches > 0) userSearchResults.classList.remove("d-none");
  }
});

// Clear button functionality
clearSearchBtn.addEventListener("click", () => {
  searchUserInput.value = "";
  userSearchResults.innerHTML = "";
  userSearchResults.classList.add("d-none");
  clearSearchBtn.classList.add("d-none");
});