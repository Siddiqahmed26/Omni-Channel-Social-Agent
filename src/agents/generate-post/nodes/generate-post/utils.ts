import { filterLinksForPostContent } from "../../../utils.js";

/**
 * Strips Markdown formatting from a string.
 * Social platforms like LinkedIn and Twitter render markdown as literal characters,
 * so **bold** appears as **bold** instead of bold text.
 */
function stripMarkdown(text: string): string {
  return text
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    // Italic: *text* or _text_
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    // Headers: # H1, ## H2, etc.
    .replace(/^#{1,6}\s+/gm, "")
    // Inline code: `code`
    .replace(/`(.+?)`/g, "$1")
    // Strikethrough: ~~text~~
    .replace(/~~(.+?)~~/g, "$1")
    // Markdown links: [text](url) → keep text and url
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .trim();
}

/**
 * Parse the LLM generation to extract the report from inside the <report> tag.
 * If the report can not be parsed, the original generation is returned.
 * @param generation The text generation to parse
 * @returns The parsed generation, or the unmodified generation if it cannot be parsed
 */
export function parseGeneration(generation: string): string {
  // Always strip internal tags first to prevent leaks
  let cleaned = generation
    .replace(/<(thinking|original-post)>[\s\S]*?<\/\1>/gi, "")
    .trim();

  const reportMatch = cleaned.match(/<post>([\s\S]*?)<\/post>/i);
  if (!reportMatch) {
    console.warn(
      "Could not parse post from generation:\nSTART OF POST GENERATION\n\n",
      generation,
      "\n\nEND OF POST GENERATION",
    );
    // Fallback: If regex fails to find <post> tags, strip them if they exist and return what's left
    const fallback = cleaned
      .replace(/```xml\s*<post>/gi, "")
      .replace(/<post>/gi, "")
      .replace(/<\/post>\s*```/gi, "")
      .replace(/<\/post>/gi, "")
      .trim();
    return stripMarkdown(fallback);
  }

  // Clean up any potential markdown wrappings inside the matched content
  let final = reportMatch[1].trim();
  final = final.replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "");

  return stripMarkdown(final);
}


export function formatPrompt(report: string, relevantLinks: string[]): string {
  return `Here is the report I wrote on the content I'd like promoted by LangChain:
<report>
${report}
</report>

Here are the relevant links used to create the report.
You should remove tracking query parameters from the link, if present.
If you are unsure whether a link's parameters are tracking, do not remove them. It's better to have a link with tracking parameters than a broken link.
The links do NOT contribute to the post's length. They are temporarily removed from the post before the length is calculated, and re-added afterwards.
<links>
${filterLinksForPostContent(relevantLinks)}
</links>`;
}
