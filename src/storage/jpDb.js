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
