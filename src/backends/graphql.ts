import { API_ENDPOINT, RATE_LIMIT_HEADERS, DEFAULT_FIRST, DEFAULT_COMMENTS_FIRST } from "../constants.js";
import { ApiError, AuthError, NetworkError, RateLimitError } from "../errors.js";
import type { AuthProvider } from "../auth/types.js";
import type {
  Post,
  User,
  Viewer,
  Topic,
  Collection,
  Comment,
  PostMedia,
  PaginatedResult,
  PageInfo,
} from "../models/index.js";
import type { Backend, PostsOptions, TopicsOptions, CollectionsOptions } from "./types.js";

// ===== Rate Limit Tracking =====

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

let lastRateLimitInfo: RateLimitInfo | null = null;

export function getLastRateLimitInfo(): RateLimitInfo | null {
  return lastRateLimitInfo;
}

function parseRateLimitHeaders(headers: Headers): void {
  const limit = headers.get(RATE_LIMIT_HEADERS.limit);
  const remaining = headers.get(RATE_LIMIT_HEADERS.remaining);
  const reset = headers.get(RATE_LIMIT_HEADERS.reset);

  if (limit && remaining && reset) {
    lastRateLimitInfo = {
      limit: Number.parseInt(limit, 10),
      remaining: Number.parseInt(remaining, 10),
      resetInSeconds: Number.parseInt(reset, 10),
    };
  }
}

// ===== GraphQL Request =====

interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

async function graphqlRequest(
  auth: AuthProvider,
  query: string,
  variables?: Record<string, unknown>,
  options?: { verbose?: boolean; wait?: boolean },
): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: auth.getHeaders(),
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    throw new NetworkError(
      `Failed to connect to Product Hunt API: ${err instanceof Error ? err.message : "unknown error"}`,
    );
  }

  parseRateLimitHeaders(res.headers);

  if (options?.verbose && lastRateLimitInfo) {
    console.error(
      `[rate-limit] ${lastRateLimitInfo.remaining}/${lastRateLimitInfo.limit} points remaining (resets in ${lastRateLimitInfo.resetInSeconds}s)`,
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new AuthError("Invalid or expired token. Run `ph auth set-token` to configure.");
  }

  if (res.status === 429) {
    const resetIn = lastRateLimitInfo?.resetInSeconds ?? 60;

    if (options?.wait) {
      console.error(`[rate-limit] Rate limited. Waiting ${resetIn}s before retry...`);
      await new Promise((resolve) => setTimeout(resolve, resetIn * 1000));
      return graphqlRequest(auth, query, variables, { ...options, wait: false });
    }

    throw new RateLimitError(
      `Rate limited. Try again in ${resetIn} seconds, or use --wait to auto-retry.`,
      resetIn,
    );
  }

  if (!res.ok) {
    throw new ApiError(`API returned HTTP ${res.status}`, res.status);
  }

  const json = (await res.json()) as GraphQLResponse;

  if (json.errors?.length) {
    throw new ApiError(`GraphQL error: ${json.errors[0].message}`);
  }

  if (!json.data) {
    throw new ApiError("API returned no data");
  }

  return json.data;
}

// ===== Response Parsers (exported for testing) =====

export function parseUser(raw: Record<string, unknown>): User {
  return {
    id: raw.id as string,
    name: raw.name as string,
    username: raw.username as string,
    headline: (raw.headline as string) ?? null,
    profileImage: (raw.profileImage as string) ?? null,
    coverImage: (raw.coverImage as string) ?? null,
    url: raw.url as string,
    websiteUrl: (raw.websiteUrl as string) ?? null,
    twitterUsername: (raw.twitterUsername as string) ?? null,
    isMaker: (raw.isMaker as boolean) ?? false,
    isFollowing: (raw.isFollowing as boolean) ?? false,
    createdAt: raw.createdAt as string,
  };
}

export function parseComment(raw: Record<string, unknown>): Comment {
  const repliesEdges = (raw.replies as Record<string, unknown>)?.edges as Array<Record<string, unknown>> | undefined;
  return {
    id: raw.id as string,
    body: raw.body as string,
    url: raw.url as string,
    createdAt: raw.createdAt as string,
    votesCount: (raw.votesCount as number) ?? 0,
    isVoted: (raw.isVoted as boolean) ?? false,
    user: parseUser(raw.user as Record<string, unknown>),
    replies: repliesEdges?.map((e) => parseComment(e.node as Record<string, unknown>)) ?? [],
  };
}

export function parseMedia(raw: Record<string, unknown>): PostMedia {
  return {
    type: raw.type as "image" | "video",
    url: raw.url as string,
    videoUrl: (raw.videoUrl as string) ?? null,
  };
}

