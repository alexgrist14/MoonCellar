import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtGuard extends AuthGuard("jwt") {
  handleRequest<TUser>(_error: unknown, user: TUser): TUser {
    return user || (null as TUser);
  }
}
