app.js
// app.js
async function postJson(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  return res.json();
}

// UI elements
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const resetSection = document.getElementById('reset-section');
const showLogin = document.getElementById('show-login');
const showSignup = document.getElementById('show-signup');
const showReset = document.getElementById('show-reset');

function showPanel(panel) {
  loginSection.classList.add('hidden');
  signupSection.classList.add('hidden');
  resetSection.classList.add('hidden');
  showLogin.classList.remove('active');
  showSignup.classList.remove('active');
  showReset.classList.remove('active');
  if (panel === 'login') { loginSection.classList.remove('hidden'); showLogin.classList.add('active'); }
  if (panel === 'signup') { signupSection.classList.remove('hidden'); showSignup.classList.add('active'); }
  if (panel === 'reset') { resetSection.classList.remove('hidden'); showReset.classList.add('active'); }
}
showLogin.onclick = () => showPanel('login');
showSignup.onclick = () => showPanel('signup');
showReset.onclick = () => showPanel('reset');

// Login
document.getElementById('login-btn').onclick = async () => {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const msg = document.getElementById('login-msg');
  msg.textContent = '';
  try {
    const data = await postJson('/api/login', { username, password });
    if (data.error) { msg.textContent = data.error; }
    else { msg.style.color = 'green'; msg.textContent = 'Login successful — welcome ' + data.user.username; }
  } catch (e) { msg.textContent = 'Network error'; }
};

// Signup
document.getElementById('signup-btn').onclick = async () => {
  const username = document.getElementById('signup-username').value.trim();
  const password = document.getElementById('signup-password').value;
  const newpassword = document.getElementById('signup-newpassword').value;
  const email = document.getElementById('signup-email').value.trim();
  const emailpass = document.getElementById('signup-emailpass').value;
  const telephone = document.getElementById('signup-telephone').value.trim();
  const msg = document.getElementById('signup-msg');
  msg.style.color = '#d00'; msg.textContent = '';
  if (!username || !password || !email) { msg.textContent = 'Username, password and email required'; return; }
  if (password !== newpassword) { msg.textContent = 'Password and New password must match'; return; }
  try {
    const data = await postJson('/api/signup', { username, password, email, telephone });
    if (data.error) { msg.textContent = data.error; }
    else { msg.style.color = 'green'; msg.textContent = 'Account created. You can now login.'; }
  } catch (e) { msg.textContent = 'Network error'; }
};

// Request reset
document.getElementById('request-reset-btn').onclick = async () => {
  const email = document.getElementById('reset-email').value.trim();
  const msg = document.getElementById('reset-msg');
  msg.style.color = '#d00'; msg.textContent = '';
  if (!email) { msg.textContent = 'Email required'; return; }
  try {
    const data = await postJson('/api/request-reset', { email });
    if (data.error) msg.textContent = data.error;
    else {
      msg.style.color = 'green';
      msg.innerHTML = 'Reset token (for demo): <br/><code>' + data.reset_token + '</code>';
    }
  } catch (e) { msg.textContent = 'Network error'; }
};

// Reset password using token
document.getElementById('reset-btn').onclick = async () => {
  const token = document.getElementById('reset-token').value.trim();
  const new_password = document.getElementById('reset-newpassword').value;
  const msg = document.getElementById('reset-msg');
  msg.style.color = '#d00'; msg.textContent = '';
  if (!token || !new_password) { msg.textContent = 'token and new password required'; return; }
  try {
    const data = await postJson('/api/reset', { token, new_password });
    if (data.error) msg.textContent = data.error;
    else { msg.style.color = 'green'; msg.textContent = 'Password updated. You can now login.'; }
  } catch (e) { msg.textContent = 'Network error'; }
};
