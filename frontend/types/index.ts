export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  images?: Image[];
}

export interface Hashtag {
  id: string;
  name: string;
}

export interface ImageHashtag {
  imageId: string;
  hashtagId: string;
  hashtag: Hashtag;
}

export interface ImageMention {
  id: string;
  imageId: string;
  userId: string;
  user: {
    id: string;
    username: string;
  };
  createdAt: string;
}

export interface Image {
  id: string;
  urlSmall: string;
  urlMedium: string;
  urlLarge: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    avatar: string | null;
  };
  hashtags: ImageHashtag[];
  mentions: ImageMention[];
  _count?: { reactions: number; comments: number };
}

export interface Comment {
  id: string;
  imageId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; username: string; avatar: string | null };
}

export interface Notification {
  id: string;
  type: 'reaction' | 'comment';
  read: boolean;
  createdAt: string;
  imageId: string;
  fromUser: { id: string; username: string; avatar: string | null };
  image: { id: string; urlSmall: string | null };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface TrendingHashtag {
  id: string;
  name: string;
  count: number;
}

export interface RecommendedAccount {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  bio: string | null;
  followerCount: number;
  imageCount: number;
  reactionCount: number;
  isFollowing: boolean;
}

export interface FollowStatus {
  isFollowing: boolean;
  followerCount: number;
}

export interface UnsplashPhoto {
  id: string;
  description: string;
  urls: { small: string; regular: string; full: string };
  author: { name: string; username: string };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; username: string; avatar: string | null };
}

export interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  user1: { id: string; username: string; avatar: string | null; firstName: string | null; lastName: string | null };
  user2: { id: string; username: string; avatar: string | null; firstName: string | null; lastName: string | null };
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}
