let friends = [{ id: 1, name: 'Alica' }, { id: 2, name: 'Nom' }];
let pending = [];

let postboxPosts = [];
const notifCountEl = document.getElementById('notif-count');

function renderFriends() {
  const friendsList = document.getElementById('friendsList');
  const pendingList = document.getElementById('pendingList');

  if (friendsList) {
    friendsList.innerHTML = friends.map(f => `<div>${f.name}</div>`).join('');
  }

  if (pendingList) {
    pendingList.innerHTML += pending
      .map(p => `<div>${p.name} <button onclick="approve(${p.id})">Approve</button></div>`)
      .join('');
  }
}
renderFriends();

function approve(id) {
  const u = pending.find(x => x.id === id);
  pending = pending.filter(x => x.id !== id);
  friends.push(u);
  renderFriends();
}

function sendWS(type, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  }
}

// Create Post Function
function createPost() {
  const text = document.getElementById('postbox-text').value.trim();
  const file = document.getElementById('postbox-file').files[0];

  if (!text && !file) return;

  const post = {
    id: Date.now(),
    name: "Lana Rose",
    location: "Dubai",
    time: "Just now",
    avatar: "https://tse4.mm.bing.net/th/id/OIP.Kk4i-k-7bOfsgPv0SJtj5AHaHa?pid=Api&P=0&h=220",
    text,
    img: null,
    likes: 0,
    comments: 0,
    shares: 0
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      post.img = e.target.result;
      postboxPosts.unshift(post);
      renderPostboxPosts();
      sendWS('newPost', post);
    };
    reader.readAsDataURL(file);
  } else {
    postboxPosts.unshift(post);
    renderPostboxPosts();
    sendWS('newPost', post);
  }

  document.getElementById('postbox-text').value = '';
  document.getElementById('postbox-file').value = '';
  document.getElementById('postbox-preview').style.display = 'none';
}

function renderPostboxPosts() {
  const feed = document.getElementById('postbox-feed');
  feed.innerHTML = postboxPosts.map(post => `
    <div class="postbox-card">
      <div class="postbox-header">
        <img src="${post.avatar}" alt="Profile" />
        <div class="postbox-userinfo">
          <h4>${post.name}</h4>
          <span>${post.location}, ${post.time}</span>
        </div>
      </div>
      ${post.text ? `<p style="padding: 0 15px 10px;">${post.text}</p>` : ''}
      ${post.img ? `<img src="${post.img}" class="postbox-image" />` : ''}
      <div class="postbox-actions">
        <button onclick="likePost(${post.id})"><i class="fa-regular fa-heart"></i> ${post.likes}</button>
        <button onclick="commentPost(${post.id})"><i class="fa-regular fa-comment"></i> ${post.comments}</button>
        <button onclick="sharePost(${post.id})"><i class="fa-solid fa-share"></i> ${post.shares}</button>
      </div>
    </div>
  `).join('');
}

function likePost(id) {
  const post = postboxPosts.find(p => p.id === id);
  if (post) {
    post.likes++;
    renderPostboxPosts();
    sendWS('likeUpdate', { id });
  }
}

function commentPost(id) {
  const post = postboxPosts.find(p => p.id === id);
  if (post) {
    post.comments++;
    renderPostboxPosts();
  }
}

function sharePost(id) {
  const post = postboxPosts.find(p => p.id === id);
  if (post) {
    post.shares++;
    renderPostboxPosts();
  }
}

// Handle file preview and friend request actions
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById('postbox-file');
  const previewImg = document.getElementById('postbox-preview');

  if (fileInput && previewImg) {
    fileInput.addEventListener('change', function () {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
      };
      reader.readAsDataURL(this.files[0]);
    });
  }

 const pendingList = document.getElementById("pendingList");
if (pendingList) {
  pendingList.addEventListener("click", function (e) {
    const card = e.target.closest(".request-card");
    if (!card) return;
    const name = card.querySelector("h4").innerText;

    if (e.target.classList.contains("accept-btn")) {
      // Change button text
      e.target.innerHTML = `<i class="fa-solid fa-check"></i> Accepted`;
      e.target.disabled = true;

      // Hide the ignore button
      const ignoreBtn = card.querySelector(".ignore-btn");
      if (ignoreBtn) ignoreBtn.style.display = "none";
    }

    if (e.target.classList.contains("ignore-btn")) {
      card.remove();
    }
  });
}

});

// Dummy WebSocket fallback
let ws;
try {
  ws = new WebSocket('ws://localhost:3000');
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'notify') {
      notifCountEl.innerText = parseInt(notifCountEl.innerText) + 1;
    } else if (msg.type === 'newPost') {
      postboxPosts.unshift(msg.post);
      renderPostboxPosts();
    } else if (msg.type === 'likeUpdate') {
      const post = postboxPosts.find(p => p.id === msg.id);
      if (post) {
        post.likes++;
        renderPostboxPosts();
      }
    }
  };
} catch (error) {
  console.warn('WebSocket connection failed:', error.message);
  ws = {
    readyState: 0,
    send: () => {},
  };
}
