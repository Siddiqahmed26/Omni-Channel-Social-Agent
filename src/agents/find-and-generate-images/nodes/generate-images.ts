import { GoogleGenAI, Part } from "@google/genai";
import {
  getMimeTypeFromUrl,
  imageUrlToBuffer,
  retryWithTimeout,
} from "../../utils.js";
import { FindAndGenerateImagesAnnotation } from "../find-and-generate-images-graph.js";
import {
  uploadImageBufferToSupabase,
} from "../helpers.js";

const GEMINI_MODEL = "gemini-3-pro-image-preview";

const GENERATE_IMAGE_PROMPT_TEMPLATE = {
  role: "Premium AI Social Media Visual Designer",
  purpose:
    "Create ultra-modern, futuristic, high-impact social media hero graphics for AI / Tech posts. The design must look viral, premium, and trending on LinkedIn and Twitter.",
  design_style_requirements: {
    background: "Dark futuristic gradient background (deep navy, violet, electric blue, neon purple)",
    visual_elements: [
      "Glowing neural network particles, flowing light streaks, cyber UI holographic elements",
      "Glassmorphism floating panel in CENTER",
      "Soft neon rim light + depth blur + cinematic lighting",
      "Abstract AI circuits, data streams, digital grid atmosphere",
    ],
    typography_space: "Minimal clean typography space in center (leave safe empty space for post headline)",
    aesthetic: "Premium startup branding feel (like Apple AI launch / OpenAI keynote visuals)",
    quality: "Sharp contrast + high clarity + 4K social media ready composition",
    vibe: [
      "Modern tech conference slide aesthetic",
      "Trending 'AI future' vibe — powerful, bold, visionary",
    ],
  },
  strict_exclusions: [
    "No outer frames",
    "No content spotlight template layout",
    "No logos or watermarks",
    "No text paragraphs",
    "No collage layout",
    "No stock illustration style",
    "No cartoon style",
    "No flat 2D architecture diagrams",
    "No whiteboard sketches or hand-drawn elements",
    "No crowded flowcharts or process diagrams",
    "No parenthetical labels like (AI) or (Input)",
    "No color legends, swatches, or hex codes (#FFFFFF)",
    "No ALL CAPS TEXT",
  ],
  composition: {
    layout: "Single strong centered hero visual",
    spacing: "Balanced negative space for caption overlay",
    crop: "Designed for square + landscape crop compatibility",
    impact: "Social media scroll-stopping impact",
  },
  input: {
    report: "{REPORT}",
    post: "{POST}",
    style_variation: "{STYLE_VARIATION}",
  },
};

const STYLE_VARIATIONS = [
  `Deep Midnight Blue gradient background with Electric Violet neural flows and Neon Cyan rim lighting.`,
  `Cyberpunk dark aesthetic. Deep violet background with glowing cyan data links and glassmorphism UI elements.`,
  `Dark high-tech layout. Deep blue to black gradient. Accents of neon violet and soft blue holographic particles.`,
  `Visionary AI launch aesthetic. Dark minimalist background with a glowing neural core and soft neon cyan atmospheric light.`,
  `Premium tech-startup style. Deep navy gradient, glassmorphism panels, and vibrant electric violet energy waves.`,
];

const getPromptString = (
  report: string,
  post: string,
  styleVariation: string,
): string => {
  const promptWithInput = {
    ...GENERATE_IMAGE_PROMPT_TEMPLATE,
    input: {
      report,
      post,
      style_variation: styleVariation,
    },
  };
  return JSON.stringify(promptWithInput, null, 2);
};

export async function generateImageWithNanoBananaPro(
  report: string,
  post: string,
  imageUrls: string[],
  variationIndex: number = 0,
): Promise<{ data: string; mimeType: string }> {
  const client = (() => {
    const vertexCreds = process.env.GOOGLE_VERTEX_AI_WEB_CREDENTIALS || process.env.GOOGLE_WEB_CREDENTIALS;
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

    throw new Error("Neither Google credentials nor GOOGLE_API_KEY is set for image generation.");
  })();

  const styleVariation =
    STYLE_VARIATIONS[variationIndex % STYLE_VARIATIONS.length];

  const prompt = getPromptString(report, post, styleVariation);

  const contents: (string | Part)[] = [prompt];

  // Add reference images (limit to 2 to avoid token limits)
  const referenceImagesWithOmissions = await Promise.all(
    imageUrls.slice(0, 2).map(async (url) => {
      try {
        const { buffer, contentType } = await imageUrlToBuffer(url);

        if (!contentType.startsWith("image/")) {
          console.warn("Skipping non-image content type", { url, contentType });
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
        temperature: 1.2 + Math.random() * 0.6,
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: "16:9" },
      },
    });

  const retryOpts = { maxRetries: 3, baseDelayMs: 3000, timeoutMs: 120_000 };

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

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error("No image generated");
  }

  const imagePart = parts.find((part) =>
    part.inlineData?.mimeType?.startsWith("image/"),
  );
  if (!imagePart?.inlineData) {
    throw new Error("No image data in response");
  }

  return {
    data: imagePart.inlineData.data as string, // Safe to cast as string as we have checked that the data is base64 encoded.
    mimeType: imagePart.inlineData.mimeType as string, // Safe to cast as string as we have checked that the MIME type is valid.
  };
}

export async function generateImageCandidatesForPost(
  state: typeof FindAndGenerateImagesAnnotation.State,
) {
  const {
    report,
    post,
    imageOptions: imageUrls,
    image_candidates: existingCandidates,
  } = state;

  if (!process.env.GOOGLE_VERTEX_AI_WEB_CREDENTIALS && !process.env.GOOGLE_WEB_CREDENTIALS && !process.env.GOOGLE_API_KEY) {
    console.warn(
      "Google credentials or GOOGLE_API_KEY not set. Skipping image generation.",
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

  // Generate 1 high-quality image variation (prevents saturating backend/blocking UI)
  const numVariations = 1;

  console.log(`[IMAGE GEN] Generating ${numVariations} image variation...`);

  const batchResults = await Promise.allSettled(
    Array.from({ length: numVariations }, (_, index) =>
      generateImageWithNanoBananaPro(report, post, imageUrls ?? [], index)
    )
  );

  const imageResults: { data: string; mimeType: string }[] = [];
  for (const result of batchResults) {
    if (result.status === "fulfilled") {
      imageResults.push(result.value);
    } else {
      console.error("[IMAGE GEN] Failed to generate image variation", { error: result.reason });
    }
  }

  console.log(`[IMAGE GEN] ${imageResults.length}/${numVariations} images generated successfully.`);


  // Upload all generated images in parallel
  const uploadedUrlsWithOmissions = await Promise.all(
    imageResults.map(async ({ data }) => {
      try {
        const imageBuffer = Buffer.from(data, "base64");
        return await uploadImageBufferToSupabase(
          imageBuffer,
          `nano-banana-pro-full-bleed`,
        );
      } catch (error) {
        console.error("[IMAGE GEN] Failed to upload generated image", { error });
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

