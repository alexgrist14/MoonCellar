import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import mongoose from "mongoose";
import { ZodValidationException } from "nestjs-zod";
import { z } from "zod";
import { INTERNAL_ERROR_MESSAGE, toErrorBody } from "./error-response.filter";

describe("toErrorBody", () => {
  it("keeps the message and the extra fields of an HTTP exception", () => {
    expect(
      toErrorBody(
        new ConflictException({ message: "Duplicate", duplicates: [1] })
      )
    ).toEqual({ statusCode: 409, message: "Duplicate", duplicates: [1] });
    expect(toErrorBody(new NotFoundException("Game not found"))).toMatchObject({
      statusCode: 404,
      message: "Game not found",
    });
  });

  it("gives an exception without a message the status text", () => {
    expect(toErrorBody(new UnauthorizedException()).message).toBe(
      "Unauthorized"
    );
  });

  it("joins a list of messages into one sentence", () => {
    expect(
      toErrorBody(new BadRequestException(["name is empty", "email is bad"]))
        .message
    ).toBe("name is empty; email is bad");
  });

  it("names the fields a Zod validation rejected", () => {
    const result = z
      .object({ name: z.string(), take: z.number().max(50) })
      .safeParse({ take: 99 });
    const body = toErrorBody(new ZodValidationException(result.error));

    expect(body.statusCode).toBe(400);
    expect(body.message).toMatch(/^Validation failed: name: .+; take: .+/);
    expect(body.errors).toHaveLength(2);
  });

  it("answers a malformed id with 400", () => {
    const error = new mongoose.Error.CastError("ObjectId", "abc", "_id");

    expect(toErrorBody(error)).toEqual({
      statusCode: 400,
      message: "Invalid _id: abc",
    });
  });

  it("answers a duplicate key with 409", () => {
    expect(toErrorBody({ code: 11000, keyValue: { slug: "x" } })).toEqual({
      statusCode: 409,
      message: "A record with this slug already exists",
    });
  });

  it("names the external service that failed", () => {
    const config = {
      url: "https://api.igdb.com/v4/games",
    } as InternalAxiosRequestConfig;
    const failed = new AxiosError("fail", "ERR", config, null, {
      status: 429,
    } as never);
    const unreachable = new AxiosError("fail", "ECONNREFUSED", config);

    expect(toErrorBody(failed)).toEqual({
      statusCode: 502,
      message: "api.igdb.com answered 429",
    });
    expect(toErrorBody(unreachable).message).toBe(
      "api.igdb.com could not be reached"
    );
  });

  it("keeps the status and text of a body-parser error", () => {
    expect(
      toErrorBody(
        Object.assign(new Error("request entity too large"), {
          status: 413,
          expose: true,
        })
      )
    ).toEqual({ statusCode: 413, message: "request entity too large" });
  });

  it("never sends an unknown error's own text", () => {
    expect(toErrorBody(new Error("connection string leaked"))).toEqual({
      statusCode: 500,
      message: INTERNAL_ERROR_MESSAGE,
    });
  });
});