export function parsePost(raw: Record<string, unknown>): Post {
  const makersEdges = (raw.makers as Record<string, unknown>[]) ?? [];
  const makers = Array.isArray(makersEdges)
    ? makersEdges.map((m) => parseUser(m as Record<string, unknown>))
    : [];

  const mediaItems = (raw.media as Record<string, unknown>[]) ?? [];
  const media = Array.isArray(mediaItems)
    ? mediaItems.map((m) => parseMedia(m as Record<string, unknown>))
    : [];

  const topicsEdges = (raw.topics as Record<string, unknown>)?.edges as Array<Record<string, unknown>> | undefined;
  const topics = topicsEdges?.map((e) => parseTopic(e.node as Record<string, unknown>)) ?? [];

  const commentsEdges = (raw.comments as Record<string, unknown>)?.edges as Array<Record<string, unknown>> | undefined;
  const comments = commentsEdges?.map((e) => parseComment(e.node as Record<string, unknown>)) ?? [];

  return {
    id: raw.id as string,
    name: raw.name as string,
    tagline: raw.tagline as string,
    description: (raw.description as string) ?? null,
    slug: raw.slug as string,
    url: raw.url as string,
    website: (raw.website as string) ?? null,
    votesCount: (raw.votesCount as number) ?? 0,
    commentsCount: (raw.commentsCount as number) ?? 0,
    reviewsRating: (raw.reviewsRating as number) ?? null,
    createdAt: raw.createdAt as string,
    featuredAt: (raw.featuredAt as string) ?? null,
    makers,
    media,
    topics,
    comments,
    thumbnail: (raw.thumbnail as Record<string, unknown>)?.url as string ?? null,
    isVoted: (raw.isVoted as boolean) ?? false,
    isCollected: (raw.isCollected as boolean) ?? false,
  };
}

export function parseTopic(raw: Record<string, unknown>): Topic {
  return {
    id: raw.id as string,
    name: raw.name as string,
    slug: raw.slug as string,
    description: (raw.description as string) ?? null,
    url: raw.url as string,
    postsCount: (raw.postsCount as number) ?? 0,
    followersCount: (raw.followersCount as number) ?? 0,
    isFollowing: (raw.isFollowing as boolean) ?? false,
    image: (raw.image as string) ?? null,
  };
}

export function parseCollection(raw: Record<string, unknown>): Collection {
  return {
    id: raw.id as string,
    name: raw.name as string,
    tagline: (raw.tagline as string) ?? null,
    description: (raw.description as string) ?? null,
    coverImage: (raw.coverImage as string) ?? null,
    url: raw.url as string,
    followersCount: (raw.followersCount as number) ?? 0,
    isFollowing: (raw.isFollowing as boolean) ?? false,
    user: raw.user ? parseUser(raw.user as Record<string, unknown>) : null,
    featuredAt: (raw.featuredAt as string) ?? null,
  };
}

export function parsePageInfo(raw: Record<string, unknown>): PageInfo {
  return {
    hasNextPage: (raw.hasNextPage as boolean) ?? false,
    endCursor: (raw.endCursor as string) ?? null,
  };
}

// ===== GraphQL Queries =====

const POST_FIELDS = `
  id name tagline description slug url website
  votesCount commentsCount reviewsRating
  createdAt featuredAt isVoted isCollected
  thumbnail { url }
  makers { id name username headline profileImage }
  media { type url videoUrl }
  topics(first: 5) { edges { node { id name slug url } } }
`;

const POST_WITH_COMMENTS = `
  ${POST_FIELDS}
  comments(first: $commentsFirst) {
    edges { node {
      id body url createdAt votesCount isVoted
      user { id name username profileImage }
      replies(first: 3) { edges { node {
        id body url createdAt votesCount isVoted
        user { id name username profileImage }
      } } }
    } }
  }
`;

const USER_FIELDS = `
  id name username headline profileImage coverImage
  url websiteUrl twitterUsername isMaker isFollowing createdAt
`;

const TOPIC_FIELDS = `
  id name slug description url postsCount followersCount isFollowing image
`;

const COLLECTION_FIELDS = `
  id name tagline description coverImage url followersCount isFollowing featuredAt
  user { id name username }
`;

// ===== Backend Implementation =====

export class GraphQLBackend implements Backend {
  constructor(
    private auth: AuthProvider,
    private options?: { verbose?: boolean; wait?: boolean },
  ) {}

  private request(query: string, variables?: Record<string, unknown>) {
    return graphqlRequest(this.auth, query, variables, this.options);
  }

