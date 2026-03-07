import FirecrawlApp from "@mendable/firecrawl-js";

/**
 * Extracts image URLs from FireCrawl metadata by combining both regular image and OpenGraph image fields.
 * @param {any} metadata - The metadata object from FireCrawl containing potential image information
 * @returns {string[] | undefined} An array of image URLs if any images are found, undefined otherwise
 */
export function getImagesFromFireCrawlMetadata(
  metadata: any,
): string[] | undefined {
  const image = metadata.image || [];
  const ogImage = metadata.ogImage ? [metadata.ogImage] : [];
  if (image?.length || ogImage?.length) {
    return [...ogImage, ...image];
  }
  return undefined;
}

/**
 * Centrally manages web scraping using the native Firecrawl SDK.
 * Bypasses LangChain wrappers to avoid version conflicts.
 */
export async function scrapeUrl(url: string) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not set in environment variables.");
  }

  const app = new (FirecrawlApp as any)({ apiKey });

  const result = await app.scrapeUrl(url, {
    formats: ["markdown", "screenshot"],
  });

  if (!result.success) {
    throw new Error(`Firecrawl failed to scrape ${url}: ${result.error}`);
  }

  return {
    content: result.markdown || "",
    imageUrls: getImagesFromFireCrawlMetadata(result.metadata) || [],
  };
}
