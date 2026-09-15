import {
  Injectable,
  UnauthorizedException,
  type ExecutionContext,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { clearAuthCookies } from "./auth-cookies";

@Injectable()
export class JwtRefreshGuard extends AuthGuard("jwt-refresh") {
  handleRequest<TUser>(
    error: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext
  ): TUser {
    if (user) return user;

    if (error && !(error instanceof UnauthorizedException)) throw error;

    const http = context.switchToHttp();
    clearAuthCookies(
      http.getResponse<Response>(),
      http.getRequest<Request>().headers?.origin
    );

    throw error ?? new UnauthorizedException();
  }
}
