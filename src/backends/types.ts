import type { Collection, PaginatedResult, Post, Topic, User, Viewer } from "../models/index.js";

export interface PostsOptions {
  first?: number;
  after?: string;
  featured?: boolean;
  order?: string;
  postedAfter?: string;
  postedBefore?: string;
  topic?: string;
}

export interface TopicsOptions {
  first?: number;
  after?: string;
  query?: string;
  order?: string;
}

export interface CollectionsOptions {
  first?: number;
  after?: string;
  featured?: boolean;
  order?: string;
}

export interface Backend {
  getPosts(options?: PostsOptions): Promise<PaginatedResult<Post>>;
  getPost(idOrSlug: string): Promise<Post>;
  getUser(username: string): Promise<User>;
  getViewer(): Promise<Viewer>;
  getTopics(options?: TopicsOptions): Promise<PaginatedResult<Topic>>;
  getCollections(options?: CollectionsOptions): Promise<PaginatedResult<Collection>>;
}
