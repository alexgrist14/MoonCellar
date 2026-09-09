import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from "@nestjs/common";
import { jwtDecode } from "jwt-decode";

@Injectable()
export class UserIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const userIdFromClient = request.headers["x-user-id"];

    const token: { id: string } = jwtDecode(request.cookies.accessMoonToken);

    if (
      !token?.id ||
      !userIdFromClient ||
      token.id !== String(userIdFromClient)
    ) {
      throw new BadRequestException("Wrong user");
    }

    return true;
  }
}
