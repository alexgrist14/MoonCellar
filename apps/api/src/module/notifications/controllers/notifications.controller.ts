import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { IAuthorizedRequest } from "../../comments/types/community.type";
import {
  GetNotificationsRequestDto,
  GetNotificationsResponseDto,
  MarkNotificationsReadRequestDto,
  PushPublicKeyResponseDto,
  PushSubscriptionRequestDto,
  PushUnsubscribeRequestDto,
  UnreadNotificationsResponseDto,
} from "../../../shared/zod/dto/notifications.dto";
import { NotificationsService } from "../services/notifications.service";
import { PushService } from "../services/push.service";

@ApiTags("Notifications")
@ApiCookieAuth()
@Controller("notifications")
@UseGuards(AuthGuard("jwt"))
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly push: PushService
  ) {}

  @Get()
  @ApiOperation({
    summary: "List the viewer's notifications, latest activity first",
  })
  @ApiOkResponse({ type: GetNotificationsResponseDto })
  getList(
    @Req() request: IAuthorizedRequest,
    @Query() dto: GetNotificationsRequestDto
  ) {
    return this.notifications.getList(String(request.user._id), dto);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Count the viewer's unread notifications" })
  @ApiOkResponse({ type: UnreadNotificationsResponseDto })
  getUnreadCount(@Req() request: IAuthorizedRequest) {
    return this.notifications.getUnreadCount(String(request.user._id));
  }

  @Patch("read")
  @ApiOperation({ summary: "Mark some or all notifications as read" })
  @ApiOkResponse({ type: UnreadNotificationsResponseDto })
  markRead(
    @Req() request: IAuthorizedRequest,
    @Body() dto: MarkNotificationsReadRequestDto
  ) {
    return this.notifications.markRead(String(request.user._id), dto);
  }

  @Get("push/public-key")
  @ApiOperation({
    summary: "Get the VAPID public key a browser subscribes to push with",
  })
  @ApiOkResponse({ type: PushPublicKeyResponseDto })
  getPushPublicKey() {
    return this.push.getPublicKey();
  }

  @Post("push/subscriptions")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Save this browser's push subscription" })
  subscribePush(
    @Req() request: IAuthorizedRequest,
    @Body() dto: PushSubscriptionRequestDto
  ) {
    return this.push.subscribe(String(request.user._id), dto);
  }

  @Delete("push/subscriptions")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Forget this browser's push subscription" })
  unsubscribePush(
    @Req() request: IAuthorizedRequest,
    @Body() dto: PushUnsubscribeRequestDto
  ) {
    return this.push.unsubscribe(String(request.user._id), dto.endpoint);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Remove a notification" })
  @ApiOkResponse({ type: UnreadNotificationsResponseDto })
  remove(@Req() request: IAuthorizedRequest, @Param("id") id: string) {
    return this.notifications.remove(String(request.user._id), id);
  }
}
