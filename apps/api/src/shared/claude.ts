import Anthropic from "@anthropic-ai/sdk";
import {
  BadGatewayException,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { callOpenAi, openAiModel, outputText } from "./openai";

const logger = new Logger("Claude");
let client: Anthropic | undefined;

export class ClaudeError extends BadGatewayException {}

export const claudeModel = () =>
  process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

export const aiModel = () =>
  process.env.ANTHROPIC_API_KEY ? claudeModel() : openAiModel();

export const assertAiKey = () => {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    throw new ServiceUnavailableException(
      "Neither ANTHROPIC_API_KEY nor OPENAI_API_KEY is set"
    );
  }
};

export async function callClaude(
  params: Omit<
    Anthropic.MessageCreateParamsNonStreaming,
    "model" | "max_tokens"
  >
): Promise<Anthropic.Message> {
  client ??= new Anthropic({
    defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
      ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
      : undefined,
  });
  let body = { model: claudeModel(), max_tokens: 32000, ...params };
  let message: Anthropic.Message;

  try {
    message = await client.messages.stream(body).finalMessage();

    while (message.stop_reason === "pause_turn") {
      body = {
        ...body,
        messages: [
          ...body.messages,
          { role: "assistant", content: message.content },
        ],
      };
      message = await client.messages.stream(body).finalMessage();
    }
  } catch (error) {
    logger.error(`Claude request failed: ${(error as Error).message}`);
    throw new ClaudeError(`Claude request failed: ${(error as Error).message}`);
  }

  if (
    message.stop_reason === "refusal" ||
    message.stop_reason === "max_tokens"
  ) {
    throw new ClaudeError(`Claude stopped with ${message.stop_reason}`);
  }

  return message;
}

export const messageText = (message: Anthropic.Message) =>
  message.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");

export async function claudeFirst<T>(
  task: string,
  claude: () => Promise<T>,
  openAi: () => Promise<T>
): Promise<T> {
  if (!process.env.ANTHROPIC_API_KEY) return openAi();

  try {
    return await claude();
  } catch (error) {
    if (!(error instanceof ClaudeError) || !process.env.OPENAI_API_KEY) {
      throw error;
    }

    logger.warn(`${task}: ${error.message}, falling back to OpenAI`);

    return openAi();
  }
}

export const generateJson = ({
  task,
  instructions,
  input,
  image,
  name,
  schema,
}: {
  task: string;
  instructions: string;
  input: string;
  image?: string;
  name: string;
  schema: Record<string, unknown>;
}): Promise<{ text: string; model: string }> =>
  claudeFirst(
    task,
    async () => {
      const [, mediaType, data] =
        /^data:(image\/[a-z]+);base64,(.*)$/s.exec(image ?? "") ?? [];
      const message = await callClaude({
        system: instructions,
        messages: [
          {
            role: "user",
            content: image
              ? [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type:
                        mediaType as Anthropic.Base64ImageSource["media_type"],
                      data,
                    },
                  },
                  { type: "text", text: input },
                ]
              : input,
          },
        ],
        output_config: { format: { type: "json_schema", schema } },
      });

      return { text: messageText(message), model: claudeModel() };
    },
    async () => {
      const response = await callOpenAi(process.env.OPENAI_API_KEY!, {
        model: openAiModel(),
        instructions,
        input: image
          ? [
              {
                role: "user",
                content: [
                  { type: "input_text", text: input },
                  { type: "input_image", image_url: image },
                ],
              },
            ]
          : input,
        text: { format: { type: "json_schema", name, strict: true, schema } },
      });

      return { text: outputText(response.output), model: openAiModel() };
    }
  );
