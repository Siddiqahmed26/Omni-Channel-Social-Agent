import { GoogleGenAI, Part } from "@google/genai";
import OpenAI from "openai";
import {
  getMimeTypeFromUrl,
  imageUrlToBuffer,
  retryWithTimeout,
} from "../../utils.js";
import { FindAndGenerateImagesAnnotation } from "../find-and-generate-images-graph.js";
import {
  uploadImageBufferToSupabase,
} from "../helpers.js";

const GEMINI_MODEL = "gemini-2.0-flash-exp";

const VARIATION_DIRECTIONS = [
  "Approach A: Highly abstract and metaphorical. Create a completely novel, unexpected color palette that perfectly captures the underlying emotion of the text.",
  "Approach B: Cinematic, ultra-realistic, or highly stylized 3D. Emphasize physical textures, dramatic unique lighting, and an engaging environment that tells a visual story.",
];

// ─── Topic-aware prompt builder (used by GPT-Image-1 & DALL-E 3) ───────────
function buildCreativePrompt(
  post: string,
  variationDirection: string,
  options?: { report?: string },
): string {
  const postSnippet = post.slice(0, 500);
  const reportContext = options?.report
    ? `\n\nAdditional context: "${options.report.slice(0, 300)}"`
    : "";

  return `You are a world-class visual designer creating a premium social media hero image.

CONTENT TO VISUALIZE:
"${postSnippet}"${reportContext}

CRITICAL: Analyze the content above deeply. Identify the CORE TOPIC, INDUSTRY, and EMOTION, then design an image that DIRECTLY relates to that specific subject. Use visual metaphors that match the topic:
- Finance/Money → sleek dashboards, currency flows, growth charts, digital wallets
- AI/ML → neural patterns, intelligent data flows, brain-circuit hybrids
- Developer Tools/Code → clean IDE aesthetics, code architecture, modular components
- Marketing/Social → connected networks, audience reach, engagement pulses
- Health/Wellness → vitality, motion, organic energy, clean living
- Education/Learning → knowledge pathways, illumination, discovery
- Productivity → streamlined workflows, organized systems, efficiency visuals
- General Tech → futuristic interfaces, connected devices, innovation
Use your best judgment for any other topic — ALWAYS make it relevant to the content.

VISUAL STYLE & COLORS:
You MUST invent a completely UNIQUE aesthetic and color palette for this specific post. DO NOT rely on generic solid colors or overused 'cyberpunk' gradients. Instead, derive the colors, textures, and mood directly from the text's emotion and theme.
${variationDirection}

DESIGN REQUIREMENTS:
- Single powerful hero composition that visually tells the story of the content
- Cinematic lighting with depth-of-field, volumetric glow, and atmospheric effects
- Modern glassmorphism, subtle 3D elements, or abstract fluid shapes where fitting
- Clean center region suitable for text overlay (balanced negative space)
- Photorealistic premium digital art quality — ultra-sharp, 4K ready
- Aspect ratio: landscape 16:9
- Must feel like a premium tech conference keynote slide or top-tier editorial cover

STRICT RULES — MUST FOLLOW:
- ABSOLUTELY NO text, words, letters, numbers, or labels anywhere in the image
- NO logos, watermarks, or branding elements
- NO outer frames, borders, or device mockups
- NO cartoon, clip-art, or flat illustration style
- NO generic stock photo look
- NO crowded or busy compositions — maintain visual breathing room

Create a stunning, topic-relevant, scroll-stopping hero image.`;
}

