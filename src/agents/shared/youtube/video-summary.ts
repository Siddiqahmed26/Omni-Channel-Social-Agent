import { getModel } from "../../shared/nodes/llm.js";
import { getPrompts } from "../../generate-post/prompts/index.js";
import {
  getChannelInfo,
  getVideoThumbnailUrl,
  getYouTubeVideoDetails,
} from "../nodes/youtube.utils.js";
import { shouldExcludeYouTubeContent } from "../../should-exclude.js";

const GENERATE_REPORT_PROMPT = `You are a highly regarded marketing employee at a large software company.
You have been assigned the provided YouTube video, and you need to generate a summary report of the content in the video.
Specifically, you should be focusing on the technical details, why people should care about it, and any problems it solves.
You should also focus on the products the video might talk about (although not all videos will have your company content).

${getPrompts().businessContext}

Given this context, examine the YouTube videos contents closely, and generate a report on the video.
For context, this report will be used to generate a Tweet and LinkedIn post promoting the video and the company products it uses, if any.
Ensure to include in your report if this video is relevant to your company's products, and if so, include content in your report on what the video covered in relation to your company's products.`;

async function generateVideoSummary(url: string, title: string, description: string): Promise<string> {
  const model = getModel({
    temperature: 0,
    preferMini: true,
  });


  const summaryResult = await model
    .withConfig({
      runName: "generate-video-summary-model",
    })
    .invoke([
      {
        role: "system",
        content: GENERATE_REPORT_PROMPT,
      },
      {
        role: "user",
        content: `Please generate a summary report for this YouTube video. \n\nURL: ${url.startsWith("https://") ? url : `https://${url}`}\n\nTitle: ${title}\n\nDescription: ${description}`,
      },
    ]);
  return summaryResult.content as string;
}

export async function getVideoSummary(
  url: string,
  skipExclusionCheck = false,
): Promise<{
  thumbnail: string | undefined;
  summary: string;
}> {
  const [videoDetails, videoThumbnail, channelInfo] = await Promise.all([
    getYouTubeVideoDetails(url),
    getVideoThumbnailUrl(url),
    getChannelInfo(url),
  ]);

  if (!skipExclusionCheck) {
    const shouldExclude = shouldExcludeYouTubeContent(channelInfo.channelName);
    if (shouldExclude) {
      return {
        thumbnail: "",
        summary: "",
      };
    }
  }

  if (videoDetails.duration === undefined) {
    // TODO: Handle this better
    throw new Error("Failed to get video duration");
  }

  // 1800 = 30 minutes
  if (videoDetails.duration > 1800) {
    // TODO: Replace with interrupt requesting user confirm if they want to continue
    throw new Error(
      "Video is longer than 30 minutes, please confirm you want to continue.",
    );
  }

  const videoSummary = await generateVideoSummary(url, videoDetails.title, videoDetails.description);

  return {
    thumbnail: videoThumbnail,
    summary: videoSummary,
  };
}
