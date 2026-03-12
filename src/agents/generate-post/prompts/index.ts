import {
  BUSINESS_CONTEXT as LANGCHAIN_BUSINESS_CONTEXT,
  TWEET_EXAMPLES as LANGCHAIN_TWEET_EXAMPLES,
  POST_STRUCTURE_INSTRUCTIONS as LANGCHAIN_POST_STRUCTURE_INSTRUCTIONS,
  POST_CONTENT_RULES as LANGCHAIN_POST_CONTENT_RULES,
  CONTENT_VALIDATION_PROMPT as LANGCHAIN_CONTENT_VALIDATION_PROMPT,
} from "./prompts.langchain.js";
import { EXAMPLES } from "./examples.js";
import { useLangChainPrompts } from "../../utils.js";

export const TWEET_EXAMPLES = EXAMPLES.map(
  (example, index) => `<example index="${index}">\n${example}\n</example>`,
).join("\n");

/**
 * This prompt details the structure the post should follow.
 * Updating this will change the sections and structure of the post.
 * If you want to make changes to how the post is structured, you
 * should update this prompt, along with the `EXAMPLES` list.
 */
export const POST_STRUCTURE_INSTRUCTIONS = `<section key="1">
The first part must be a powerful, scroll-stopping headline or hook. It should be bold, visionary, and concise (ideally under 6 words). Use a single emoji that reflects innovation or energy (e.g., 🚀, 🧠, ✨). This is a product launch/innovation announcement, not a newsletter.
</section>

<section key="2">
This section is the core of the announcement. Describe the "innovation" or "breakthrough" described in the marketing report with a sense of wonder and technical authority.
Focus on the TRANSFORMATIONAL impact—how this changes the game for builders or users.
Keep it punchy: no more than 2-3 short, powerful sentences.
If the content is highly technical, use a sleek bulleted list (max 3 items) with modern icons instead of generic bullets.
The tone should be "The future is here," not "Here is a cool tool."
</section>

<section key="3">
The final section is the call to action. It should be minimal and high-intent (e.g., "Join the revolution:", "Scale your agents:").
Followed immediately by the link.
Ideally 3-5 words only.
</section>`;

/**
 * This prompt is used when generating, condensing, and re-writing posts.
 * You should make this prompt very specific to the type of content you
 * want included/focused on in the posts.
 */
export const POST_CONTENT_RULES = `- TONE: Use a "Modern Tech Startup Launch" voice—bold, innovative, and visionary.
- Focus on the "Next-Gen" or "Revolutionary" aspect of the content.
- NO hashtags.
- NO legacy phrases like "LangChain Community Spotlight".
- Use present tense to maintain urgency.
- Limit emojis to the headline and CTA for a premium feel.
- Negative space is your friend—ensure the post feels uncluttered and scroll-stopping.`;

/**
 * This should contain "business content" into the type of content you care
 * about, and want to post/focus your posts on. This prompt is used widely
 * throughout the agent in steps such as content validation, and post generation.
 * It should be generalized to the type of content you care about, or if using
 * for a business, it should contain details about your products/offerings/business.
 */
export const BUSINESS_CONTEXT = `
Here is some context about the types of content you should be interested in prompting:
<business-context>
- You are an Omni-Channel Social Media Agent.
- You care about ALL valid forms of media and content creation.
- This includes, but is not limited to: AI research, SaaS products, lifestyle vlogs, coding tutorials, indie hacking, corporate news, and entertainment.
- Your primary goal is to take a piece of content (a link to a video, a blog, a GitHub repo, a news article) and distill it into a high-quality social media post.
</business-context>`;

/**
 * A prompt to be used in conjunction with the business context prompt when
 * validating content for social media posts. This prompt should outline the
 * rules for what content should be approved/rejected.
 */
export const CONTENT_VALIDATION_PROMPT = `This content will be used to generate engaging, informative and educational social media posts.
The following are rules to follow when determining whether or not to approve content as valid, or not:
<validation-rules>
- The content must be a valid, readable source of information (e.g., a blog post, a YouTube video transcript/description, a GitHub README, a news article).
- The goal of the final social media post should be to inform, entertain, or educate your followers about the content in the provided link.
- You should approve ALMOST ALL content, provided it is not explicitly spam, malicious, or empty.
- Do not reject content just because it isn't about AI or software. You are an Omni-Channel agent capable of processing anything.
</validation-rules>`;

export function getPrompts() {
  // NOTE: you should likely not have this set, unless you want to use the LangChain prompts
  if (useLangChainPrompts()) {
    return {
      businessContext: LANGCHAIN_BUSINESS_CONTEXT,
      tweetExamples: LANGCHAIN_TWEET_EXAMPLES,
      postStructureInstructions: LANGCHAIN_POST_STRUCTURE_INSTRUCTIONS,
      postContentRules: LANGCHAIN_POST_CONTENT_RULES,
      contentValidationPrompt: LANGCHAIN_CONTENT_VALIDATION_PROMPT,
    };
  }

  return {
    businessContext: BUSINESS_CONTEXT,
    tweetExamples: TWEET_EXAMPLES,
    postStructureInstructions: POST_STRUCTURE_INSTRUCTIONS,
    postContentRules: POST_CONTENT_RULES,
    contentValidationPrompt: CONTENT_VALIDATION_PROMPT,
  };
}
