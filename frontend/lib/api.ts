import type { ApiResponse, Comment, Conversation, FollowStatus, Image, Message, Notification, RecommendedAccount, TrendingHashtag, UnsplashPhoto, User } from "@/types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TOKEN_KEY = "ugram_auth_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function readAndStoreTokenFromUrl(): string | null {
  if (typeof window === "undefined") return getAuthToken();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("auth_token");
  if (token) {
    setAuthToken(token);
    window.history.replaceState({}, "", window.location.pathname);
    return token;
  }
  return getAuthToken();
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: "include",
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

export function fetchImages(): Promise<Image[]> {
  return fetcher<Image[]>("/api/images");
}

export function fetchUsers(): Promise<User[]> {
  return fetcher<User[]>("/api/users");
}

export function fetchImageById(id: string): Promise<Image> {
  return fetcher<Image>(`/api/images/${id}`);
}

export function fetchUserById(id: string): Promise<User> {
  return fetcher<User>(`/api/users/${id}`);
}

export async function createImage(formData: FormData): Promise<Image> {
  const res = await fetch(`${API_BASE}/api/images`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const json: ApiResponse<Image> = await res.json();
  return json.data;
}

export async function createUser(userData: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<User> {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `API error: ${res.status}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  const json: ApiResponse<User> = await res.json();
  return json.data;
}

export async function updateImage(
  id: string,
  payload: { description?: string }
): Promise<Image> {
  const res = await fetch(`${API_BASE}/api/images/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const json: ApiResponse<Image> = await res.json();
  return json.data;
}

export async function updateUser(
  id: string,
  payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | FormData
): Promise<User> {
  const isFormData = payload instanceof FormData;
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { 
      ...getAuthHeaders(), 
      ...(isFormData ? {} : { "Content-Type": "application/json" }) 
    },
    body: isFormData ? payload : JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const json: ApiResponse<User> = await res.json();
  return json.data;
}

export async function deleteImage(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/images/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = readAndStoreTokenFromUrl();

  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
      headers,
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Authentication request timed out.");
    }
    throw error;
  }

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const json = (await res.json()) as { user?: User | null };
  return json.user ?? null;
}

export async function logout(): Promise<void> {
  clearAuthToken();
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok && res.status !== 401) {
    throw new Error(`API error: ${res.status}`);
  }
}

export function getGoogleLoginUrl(): string {
  return `${API_BASE}/auth/google`;
}

export async function loginLocal(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const json = await res.json();
  return json.token;
}

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return "/placeholder.svg";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
}

export function searchUsers(userName: string): Promise<User[]> {
  return fetcher<User[]>(`/api/search/users?q=${encodeURIComponent(userName)}`);
}

export function searchImagesByHashtag(hashtag: string): Promise<Image[]> {
  return fetcher<Image[]>(`/api/search/images?hashtag=${encodeURIComponent(hashtag)}`);
}

export function searchImagesByDescription(description: string): Promise<Image[]> {
  return fetcher<Image[]>(`/api/search/images?description=${encodeURIComponent(description)}`);
}

export function searchHashtags(query: string): Promise<{ id: string; name: string }[]> {
  return fetcher<{ id: string; name: string }[]>(`/api/search/hashtags?q=${encodeURIComponent(query)}`);
}

export function toggleReaction(imageId: string): Promise<{ liked: boolean; count: number }> {
  return fetcher<{ liked: boolean; count: number }>(`/api/images/${imageId}/reactions`, {
    method: "POST",
  });
}

export function getReactions(imageId: string): Promise<{ count: number; liked: boolean }> {
  return fetcher<{ count: number; liked: boolean }>(`/api/images/${imageId}/reactions`);
}

export function getComments(imageId: string): Promise<Comment[]> {
  return fetcher<Comment[]>(`/api/images/${imageId}/comments`);
}

export async function createComment(imageId: string, content: string): Promise<Comment> {
  const res = await fetch(`${API_BASE}/api/images/${imageId}/comments`, {
    method: "POST",
    credentials: "include",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json: ApiResponse<Comment> = await res.json();
  return json.data;
}

export async function deleteComment(commentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export function getNotifications(): Promise<Notification[]> {
  return fetcher<Notification[]>("/api/notifications");
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: "PATCH",
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

// --- Trending hashtags ---
export function getTrendingHashtags(): Promise<TrendingHashtag[]> {
  return fetcher<TrendingHashtag[]>("/api/search/hashtags/trending");
}

// --- Follow ---
export function getRecommendedAccounts(): Promise<RecommendedAccount[]> {
  return fetcher<RecommendedAccount[]>("/api/users/recommended");
}

export function toggleFollow(userId: string): Promise<FollowStatus> {
  return fetcher<FollowStatus>(`/api/users/${userId}/follow`, { method: "POST" });
}

export function getFollowStatus(userId: string): Promise<FollowStatus> {
  return fetcher<FollowStatus>(`/api/users/${userId}/follow`);
}

// --- Interest-based recommendations ---
export function getRecommendedImages(): Promise<Image[]> {
  return fetcher<Image[]>("/api/images/recommended");
}

// --- Unsplash ---
export function searchExternalPhotos(
  q: string,
  page = 1
): Promise<{ photos: UnsplashPhoto[]; total: number; totalPages: number }> {
  return fetcher(`/api/external-photos/search?q=${encodeURIComponent(q)}&page=${page}`);
}

export async function importExternalPhoto(
  photoUrl: string,
  description?: string
): Promise<Image> {
  const res = await fetch(`${API_BASE}/api/external-photos/import`, {
    method: "POST",
    credentials: "include",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ photoUrl, description }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json: ApiResponse<Image> = await res.json();
  return json.data;
}

// --- Chat ---
export function getConversations(): Promise<Conversation[]> {
  return fetcher<Conversation[]>("/api/chat/conversations");
}

export function getConversationWithUser(
  userId: string
): Promise<{ conversation: Conversation; messages: Message[] }> {
  return fetcher(`/api/chat/conversations/${userId}`);
}

export async function sendMessage(userId: string, content: string): Promise<Message> {
  const res = await fetch(`${API_BASE}/api/chat/conversations/${userId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json: ApiResponse<Message> = await res.json();
  return json.data;
}

export function getUnreadMessageCount(): Promise<{ count: number }> {
  return fetcher<{ count: number }>("/api/chat/unread");
}
