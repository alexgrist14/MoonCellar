import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { SignUpDto } from "./dto/signup.dto";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "../user/schemas/user.schema";
import { Model } from "mongoose";
import * as bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { BusinessMetricsService } from "../metrics/business-metrics.service";
import { LoginDto } from "./dto/login.dto";
import { Response } from "express";
import {
  ACCESS_TOKEN,
  accessExpire,
  FRONT_URL,
  REFRESH_TOKEN,
  refreshExpire,
} from "src/shared/constants";
import { IndexNowService } from "../indexnow/indexnow.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly metrics: BusinessMetricsService,
    private readonly indexNow: IndexNowService
  ) {}

  private async generateTokensAndUpdateUser(
    user: User
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const accessToken = this.jwtService.sign(
        {
          id: user._id,
          roles: user.roles,
          userName: user.userName,
          email: user.email,
        },
        { expiresIn: accessExpire }
      );
      const refreshToken = this.jwtService.sign(
        { id: user._id },
        { expiresIn: refreshExpire }
      );

      user.refreshToken = refreshToken;
      await user.save();

      return { accessToken, refreshToken };
    } catch (err) {
      this.logger.error(err, "Failed to generate tokens");
      throw err;
    }
  }

  async signUp(
    signUpDto: SignUpDto
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { userName, email, password } = signUpDto;
      const isEmailExists = await this.userModel.findOne({ email });
      const isUserExists = await this.userModel.findOne({ userName });

      if (isEmailExists) throw new ConflictException("Email already exists");
      if (isUserExists) throw new ConflictException("UserName already exists");

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.userModel.create({
        userName,
        email,
        password: hashedPassword,
      });

      this.metrics.recordRegistration();
      this.indexNow.submitUrl(`${FRONT_URL}/user/${user.userName}`);

      return this.generateTokensAndUpdateUser(user);
    } catch (err) {
      if (
        err instanceof ConflictException ||
        err instanceof BadRequestException ||
        err instanceof UnauthorizedException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }
      this.logger.error(err, "Failed to sign up");
      throw err;
    }
  }

  async login(
    loginDto: LoginDto
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });

    if (!user) throw new BadRequestException("Email does not exists");

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched)
      throw new BadRequestException("Password does not match");

    return this.generateTokensAndUpdateUser(user);
  }

  async refreshToken(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user?.refreshToken) {
      throw new ForbiddenException();
    }

    try {
      const newAccessToken = this.jwtService.sign(
        {
          id: user._id,
          roles: user.roles,
          userName: user.userName,
          email: user.email,
        },
        { expiresIn: accessExpire }
      );

      const newRefreshToken = this.jwtService.sign(
        { id: user._id },
        { expiresIn: refreshExpire }
      );
      user.refreshToken = newRefreshToken;
      await user.save();

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (err) {
      this.logger.error(err, "Failed to refresh token");
      throw err;
    }
  }

  setCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    origin?: string
  ): void {
    const domain = origin?.includes("localhost")
      ? ".localhost"
      : "mooncellar.space";
    const secure = origin?.includes("https") ? true : false;
    const sameSite =
      origin?.includes("localhost") || !secure ? undefined : "none";

    res.cookie(ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      domain: domain,
      secure: secure,
      sameSite: sameSite,
      expires: new Date(Date.now() + accessExpire),
      maxAge: accessExpire,
    });
    res.cookie(REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      domain: domain,
      secure: secure,
      sameSite: sameSite,
      expires: new Date(Date.now() + refreshExpire),
      maxAge: refreshExpire,
    });
  }

  clearCookies(res: Response, origin?: string): void {
    res.clearCookie(ACCESS_TOKEN, {
      httpOnly: !origin?.includes("localhost"),
    });
    res.clearCookie(REFRESH_TOKEN, {
      httpOnly: !origin?.includes("localhost"),
    });
  }

  async logout(userId: string): Promise<void> {
    try {
      const user = await this.userModel.findById(userId).orFail();
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    } catch (err) {
      this.logger.error(err, `Failed to logout: ${userId}`);
      throw err;
    }
  }
}