  async getPosts(opts?: PostsOptions): Promise<PaginatedResult<Post>> {
    const variables: Record<string, unknown> = {
      first: opts?.first ?? DEFAULT_FIRST,
    };
    if (opts?.after) variables.after = opts.after;
    if (opts?.featured !== undefined) variables.featured = opts.featured;
    if (opts?.order) variables.order = opts.order;
    if (opts?.postedAfter) variables.postedAfter = opts.postedAfter;
    if (opts?.postedBefore) variables.postedBefore = opts.postedBefore;
    if (opts?.topic) variables.topic = opts.topic;

    const query = `
      query GetPosts($first: Int!, $after: String, $featured: Boolean, $order: PostsOrder, $postedAfter: DateTime, $postedBefore: DateTime, $topic: String) {
        posts(first: $first, after: $after, featured: $featured, order: $order, postedAfter: $postedAfter, postedBefore: $postedBefore, topic: $topic) {
          edges { node { ${POST_FIELDS} } }
          pageInfo { hasNextPage endCursor }
        }
      }
    `;

    const data = await this.request(query, variables);
    const connection = data.posts as Record<string, unknown>;
    const edges = (connection.edges as Array<Record<string, unknown>>) ?? [];
    const pageInfo = parsePageInfo(connection.pageInfo as Record<string, unknown>);

    return {
      items: edges.map((e) => parsePost(e.node as Record<string, unknown>)),
      pageInfo,
    };
  }

  async getPost(idOrSlug: string): Promise<Post> {
    const isId = /^\d+$/.test(idOrSlug);
    const query = `
      query GetPost($slug: String, $id: ID, $commentsFirst: Int!) {
        post(slug: $slug, id: $id) { ${POST_WITH_COMMENTS} }
      }
    `;

    const variables: Record<string, unknown> = {
      commentsFirst: DEFAULT_COMMENTS_FIRST,
    };
    if (isId) {
      variables.id = idOrSlug;
    } else {
      variables.slug = idOrSlug;
    }

    const data = await this.request(query, variables);
    if (!data.post) {
      throw new ApiError(`Post not found: ${idOrSlug}`);
    }
    return parsePost(data.post as Record<string, unknown>);
  }

  async getUser(username: string): Promise<User> {
    const query = `
      query GetUser($username: String!) {
        user(username: $username) { ${USER_FIELDS} }
      }
    `;

    const data = await this.request(query, { username });
    if (!data.user) {
      throw new ApiError(`User not found: ${username}`);
    }
    return parseUser(data.user as Record<string, unknown>);
  }

  async getViewer(): Promise<Viewer> {
    const query = `
      query GetViewer {
        viewer { user { ${USER_FIELDS} } }
      }
    `;

    const data = await this.request(query);
    const viewer = data.viewer as Record<string, unknown> | null;
    if (!viewer?.user) {
      throw new AuthError(
        "Cannot access viewer. Your token may be a client-only token. Use a Developer Token instead.",
      );
    }
    return { user: parseUser(viewer.user as Record<string, unknown>) };
  }

  async getTopics(opts?: TopicsOptions): Promise<PaginatedResult<Topic>> {
    const variables: Record<string, unknown> = {
      first: opts?.first ?? DEFAULT_FIRST,
    };
    if (opts?.after) variables.after = opts.after;
    if (opts?.query) variables.query = opts.query;
    if (opts?.order) variables.order = opts.order;

    const query = `
      query GetTopics($first: Int!, $after: String, $query: String, $order: TopicsOrder) {
        topics(first: $first, after: $after, query: $query, order: $order) {
          edges { node { ${TOPIC_FIELDS} } }
          pageInfo { hasNextPage endCursor }
        }
      }
    `;

    const data = await this.request(query, variables);
    const connection = data.topics as Record<string, unknown>;
    const edges = (connection.edges as Array<Record<string, unknown>>) ?? [];
    const pageInfo = parsePageInfo(connection.pageInfo as Record<string, unknown>);

    return {
      items: edges.map((e) => parseTopic(e.node as Record<string, unknown>)),
      pageInfo,
    };
  }

  async getCollections(opts?: CollectionsOptions): Promise<PaginatedResult<Collection>> {
    const variables: Record<string, unknown> = {
      first: opts?.first ?? DEFAULT_FIRST,
    };
    if (opts?.after) variables.after = opts.after;
    if (opts?.featured !== undefined) variables.featured = opts.featured;
    if (opts?.order) variables.order = opts.order;

    const query = `
      query GetCollections($first: Int!, $after: String, $featured: Boolean, $order: CollectionsOrder) {
        collections(first: $first, after: $after, featured: $featured, order: $order) {
          edges { node { ${COLLECTION_FIELDS} } }
          pageInfo { hasNextPage endCursor }
        }
      }
    `;

    const data = await this.request(query, variables);
    const connection = data.collections as Record<string, unknown>;
    const edges = (connection.edges as Array<Record<string, unknown>>) ?? [];
    const pageInfo = parsePageInfo(connection.pageInfo as Record<string, unknown>);

    return {
      items: edges.map((e) => parseCollection(e.node as Record<string, unknown>)),
      pageInfo,
    };
  }
}
