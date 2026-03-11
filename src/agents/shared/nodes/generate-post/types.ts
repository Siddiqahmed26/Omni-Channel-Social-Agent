import { Annotation, END } from "@langchain/langgraph";
import { DateType } from "../../../types.js";
import { IngestDataAnnotation } from "../../../ingest-data/ingest-data-state.js";
import { VerifyLinksResultAnnotation } from "../../../verify-links/verify-links-state.js";

export type ComplexPost = {
  /**
   * The main post content.
   */
  main_post: string;
  /**
   * The reply post content.
   */
  reply_post: string;
};

const BaseGeneratePostAnnotation = Annotation.Root({
  /**
   * The generated post for LinkedIn/Twitter.
   */
  post: Annotation<string>({
    reducer: (_state, update) => update,
  }),
  /**
   * The complex post, if the user decides to split the URL from the main body.
   *
   * TODO: Refactor the post/complexPost state interfaces to use a single shared interface
   * which includes images too.
   * Tracking issue: https://github.com/langchain-ai/social-media-agent/issues/144
   */
  complexPost: Annotation<ComplexPost | undefined>({
    reducer: (_state, update) => update,
  }),
  /**
   * The date to schedule the post for.
   */
  scheduleDate: Annotation<DateType>({
    reducer: (_state, update) => update,
  }),
  /**
   * The image to attach to the post, and the MIME type.
   */
  image: Annotation<
    | {
        imageUrl: string;
        mimeType: string;
      }
    | undefined
  >({
    reducer: (_state, update) => update,
  }),
  /**
   * The links to use to generate a post.
   */
  links: Annotation<string[]>({
    reducer: (_state, update) => update,
  }),
  /**
   * The report generated on the content of the message. Used
   * as context for generating the post.
   */
  report: IngestDataAnnotation.spec.report,
  ...VerifyLinksResultAnnotation.spec,
  /**
   * The node to execute next.
   */
  next: Annotation<
    | "schedulePost"
    | "rewritePost"
    | "updateScheduleDate"
    | "unknownResponse"
    | "rewriteWithSplitUrl"
    | typeof END
    | undefined
  >({
    reducer: (_state, update) => update,
    default: () => undefined,
  }),
  /**
   * Action to perform for graph routing (e.g., 'disconnect' to restart auth).
   */
  action: Annotation<"disconnect" | undefined>({
    reducer: (_state, update) => update,
    default: () => undefined,
  }),
  /**
   * Response from the user for the post. Typically used to request
   * changes to be made to the post.
   */
  userResponse: Annotation<string | undefined>({
    reducer: (_state, update) => update,
  }),
});

export type BaseGeneratePostState = typeof BaseGeneratePostAnnotation.State;
export type BaseGeneratePostUpdate = typeof BaseGeneratePostAnnotation.Update;
