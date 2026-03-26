import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function generateBrandAssetDescription(
  imageUrl: string,
): Promise<string> {
  try {
    // Fetch image with timeout and status check
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    let response: Response;
    try {
      response = await fetch(imageUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch image: HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`URL does not point to an image (content-type: ${contentType})`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Determine mime type from response headers
    const mimeType = contentType.split(";")[0].trim() || "image/jpeg";

    const prompt = `
    You are an expert brand identity analyst and visual language classifier.

    Your task: Generate a **highly detailed and exhaustive visual description** optimized specifically for **AI image generation training**. The output must serve as a perfect Factual Datasheet for the asset shown.

    Return a **comprehensive text** structured into two mandatory sections. DO NOT include any introductory or concluding text outside of the section headers.

    ---
    ### SECTION A: ASSET AND SUBJECT FIDELITY (MANDATORY TECHNICAL DETAIL)
    The goal of this section is to describe the primary subject with **absolute technical precision** so it can be replicated without error. Include:

    1. **Asset Type & Subject:** Clearly identify the asset's function (e.g., "Product Hero Shot," "Location Photo," "Marketing Template") and provide a **complete, technical description of the primary object or scene**.
    2. **Key Factual Details:** Precisely detail the **exact material, color, finish, texture, and specific physical features** of the subject.
    3. **Geometry/Arrangement:** Describe the shape of the product/subject or the specific arrangement/composition of elements.

    ---
    ### SECTION B: VISUAL STYLING SYNTHESIS
    The goal of this section is to describe the style, lighting, and mood for future inspiration. Include:

    1. **Dominant Color Palette** (use specific color terms)
    2. **Lighting Style** (softbox, high-key, hard rim-light, etc.)
    3. **Composition Type** (macro close-up, flat lay, minimal centered, etc.)
    4. **Mood / Emotional Tone** (premium, clinical, rustic, warm, etc.)
    5. **GENERATIVE VISUAL TOKENS** (photorealistic 8K render, high-contrast glossy highlights, etc.)
    ---

    Rules:
    - DO NOT mention brand names, add fictional text, or use opinions.
    - Focus ONLY on verifiable visual cues that an AI image model can imitate.
    - The output MUST start with '### SECTION A:'.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: base64,
            mimeType,
          },
        },
        { text: prompt },
      ],
      config: {
        responseModalities: [Modality.TEXT],
      },
    });

    return result?.text?.trim() || "No description generated.";
  } catch (error) {
    console.error("[BrandAsset] Error generating description:", error);
    throw error; // Let the route handler return proper error response
  }
}
