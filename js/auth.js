
(function () {
  const SESSION_KEY = "scad_session";

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

  function requireAuth() {
    const session = getSession();
    if (!session) {
      const next = encodeURIComponent(location.pathname.split("/").pop() || "index.html");
      location.href = `login.html?next=${next}`;
    }
  }

  function login(email, password) {
    // Demo local (NO seguro para producción)
    const USERS = [
      { email: "admin@scad.local", password: "123456", name: "Administrador", role: "admin" },
      { email: "operador@scad.local", password: "123456", name: "Operador", role: "operador" }
    ];

    const user = USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
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

  // Exponer funciones globales
  window.SCADAUTH = { getSession, requireAuth, login, logout, clearSession };
})();
