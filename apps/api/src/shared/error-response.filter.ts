import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { isAxiosError } from "axios";
import type { Response } from "express";
import mongoose from "mongoose";
import { ZodValidationException } from "nestjs-zod";

const MAX_LISTED_ISSUES = 3;

export const INTERNAL_ERROR_MESSAGE =
  "Something went wrong on the server. Try again later.";

type TErrorBody = { statusCode: number; message: string } & Record<
  string,
  unknown
>;

const validationMessage = (exception: ZodValidationException) => {
  const issues = (
    exception.getZodError() as {
      issues?: { path: PropertyKey[]; message: string }[];
    }
  )?.issues;

  if (!issues?.length) return "Validation failed";

  const listed = issues
    .slice(0, MAX_LISTED_ISSUES)
    .map(({ path, message }) =>
      path.length ? `${path.map(String).join(".")}: ${message}` : message
    );
  const rest = issues.length - listed.length;

  return `Validation failed: ${listed.join("; ")}${rest > 0 ? ` and ${rest} more` : ""}`;
};

const hostOf = (url: string | undefined) => {
  try {
    return new URL(url ?? "").hostname;
  } catch {
    return "An external service";
  }
};

const fromHttpException = (exception: HttpException): TErrorBody => {
  const statusCode = exception.getStatus();
  const response = exception.getResponse();
  const body: Record<string, unknown> =
    typeof response === "object" && response ? { ...response } : {};
  const raw = typeof response === "string" ? response : body.message;
  const message =
    exception instanceof ZodValidationException
      ? validationMessage(exception)
      : Array.isArray(raw)
        ? raw.join("; ")
        : typeof raw === "string" && raw.trim()
          ? raw
          : exception.message || "Request failed";

  return { ...body, statusCode, message };
};

export const toErrorBody = (exception: unknown): TErrorBody => {
  if (exception instanceof HttpException) return fromHttpException(exception);

  if (exception instanceof mongoose.Error.CastError) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: `Invalid ${exception.path}: ${String(exception.value).slice(0, 100)}`,
    };
  }

  if (exception instanceof mongoose.Error.ValidationError) {
    return { statusCode: HttpStatus.BAD_REQUEST, message: exception.message };
  }

  const error = exception as {
    code?: unknown;
    keyValue?: Record<string, unknown>;
    status?: unknown;
    expose?: unknown;
    message?: unknown;
  } | null;

  if (error?.code === 11000) {
    const fields = Object.keys(error.keyValue ?? {}).join(", ");

    return {
      statusCode: HttpStatus.CONFLICT,
      message: fields
        ? `A record with this ${fields} already exists`
        : "This record already exists",
    };
  }

  if (isAxiosError(exception)) {
    const host = hostOf(exception.config?.url);

    return {
      statusCode: HttpStatus.BAD_GATEWAY,
      message: exception.response
        ? `${host} answered ${exception.response.status}`
        : `${host} could not be reached`,
    };
  }

  if (
    typeof error?.status === "number" &&
    error.status >= 400 &&
    error.status < 500 &&
    error.expose === true &&
    typeof error.message === "string"
  ) {
    return { statusCode: error.status, message: error.message };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: INTERNAL_ERROR_MESSAGE,
  };
};

@Catch()
export class ErrorResponseFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorResponseFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const body = toErrorBody(exception);

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        (exception as Error)?.message ?? String(exception),
        (exception as Error)?.stack
      );
    }

    if (response.headersSent) return;

    response.status(body.statusCode).json(body);
  }
}
