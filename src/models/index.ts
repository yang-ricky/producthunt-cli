// ===== Domain Models =====

export interface Post {
  id: string;
  name: string;
  tagline: string;
  description: string | null;
  slug: string;
  url: string;
  website: string | null;
  votesCount: number;
  commentsCount: number;
  reviewsRating: number | null;
  createdAt: string;
  featuredAt: string | null;
  makers: User[];
  media: PostMedia[];
  topics: Topic[];
  comments: Comment[];
  thumbnail: string | null;
  isVoted: boolean;
  isCollected: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  headline: string | null;
  profileImage: string | null;
  coverImage: string | null;
  url: string;
  websiteUrl: string | null;
  twitterUsername: string | null;
  isMaker: boolean;
  isFollowing: boolean;
  createdAt: string;
}

export interface Viewer {
  user: User;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  url: string;
  postsCount: number;
  followersCount: number;
  isFollowing: boolean;
  image: string | null;
}

export interface Collection {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  coverImage: string | null;
  url: string;
  followersCount: number;
  isFollowing: boolean;
  user: User | null;
  featuredAt: string | null;
}

export interface Comment {
  id: string;
  body: string;
  url: string;
  createdAt: string;
  votesCount: number;
  isVoted: boolean;
  user: User;
  replies: Comment[];
}

export interface PostMedia {
  type: "image" | "video";
  url: string;
  videoUrl: string | null;
}

// ===== CLI Output Envelope =====

export interface CLIOutput<T> {
  ok: boolean;
  schemaVersion: "1";
  data: T | null;
  error: {
    code: string;
    message: string;
    exitCode: number;
  } | null;
}

// ===== Pagination =====

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  pageInfo: PageInfo;
}
