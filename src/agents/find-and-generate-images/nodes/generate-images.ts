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
  role: "LangChain Brand Design Agent",
  purpose:
    "Generate a visually striking, futuristic AI-themed promotional image for social media. The image must feel like a premium global AI product launch announcement.",
  core_design_principles: {
    target_audience: ["Developers", "AI Engineers", "Tech Leaders", "Venture Capitalists"],
    tone: ["Visionary", "Innovative", "Powerful", "Next-Generation", "Premium"],
    design_style: {
      aesthetic: "Futuristic Startup Launch / Cyberpunk High-Tech",
      lighting: "Cinematic neon rim lighting, deep shadows, glowing reflections",
      composition: "Modern, high-contrast, optimized for social media engagement with clean negative space",
      elements: [
        "Deep gradient backgrounds (Midnight Blue, Electric Violet, Neon Cyan accents)",
        "Glowing abstract AI neural network patterns or data energy waves",
        "Floating glassmorphism UI panels and holographic tech modules",
        "Subtle floating light particles and futuristic grid depth",
      ],
      constraints: {
        minimal_text: "Use one powerful, bold headline related to the topic. Keep supporting text minimal and crisp.",
        premium_feel: "Avoid flat 2D diagrams, flowcharts, or slide-like visuals. Aim for three-dimensional depth and cinematic quality.",
        no_clutter: "Maintain clarity and scroll-stopping focus. Do not overcrowd the layout.",
        typography: "Use clean, modern sans-serif fonts in high-contrast white or neon colors."
      }
    },
    forbidden_elements: [
      "Flat 2D architecture diagrams",
      "Whiteboard sketches or hand-drawn elements",
      "Crowded flowcharts or process diagrams",
      "Parenthetical labels like (AI) or (Input)",
      "Color legends, swatches, or hex codes (#FFFFFF)",
      "LangChain Community attribution text",
      "Parrot imagery or LangChain logos",
      "ALL CAPS TEXT (use Title Case or Sentence Case)"
    ]
  },
  image_generation_instructions: {
    step_1_analyze_input: "Analyze the report and social media post to extract the core 'Innovation' being announced.",
    step_2_visual_composition: {
      base_style: "Futuristic / Cinematic / High-Tech",
      background: "Rich dark gradient with neon cyan/violet energy flows.",
      foreground: "Centrally focused glassmorphism panel or holographic interface displaying the main theme.",
      detail: "Add depth with floating holographic cards and neural links."
    },
    step_3_typography: {
      headline: "Bold, modern sans-serif. Title Case. High contrast for readability.",
      alignment: "Centered or balanced asymmetric for maximum impact."
    },
    step_4_lighting: "Add vibrant neon rim lights and atmospheric glow to make elements 'pop' off the dark background.",
    step_5_output: "A 16:9 high-resolution image with ultra-sharp details and elegant textures."
  },
  final_reflection: {
    self_check: "Is this a premium, futuristic AI visual? Is it CINEMATIC? Does it avoid flat diagrams? If it looks like a slide or a flowchart, it's WRONG. Aim for an Apple/OpenAI launch aesthetic.",
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

