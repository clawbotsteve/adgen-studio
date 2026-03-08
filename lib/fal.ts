import { fal } from "@fal-ai/sdk";
const client = new fal.Fal({
  authToken: process.env.FAL_API_KEY || "",
});

export { client };
