export enum ExitCode {
  Success = 0,
  GeneralError = 1,
  AuthError = 2,
  ApiError = 3,
  RateLimited = 4,
  NetworkError = 5,
  ConfigError = 6,
  ArgumentError = 7,
}

export class CLIError extends Error {
  constructor(
    message: string,
    public readonly exitCode: ExitCode = ExitCode.GeneralError,
    public readonly errorCode?: string,
  ) {
    super(message);
    this.name = "CLIError";
  }
}

export class AuthError extends CLIError {
  constructor(message: string) {
    super(message, ExitCode.AuthError, "not_authenticated");
    this.name = "AuthError";
  }
}

export class ApiError extends CLIError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, ExitCode.ApiError, "api_error");
    this.name = "ApiError";
  }
}

export class RateLimitError extends CLIError {
  constructor(
    message: string,
    public readonly resetInSeconds: number,
  ) {
    super(message, ExitCode.RateLimited, "rate_limited");
    this.name = "RateLimitError";
  }
}

export class NetworkError extends CLIError {
  constructor(message: string) {
    super(message, ExitCode.NetworkError, "network_error");
    this.name = "NetworkError";
  }
}

export class ConfigError extends CLIError {
  constructor(message: string) {
    super(message, ExitCode.ConfigError, "config_error");
    this.name = "ConfigError";
  }
}
