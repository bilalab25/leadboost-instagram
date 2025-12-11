import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

export async function generateBrandAssetDescription(
  imageUrl: string,
): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const prompt = `
You are an expert brand identity analyst and visual language classifier.

Your task: Generate a **highly detailed visual description** optimized specifically for **AI image generation training**.

The goal is to extract the visual identity from this image in a way that future generated images can imitate the same brand style.

Return a **single, dense paragraph** that includes:

1. **Dominant Color Palette** (use specific color terms, like “deep charcoal gray”, “soft beige highlight”, “golden undertones”)
2. **Lighting Style** (softbox, backlit, hard rim-light, diffused shadows, glossy highlights, etc.)
3. **Texture & Material Feel** (matte, glossy, wet, velvety, metallic reflections, powdery, creamy)
4. **Composition Type** (macro close-up, product hero shot, flat lay, editorial lifestyle, minimal centered, rule-of-thirds)
5. **Camera / Perspective** (45-degree angle, eye-level, overhead, extreme macro, depth-of-field blur)
6. **Mood / Emotional Tone** (premium, clinical, warm, dramatic, aspirational, energetic)
7. **Key Visual Elements** (shape, material, background style, surrounding elements)
8. **GENERATIVE VISUAL TOKENS** (e.g., “high-contrast glossy highlights”, “soft cinematic haze”, “gradient backdrop”, “hyper-detailed texture rendering”)

Rules:
- DO NOT mention brand names or add any fictional text.
- DO NOT guess text printed on labels.
- DO NOT use opinions.
- Focus ONLY on visual cues that an AI image model could imitate.
- Be technical, descriptive, and specific. 
- This description will be used to synthesize the visual style of the brand in image generation.

Respond with ONLY the paragraph.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: base64,
            mimeType: "image/jpeg",
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
    return "Error generating automatic description for this asset.";
  }
}
