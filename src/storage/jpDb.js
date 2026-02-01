const USERS_KEY = "jp_users";
const POSTS_KEY = "jp_posts";
const TODOS_KEY = "jp_todos_v1";

const safeParse = (v, fallback) => {
  try {
    const parsed = JSON.parse(v);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export function loadUsers() {
  return safeParse(localStorage.getItem(USERS_KEY), null);
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users || []));
}

export function loadPosts() {
  return safeParse(localStorage.getItem(POSTS_KEY), []);
}

export function savePosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts || []));
}

export function loadTodos() {
  return safeParse(localStorage.getItem(TODOS_KEY), []);
}

export function saveTodos(todos) {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos || []));
}

export function nextId(items) {
  const list = Array.isArray(items) ? items : [];
  const max = list.reduce((m, x) => ((x?.id ?? 0) > m ? x.id : m), 0);
  return max + 1;
}


const toIsoSafe = (d) => {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    const t = dt.getTime();
    return Number.isFinite(t) ? dt.toISOString() : null;
  } catch {
    return null;
  }
};


export function ensureUsersCreatedAt(users) {
  const list = Array.isArray(users) ? users : [];
  let changed = false;

  const normalized = list.map((u, idx) => {
    if (u?.createdAt) return u;

    changed = true;

    const baseDays = Number.isFinite(Number(u?.id)) ? Number(u.id) : idx + 1;
    const fallbackDate = new Date(Date.now() - baseDays * 24 * 60 * 60 * 1000);

    return {
      ...u,
      createdAt: toIsoSafe(fallbackDate),
    };
  });

  return { normalized, changed };
}
