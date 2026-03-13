async function deleteArcadeAuth() {
  const apiKey = process.env.ARCADE_API_KEY;
  const userId = 'siddiqahmed.work@gmail.com';
  console.log('Fetching authorizations...');
  
  // They usually have a GET /api/v1/users/:user_id/authorizations or similar,
  // but let's try calling auth.start with prompt=consent or force=true if possible.
  // The Arcade console lets you delete connections. 
  // Let's print out what we can from their dashboard API.
  
  const res = await fetch(`https://api.arcade.dev/api/v1/auth/status?id=siddiqahmed.work@gmail.com`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  console.log(res.status, await res.text());
}

deleteArcadeAuth().catch(console.error);
