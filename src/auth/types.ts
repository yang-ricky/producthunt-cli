export interface AuthProvider {
  getHeaders(): Record<string, string>;
  verify(): Promise<boolean>;
}
