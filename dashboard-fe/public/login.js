(function () {
  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorBox = document.getElementById('errorBox');
  const loginBtn = document.getElementById('loginBtn');

  function getNextUrl() {
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || '/dashboard';
    if (!next.startsWith('/') || next.startsWith('//')) return '/dashboard';
    return next;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    loginBtn.disabled = true;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.value.trim(),
          password: passwordInput.value,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json?.ok) {
        throw new Error(json?.reason || 'login failed');
      }
      location.href = getNextUrl();
    } catch (error) {
      errorBox.textContent = `로그인 실패: ${String(error.message || error)}`;
      loginBtn.disabled = false;
    }
  });
})();
