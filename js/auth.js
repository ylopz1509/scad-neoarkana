(function () {
  const SESSION_KEY = "scad_session";
  const USERS_KEY = "scad_users";

  function getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function setSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function register(name, email, password) {
    const users = getUsers();

    const exists = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (exists) {
      return { ok: false, message: "El correo ya está registrado" };
    }

    users.push({
      name,
      email,
      password,
      role: "operador",
      createdAt: new Date().toISOString()
    });

    saveUsers(users);
    return { ok: true };
  }

  function login(email, password) {
    const users = getUsers();

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );

    if (!user) return { ok: false, message: "Credenciales inválidas" };

    setSession({
      email: user.email,
      name: user.name,
      role: user.role,
      loginAt: new Date().toISOString()
    });

    return { ok: true };
  }

  function logout() {
    clearSession();
    location.href = "login.html";
  }

  function requireAuth() {
    const session = getSession();
    if (!session) {
      const next = encodeURIComponent(
        location.pathname.split("/").pop() || "index.html"
      );
      location.href = `login.html?next=${next}`;
    }
  }

  window.SCADAUTH = {
    getSession,
    requireAuth,
    login,
    logout,
    register
  };
})();