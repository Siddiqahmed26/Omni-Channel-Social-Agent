import "dotenv/config";
import "dotenv/config";

async function testDelete() {
  const url = "https://cloud.arcade.dev/api/v1/auth";
  const authId = "fake-auth-id";
  
  const headers = {
    Authorization: `Bearer ${process.env.ARCADE_API_KEY}`,
  };

  try {
    const res = await fetch(`${url}/status?id=dummy`, { headers });
    console.log("Status check:", res.status);
    
    // Try some undocumented delete endpoints
    console.log("Testing DELETE /v1/auth/authorizations");
    const d1 = await fetch("https://cloud.arcade.dev/api/v1/auth", { method: "DELETE", headers });
    console.log("DELETE /v1/auth:", d1.status);
    
  } catch(e) { console.error(e); }
}

testDelete();
