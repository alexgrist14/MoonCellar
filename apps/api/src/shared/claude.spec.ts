import { BadRequestException } from "@nestjs/common";
import { ClaudeError, claudeFirst } from "./claude";

describe("claudeFirst", () => {
  const claude = jest.fn();
  const openAi = jest.fn();

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "anthropic";
    process.env.OPENAI_API_KEY = "openai";
    claude.mockReset();
    openAi.mockReset().mockResolvedValue("openai");
  });

  it("asks Claude first", async () => {
    claude.mockResolvedValue("claude");

    await expect(claudeFirst("test", claude, openAi)).resolves.toBe("claude");
    expect(openAi).not.toHaveBeenCalled();
  });

  it("falls back to OpenAI when the Claude request fails", async () => {
    claude.mockRejectedValue(new ClaudeError("Claude request failed: 529"));

    await expect(claudeFirst("test", claude, openAi)).resolves.toBe("openai");
  });

  it("does not retry an error that is not Claude's", async () => {
    claude.mockRejectedValue(new BadRequestException("Bad query"));

    await expect(claudeFirst("test", claude, openAi)).rejects.toThrow(
      "Bad query"
    );
    expect(openAi).not.toHaveBeenCalled();
  });

  it("keeps the Claude error when there is no OpenAI key", async () => {
    delete process.env.OPENAI_API_KEY;
    claude.mockRejectedValue(new ClaudeError("Claude request failed: 529"));

    await expect(claudeFirst("test", claude, openAi)).rejects.toThrow(
      "Claude request failed: 529"
    );
  });

  it("goes straight to OpenAI without an Anthropic key", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    await expect(claudeFirst("test", claude, openAi)).resolves.toBe("openai");
    expect(claude).not.toHaveBeenCalled();
  });
});
