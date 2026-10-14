import { BadGatewayException, Logger } from "@nestjs/common";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const logger = new Logger("OpenAI");

export type IOpenAiOutput =
  | { type: "function_call"; call_id: string; name: string; arguments: string }
  | { type: "message"; content: { type: string; text?: string }[] }
  | { type: string };

export type IOpenAiResponse = {
  id: string;
  output: IOpenAiOutput[];
  usage?: { input_tokens: number; output_tokens: number };
};

export const openAiModel = () => process.env.OPENAI_MODEL || "gpt-5-mini";

export async function callOpenAi(
  apiKey: string,
  body: Record<string, unknown>
): Promise<IOpenAiResponse> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error(`OpenAI request failed: ${res.status} ${text}`);
    throw new BadGatewayException(`OpenAI request failed: ${res.status}`);
  }

  return (await res.json()) as IOpenAiResponse;
}

export const outputText = (output: IOpenAiOutput[]) =>
  output
    .flatMap((item) => ("content" in item ? item.content : []))
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .join("\n");
