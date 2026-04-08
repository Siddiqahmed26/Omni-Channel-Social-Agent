const Arcade = require('@arcadeai/arcadejs').default;
const arcade = new Arcade({ apiKey: process.env.ARCADE_API_KEY });

async function clearTokens() {
  const userId = 'siddiqahmed.work@gmail.com';
  console.log(`Clearing LinkedIn tokens for ${userId}...`);
  try {
    const authorizations = await arcade.auth.list(userId, { provider_id: 'linkedin' });
    console.log("Existing authorizations:", authorizations.data.length);
    for (const auth of authorizations.data) {
      console.log(`Revoking token: ${auth.id}`);
      await arcade.auth.delete(userId, "linkedin");
    }
  } catch (error) {
    console.error("Failed to clear auth:", error.message || error);
  }
}

clearTokens().catch(console.error);
