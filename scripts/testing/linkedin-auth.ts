import { getLangGraphClient } from "../src/agents/shared/nodes/langgraph-client.js";
import { LinkedInClient } from "../src/clients/linkedin.js";
import Arcade from "@arcadeai/arcadejs";

async function main() {
  const arcade = new Arcade({ apiKey: process.env.ARCADE_API_KEY });
  const userId = "siddiqahmed@gmail.com";
  
  const authRes = await arcade.auth.start(userId, "linkedin", {
    scopes: ["w_member_social", "w_organization_social"],
  });
  
  console.log("Token exists?", !!authRes.context?.token);
  
  if (authRes.context?.token) {
    const res = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authRes.context.token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: `urn:li:person:${authRes.context.user_info?.sub}`,
          serviceRelationships: [
            { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }
          ]
        }
      })
    });
    console.log("Status:", res.status, await res.text());
  }
}
main().catch(console.error);