// ─── Structured Gemini prompt template ──────────────────────────────────────
const GENERATE_IMAGE_PROMPT_TEMPLATE = {
  role: "Premium Visual Designer for Social Media",
  purpose:
    "Create stunning, TOPIC-RELEVANT social media hero graphics. Analyze the post content to determine the correct visual theme. Do NOT default to generic futuristic tech imagery — match the visuals to the actual subject matter of the post.",
  design_approach: {
    step1:
      "Read the post and report to identify the core topic, emotion, and industry",
    step2:
      "Choose visual metaphors and imagery that directly represent that specific topic. Avoid generic tech aesthetics unless it directly fits.",
    step3: "Invent a 100% unique aesthetic and color palette tailored specifically to the post's mood.",
    step4:
      "Compose a single cinematic hero visual with premium quality and clean space for text",
  },
  design_requirements: {
    composition:
      "Single strong centered hero visual with clean negative space for text overlay",
    quality:
      "Sharp contrast, high clarity, 4K social media ready, photorealistic or premium digital art",
    lighting:
      "Cinematic volumetric lighting with depth blur and atmospheric glow",
    elements:
      "Glassmorphism panels, 3D floating objects, fluid shapes, or relevant conceptual imagery matching the topic",
    relevance:
      "Visual metaphors MUST relate to the actual post topic — never use generic imagery",
  },
  strict_exclusions: [
    "No text, words, letters, or numbers in the image",
    "No logos or watermarks",
    "No outer frames or borders",
    "No cartoon or clip-art style",
    "No stock illustration feel",
    "No flat 2D architecture diagrams",
    "No crowded busy compositions",
  ],
  input: {
    report: "{REPORT}",
    post: "{POST}",
    variation_direction: "{VARIATION_DIRECTION}",
  },
};

const getPromptString = (
  report: string,
  post: string,
  variationDirection: string,
): string => {
  const promptWithInput = {
    ...GENERATE_IMAGE_PROMPT_TEMPLATE,
    input: {
      report: report.slice(0, 500),
      post: post.slice(0, 500),
      variation_direction: variationDirection,
    },
  };
  return JSON.stringify(promptWithInput, null, 2);
};

// ─── GPT-Image-1 (Primary OpenAI — best quality & creativity) ──────────────

/**
 * Generate an image using OpenAI GPT-Image-1.
 * This is the most creative and highest-quality OpenAI image model.
 */
export async function generateImageWithGptImage1(
  post: string,
  variationIndex: number = 0,
  options?: { report?: string },
): Promise<{ data: string; mimeType: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set for GPT-Image-1.");
  }

  const openai = new OpenAI({ apiKey });
  const variationDirection =
    VARIATION_DIRECTIONS[variationIndex % VARIATION_DIRECTIONS.length];
  const prompt = buildCreativePrompt(post, variationDirection, options);

  console.log(
    `[IMAGE GEN] Using GPT-Image-1 (primary) with approach ${(variationIndex % VARIATION_DIRECTIONS.length) + 1}...`,
  );

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1536x1024",
    quality: "high",
    response_format: "b64_json",
  });

  const imageData = response.data?.[0]?.b64_json;
  if (!imageData) {
    throw new Error("No image data returned from GPT-Image-1");
  }

  return {
    data: imageData,
    mimeType: "image/png",
  };
}

// ─── DALL-E 3 (Secondary OpenAI fallback) ───────────────────────────────────

/**
 * Generate an image using OpenAI DALL-E 3.
 * Used as a fallback when GPT-Image-1 is unavailable.
 */
export async function generateImageWithDalle3(
  post: string,
  variationIndex: number = 0,
  options?: { report?: string },
): Promise<{ data: string; mimeType: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set for DALL-E 3 fallback.");
  }

  const openai = new OpenAI({ apiKey });
  const variationDirection =
    VARIATION_DIRECTIONS[variationIndex % VARIATION_DIRECTIONS.length];
  const prompt = buildCreativePrompt(post, variationDirection, options);

  console.log(
    `[IMAGE GEN] Using DALL-E 3 (fallback) with approach ${(variationIndex % VARIATION_DIRECTIONS.length) + 1}...`,
  );

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1792x1024",
    quality: "hd",
    style: "vivid",
    response_format: "b64_json",
  });

  const imageData = response.data?.[0]?.b64_json;
  if (!imageData) {
    throw new Error("No image data returned from DALL-E 3");
  }

  return {
    data: imageData,
    mimeType: "image/png",
  };
}

