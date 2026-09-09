import { FC } from "react";

interface IJsonLdProps {
  data: Record<string, unknown>;
}

export const JsonLd: FC<IJsonLdProps> = ({ data }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    }}
  />
);
