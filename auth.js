(function () {
  const ACCOUNT_STORAGE_KEY = "crm-account-management";
  const ROLE_STORAGE_KEY = "crm-role-permissions";
  const AUTH_STORAGE_KEY = "crm-auth-session";
  const PAGE_PATH_MAP = {
    "dashboard.html": { pageName: "数据仪表盘", controlled: false },
    "crm-leads.html": { pageName: "线索管理", controlled: true },
    "product-management.html": { pageName: "商品管理", controlled: true },
    "order-management.html": { pageName: "订单管理", controlled: true },
    "role-management.html": { pageName: "角色与权限管理", controlled: true },
    "customer-management.html": { pageName: "账号管理", controlled: false }
  };

  const embeddedAccounts = [
    {
      id: "ACC20260622001",
      createdAt: "2026-06-22 09:20",
      phone: "13912345678",
      userName: "系统管理员",
      roleName: "管理员",
      password: "123123"
    }
  ];

  const embeddedRoles = [
    {
      id: "ROLE20260622001",
      createdAt: "2026-06-22 09:00",
      roleName: "管理员",
      permissionBindings: [
        { page: "角色与权限管理", actions: ["查看", "修改", "增加", "删除"], dataScope: "全部" },
        { page: "线索管理", actions: ["查看", "修改", "增加", "删除"], dataScope: "全部" },
        { page: "商品管理", actions: ["查看", "修改", "增加", "删除"], dataScope: "全部" },
        { page: "订单管理", actions: ["查看", "修改", "增加", "删除"], dataScope: "全部" }
      ]
    }
  ];

  function readStorageJson(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn(`读取本地存储 ${key} 失败。`, error);
      return null;
    }
  }

  function normalizeAccounts(data) {
    const source = Array.isArray(data) && data.length ? data : embeddedAccounts;
    return source.map((item, index) => ({
      id: item.id || `ACC${String(index + 1).padStart(8, "0")}`,
      createdAt: item.createdAt || "",
      phone: item.phone || "",
      userName: item.userName || "",
      roleName: item.roleName || "管理员",
      password: item.password || "123123"
    }));
  }

  function normalizeRoles(data) {
    const source = Array.isArray(data) && data.length ? data : embeddedRoles;
    return source.map((item, index) => ({
      id: item.id || `ROLE${String(index + 1).padStart(8, "0")}`,
      createdAt: item.createdAt || "",
      roleName: item.roleName || `未命名角色${index + 1}`,
      permissionBindings: Array.isArray(item.permissionBindings) ? item.permissionBindings : []
    }));
  }

  async function fetchJsonOrFallback(path, fallbackData) {
    if (window.location.protocol === "file:") {
      return fallbackData;
    }

    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`请求失败: ${path}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`读取 ${path} 失败，已回退。`, error);
      return fallbackData;
    }
  }

  async function loadAccounts() {
    const cached = readStorageJson(ACCOUNT_STORAGE_KEY);
    if (cached) return normalizeAccounts(cached);
    const data = await fetchJsonOrFallback("./data/accounts.json", embeddedAccounts);
    return normalizeAccounts(data);
  }

  async function loadRoles() {
    const cached = readStorageJson(ROLE_STORAGE_KEY);
    if (cached) return normalizeRoles(cached);
    const data = await fetchJsonOrFallback("./data/roles.json", embeddedRoles);
    return normalizeRoles(data);
  }

  function getSession() {
    return readStorageJson(AUTH_STORAGE_KEY);
  }

  function getAccountsSnapshot() {
    const cached = readStorageJson(ACCOUNT_STORAGE_KEY);
    return normalizeAccounts(cached || embeddedAccounts);
  }

  function getRolesSnapshot() {
    const cached = readStorageJson(ROLE_STORAGE_KEY);
    return normalizeRoles(cached || embeddedRoles);
  }

  function hydrateSession(session) {
    if (!session || !session.isAuthenticated) return session;

    const account = getAccountsSnapshot().find((item) => item.id === session.accountId);
    if (!account) return session;

    const role = getRolesSnapshot().find((item) => item.roleName === account.roleName);
    return {
      ...session,
      phone: account.phone,
      userName: account.userName,
      roleName: account.roleName,
      permissionBindings: role ? role.permissionBindings : []
    };
  }

  function getPermissionBindingsFromSession() {
    const session = getSession();
    return session && Array.isArray(session.permissionBindings) ? session.permissionBindings : [];
  }

  function getPermissionByPage(pageName) {
    return getPermissionBindingsFromSession().find((item) => item.page === pageName) || null;
  }

  function canAccessPage(pageName) {
    const pageConfig = Object.values(PAGE_PATH_MAP).find((item) => item.pageName === pageName);
    if (!pageConfig || !pageConfig.controlled) {
      return true;
    }
    return Boolean(getPermissionByPage(pageName));
  }

  function getPagePath(pageName) {
    const entry = Object.entries(PAGE_PATH_MAP).find(([, value]) => value.pageName === pageName);
    return entry ? entry[0] : null;
  }

  function getFirstAccessiblePath() {
    const preferredOrder = [
      "crm-leads.html",
      "product-management.html",
      "order-management.html",
      "role-management.html",
      "dashboard.html",
      "customer-management.html"
    ];

    return preferredOrder.find((path) => {
      const config = PAGE_PATH_MAP[path];
      return config && canAccessPage(config.pageName);
    }) || "customer-management.html";
  }

  function setSession(session) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }

  function clearSession() {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  async function login(phone, password) {
    const accounts = await loadAccounts();
    const account = accounts.find((item) => item.phone === phone && item.password === password);
    if (!account) {
      return { ok: false, message: "用户名或密码错误" };
    }

    const roles = await loadRoles();
    const role = roles.find((item) => item.roleName === account.roleName);
    const session = {
      accountId: account.id,
      phone: account.phone,
      userName: account.userName,
      roleName: account.roleName,
      permissionBindings: role ? role.permissionBindings : [],
      isAuthenticated: true,
      loginAt: new Date().toISOString()
    };
    setSession(session);
    return { ok: true, session };
  }

  function requireAuth(options = {}) {
    const redirectPath = options.redirectPath || "login.html";
    const session = hydrateSession(getSession());
    if (session && session.isAuthenticated) {
      setSession(session);
      return session;
    }
    if (!options.silent) {
      window.location.href = redirectPath;
    }
    return null;
  }

  function requirePageAccess(pageName, options = {}) {
    const redirectPath = options.redirectPath || getFirstAccessiblePath();
    if (canAccessPage(pageName)) {
      return true;
    }
    if (!options.silent) {
      window.location.href = redirectPath;
    }
    return false;
  }

  function canUseAction(pageName, actionName) {
    const permission = getPermissionByPage(pageName);
    if (!permission) {
      return !Object.values(PAGE_PATH_MAP).find((item) => item.pageName === pageName && item.controlled);
    }
    return Array.isArray(permission.actions) && permission.actions.includes(actionName);
  }

  function getDataScope(pageName) {
    const permission = getPermissionByPage(pageName);
    if (!permission) return "全部";
    return permission.dataScope === "仅自己" ? "仅自己" : "全部";
  }

  function applyNavigationPermissions() {
    document.querySelectorAll("nav a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      const config = PAGE_PATH_MAP[href];
      if (!config) return;
      link.classList.toggle("hidden", config.controlled && !canAccessPage(config.pageName));
    });
  }

  function syncSessionFromAccount(account) {
    const session = getSession();
    if (!session || !session.isAuthenticated) return;
    if (session.accountId !== account.id) return;

    const role = getRolesSnapshot().find((item) => item.roleName === account.roleName);

    setSession({
      ...session,
      phone: account.phone,
      userName: account.userName,
      roleName: account.roleName,
      permissionBindings: role ? role.permissionBindings : []
    });
  }

  function removeSessionIfAccountDeleted(accountId) {
    const session = getSession();
    if (session && session.accountId === accountId) {
      clearSession();
    }
  }

  window.CRMAuth = {
    ACCOUNT_STORAGE_KEY,
    ROLE_STORAGE_KEY,
    AUTH_STORAGE_KEY,
    loadAccounts,
    loadRoles,
    getSession,
    getPermissionByPage,
    canAccessPage,
    canUseAction,
    getDataScope,
    getFirstAccessiblePath,
    requirePageAccess,
    applyNavigationPermissions,
    setSession,
    clearSession,
    login,
    requireAuth,
    syncSessionFromAccount,
    removeSessionIfAccountDeleted
  };
})();