// ─── Gemini / Vertex AI (Google) ────────────────────────────────────────────

export async function generateImageWithNanoBananaPro(
  report: string,
  post: string,
  imageUrls: string[],
  variationIndex: number = 0,
): Promise<{ data: string; mimeType: string }> {
  const client = (() => {
    const vertexCreds =
      process.env.GOOGLE_VERTEX_AI_WEB_CREDENTIALS ||
      process.env.GOOGLE_WEB_CREDENTIALS;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (vertexCreds) {
      const credentials = JSON.parse(vertexCreds);
      return new GoogleGenAI({
        vertexai: true,
        project: credentials.project_id,
        googleAuthOptions: {
          credentials,
        },
      });
    }

    if (apiKey) {
      return new GoogleGenAI({ apiKey });
    }

    throw new Error(
      "Neither Google credentials nor GOOGLE_API_KEY is set for image generation.",
    );
  })();

  const variationDirection =
    VARIATION_DIRECTIONS[variationIndex % VARIATION_DIRECTIONS.length];

  const prompt = getPromptString(report, post, variationDirection);

  const contents: (string | Part)[] = [prompt];

  // Add reference images (limit to 2 to avoid token limits)
  const referenceImagesWithOmissions = await Promise.all(
    imageUrls.slice(0, 2).map(async (url) => {
      try {
        const { buffer, contentType } = await imageUrlToBuffer(url);

        if (!contentType.startsWith("image/")) {
          console.warn("Skipping non-image content type", {
            url,
            contentType,
          });
          return undefined;
        }

        return {
          inlineData: {
            mimeType: contentType,
            data: buffer.toString("base64"),
          },
        };
      } catch (error) {
        console.warn("Failed to load reference image", { url, error });
        return undefined;
      }
    }),
  );

  const validReferenceImages = referenceImagesWithOmissions.filter(
    (d): d is NonNullable<typeof d> => d !== undefined,
  );

  if (validReferenceImages.length > 0) {
    contents.push(...validReferenceImages);
  }

  const generate = (contentsToUse: typeof contents) =>
    client.models.generateContent({
      model: GEMINI_MODEL,
      contents: contentsToUse,
      config: {
        // Fixed: was 1.2–1.8 which caused incoherent/glitchy outputs
        temperature: 0.8 + Math.random() * 0.3,
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: "16:9" },
      },
    });

  const retryOpts = { maxRetries: 1, baseDelayMs: 3000, timeoutMs: 45_000 };

  const response = await retryWithTimeout(
    () => generate(contents),
    retryOpts,
  ).catch(async (error) => {
    const msg = error instanceof Error ? error.message : String(error);
    const isImageError =
      msg.includes("image is not valid") || msg.includes("INVALID_ARGUMENT");

    if (contents.length > 1 && isImageError) {
      console.warn("Reference images rejected, retrying text-only");
      return retryWithTimeout(() => generate([prompt]), retryOpts);
    }

    throw error;
  });

  const parts = (response as any).candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error("No image generated");
  }

  const imagePart = parts.find((part: any) =>
    part.inlineData?.mimeType?.startsWith("image/"),
  );
  if (!imagePart?.inlineData) {
    throw new Error("No image data in response");
  }

  return {
    data: imagePart.inlineData.data as string,
    mimeType: imagePart.inlineData.mimeType as string,
  };
}

// ─── Main entry point ───────────────────────────────────────────────────────

