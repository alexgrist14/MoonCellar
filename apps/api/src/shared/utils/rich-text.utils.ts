import * as sanitizeHtml from "sanitize-html";

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "s",
    "code",
    "pre",
    "h3",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "nofollow noopener noreferrer",
    }),
  },
};

const hasContent = (html: string) => {
  if (html.includes("<img")) return true;

  return !!sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim()
    .length;
};

export const sanitizeRichText = (html?: string | null): string | undefined => {
  if (html === undefined || html === null) return undefined;

  const clean = sanitizeHtml(html, options);

  return hasContent(clean) ? clean : "";
};
