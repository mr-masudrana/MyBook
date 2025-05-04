// Firebase Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDatabase, ref, push, update, get, set, onChildAdded } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

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

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;

// DOM Elements
const userEmail = document.getElementById("userEmail");
const profilePreview = document.getElementById("profilePreview");
const myPosts = document.getElementById("myPosts");

// Get UID from URL
const urlParams = new URLSearchParams(window.location.search);
const targetUid = urlParams.get("uid");

// Load User Data
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "signin.html";
    return;
  }

  currentUser = user;
  const uidToLoad = targetUid || user.uid;
  const isOwnProfile = uidToLoad === user.uid;

  const userRef = ref(db, `users/${uidToLoad}`);
  const snap = await get(userRef);

  if (snap.exists()) {
    const userData = snap.val();
    const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();

    profilePreview.src = userData.profilePic || "https://via.placeholder.com/150";
    document.getElementById("fullName").innerText = fullName || "N/A";
    userEmail.innerText = userData.email || "N/A";
    document.getElementById("phone").innerText = userData.phone || "N/A";
    document.getElementById("birth").innerText = userData.birth || "N/A";
    document.getElementById("gender").innerText = userData.gender || "N/A";

    loadMyPosts(userData.email);

    if (!isOwnProfile) {
      document.getElementById("editControls")?.classList.add("d-none");
      document.getElementById("editProfile")?.classList.add("d-none");
    }
  } else {
    alert("User not found.");
    window.location.href = "index.html";
  }
});

// Logout
window.logout = function () {
  signOut(auth).then(() => window.location.href = "signin.html");
};

// Upload Profile Image
window.uploadProfileImage = async function () {
  const file = document.getElementById("profileImage").files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "MyData");

  try {
    const response = await fetch("https://api.cloudinary.com/v1_1/dtkbdxhft/image/upload", {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    const imageUrl = data.secure_url;

    await update(ref(db, `users/${auth.currentUser.uid}`), {
      profilePic: imageUrl
    });

    profilePreview.src = imageUrl;
    alert("Profile picture updated!");

    const userSnap = await get(ref(db, `users/${auth.currentUser.uid}`));
    const userData = userSnap.val();
    const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();

    await push(ref(db, "posts"), {
      user: auth.currentUser.email,
      userId: auth.currentUser.uid,
      profilePic: imageUrl,
      content: `${fullName} updated their profile picture.`,
      imageUrl: imageUrl,
      timestamp: Date.now()
    });

    const modal = bootstrap.Modal.getInstance(document.getElementById('uploadProfileModal'));
    modal.hide();
  } catch (error) {
    alert("Upload failed");
  }
};

// Load Posts
function loadMyPosts(userEmail) {
  const postsRef = ref(db, "posts");
  const loadingSpinner = document.getElementById("loadingSpinner");

  let hasPosts = false;

  onChildAdded(postsRef, async (snapshot) => {
    const post = snapshot.val();
    const postId = snapshot.key;

    if (post.user === userEmail) {
      if (!hasPosts) {
        hasPosts = true;
        loadingSpinner.style.display = "none";
      }

      const userSnap = await get(ref(db, `users/${post.userId}`));
      const userData = userSnap.exists() ? userSnap.val() : {};
      const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || post.user;

      const postDiv = document.createElement("div");
      postDiv.className = "card mb-3 p-3";
      postDiv.setAttribute("data-aos", "fade-up");

      postDiv.innerHTML = `
        <div class="d-flex align-items-center mb-2">
          <img src="${post.profilePic || 'https://via.placeholder.com/40'}" class="rounded-circle me-2" style="width: 40px; height: 40px;">
          <div>
            <a class="text-decoration-none" href="profile.html?uid=${post.userId}"><strong>${fullName}</strong></a><br>
            <small class="text-muted">${post.user}</small>
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
      `;

      myPosts.prepend(postDiv);

      // Like Button Logic
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
        await set(userLikeRef, liked.exists() ? null : true);
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

      const updateCommentCount = async (postId) => {
        const commentSnap = await get(ref(db, `comments/${postId}`));
        const count = commentSnap.exists() ? Object.keys(commentSnap.val()).length : 0;
        commentCountEl.innerText = `${count} Comments`;
      };
    }
  });

  setTimeout(() => {
    if (!hasPosts) loadingSpinner.style.display = "none";
  }, 3000);
}

// Date Format
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