export async function generateImageCandidatesForPost(
  state: typeof FindAndGenerateImagesAnnotation.State,
) {
  const {
    report,
    post,
    imageOptions: imageUrls,
    image_candidates: existingCandidates,
  } = state;

  const hasGoogleCreds = !!(
    process.env.GOOGLE_VERTEX_AI_WEB_CREDENTIALS ||
    process.env.GOOGLE_WEB_CREDENTIALS ||
    process.env.GOOGLE_API_KEY
  );
  const hasOpenAICreds = !!process.env.OPENAI_API_KEY;

  if (!hasGoogleCreds && !hasOpenAICreds) {
    console.warn(
      "[IMAGE GEN] No image generation credentials found. Skipping image generation.",
    );
    return {
      imageOptions: imageUrls,
      image_candidates: existingCandidates,
      image: undefined,
    };
  }

  if (!post) {
    throw new Error("No post content available to generate images");
  }

  // Generate 2 variations with completely different visual approaches
  const numVariations = 2;

  console.log(
    `[IMAGE GEN] Generating ${numVariations} highly unique image variations...`,
  );

  const imageResults: { data: string; mimeType: string }[] = [];

  // Cascade: Gemini → GPT-Image-1 → DALL-E 3
  for (let i = 0; i < numVariations; i++) {
    let result: { data: string; mimeType: string } | undefined;
    const variationIdx = i;

    // 1. Try Gemini (Vertex AI / Google API Key)
    if (hasGoogleCreds) {
      try {
        result = await generateImageWithNanoBananaPro(
          report,
          post,
          imageUrls ?? [],
          variationIdx,
        );
        console.log(
          `[IMAGE GEN] ✅ Gemini succeeded for variation ${i + 1}.`,
        );
      } catch (error) {
        console.warn(
          `[IMAGE GEN] ⚠️ Gemini failed for variation ${i + 1}. Trying GPT-Image-1...`,
          {
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }

    // 2. Try GPT-Image-1 (best OpenAI model)
    if (!result && hasOpenAICreds) {
      try {
        result = await generateImageWithGptImage1(post, variationIdx, {
          report,
        });
        console.log(
          `[IMAGE GEN] ✅ GPT-Image-1 succeeded for variation ${i + 1}.`,
        );
      } catch (error) {
        console.warn(
          `[IMAGE GEN] ⚠️ GPT-Image-1 failed for variation ${i + 1}. Trying DALL-E 3...`,
          {
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }

    // 3. Final fallback: DALL-E 3
    if (!result && hasOpenAICreds) {
      try {
        result = await generateImageWithDalle3(post, variationIdx, {
          report,
        });
        console.log(
          `[IMAGE GEN] ✅ DALL-E 3 fallback succeeded for variation ${i + 1}.`,
        );
      } catch (dalleError) {
        console.error(
          `[IMAGE GEN] ❌ All models failed for variation ${i + 1}.`,
          {
            error:
              dalleError instanceof Error
                ? dalleError.message
                : String(dalleError),
          },
        );
      }
    }

    if (result) {
      imageResults.push(result);
    }
  }

  console.log(
    `[IMAGE GEN] ${imageResults.length}/${numVariations} images generated successfully.`,
  );

  // Upload all generated images in parallel
  const uploadedUrlsWithOmissions = await Promise.all(
    imageResults.map(async ({ data }) => {
      try {
        const imageBuffer = Buffer.from(data, "base64");
        return await uploadImageBufferToSupabase(
          imageBuffer,
          `generated-hero`,
        );
      } catch (error) {
        console.error("[IMAGE GEN] Failed to upload generated image", {
          error,
        });
        return undefined;
      }
    }),
  );

  const uploadedUrls = uploadedUrlsWithOmissions.filter(
    (url): url is NonNullable<typeof url> => url !== undefined,
  );

  const generatedImages = uploadedUrls.map((url) => ({
    imageUrl: url,
    mimeType: getMimeTypeFromUrl(url),
  }));

  const existingCandidatesArray = Array.isArray(existingCandidates)
    ? existingCandidates
    : [];
  const imageUrlsArray = Array.isArray(imageUrls) ? imageUrls : [];

  const randomGeneratedImage =
    generatedImages[Math.floor(Math.random() * generatedImages.length)];

  return {
    imageOptions: [...uploadedUrls, ...imageUrlsArray],
    image_candidates: [...generatedImages, ...existingCandidatesArray],
    image: randomGeneratedImage,
  };
}
