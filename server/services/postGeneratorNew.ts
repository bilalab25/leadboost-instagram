import { GoogleGenAI, Modality, Type } from "@google/genai";
import cloudinary from "../cloudinary";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

async function fetchImageAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(
        `[PostGenerator] Failed to fetch image from ${url}: ${response.status}`,
      );
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.split(";")[0].trim();

    return { data: base64, mimeType };
  } catch (error) {
    console.error(`[PostGenerator] Error fetching image from ${url}:`, error);
    return null;
  }
}

export async function generateImageWithNanoBanana() {
  const inspirationImage = await fetchImageAsBase64(
    "https://res.cloudinary.com/dgujs7cy9/image/upload/v1771527645/brand-assets/gzji7okddcgplwjmvhgv.jpg",
  );
  const productImage = await fetchImageAsBase64(
    "https://res.cloudinary.com/dgujs7cy9/image/upload/v1771528188/brands/posts/4fc5eb84-75c6-41e1-a06f-744e59a76149/fd6017b7-db1d-4876-a39f-ad361e4eab7e_instagram_2026-02-19.jpg",
  );
  const logo = await fetchImageAsBase64(
    "https://res.cloudinary.com/dgujs7cy9/image/upload/v1771527424/brand-assets/bzq8gbwfyru9pmj4ygn1.png",
  );

  const parts: any[] = [];

  if (inspirationImage) {
    parts.push({
      inlineData: {
        mimeType: inspirationImage.mimeType,
        data: inspirationImage.data,
      },
    });
  }
  if (productImage) {
    parts.push({
      inlineData: {
        mimeType: productImage.mimeType,
        data: productImage.data,
      },
    });
  }
  if (logo) {
    parts.push({
      inlineData: {
        mimeType: logo.mimeType,
        data: logo.data,
      },
    });
  }

  parts.push({
    text: `Brand Name: Inborn
We are a luxury WELLNESS consulting firm specialized in image strategy and brand perception.

Brand identity:
- Primary color: #052f22 (deep elegant green)
- Secondary color: #f1eeec (soft neutral beige)
- Style: luxury

Task:
En la primera imagen se muestra una imagen de inspiración para el post. En la segunda imagen se muestra el producto que se promocionará. En la tercera imagen se muestra el logo de la marca. Genera una imagen de Instagram que combine los elementos de las imágenes de inspiración y el producto, manteniendo el estilo de la marca, el logo debe estar en la esquina inferior derecha.

Strict rules:
- Avoid stock-photo feeling
- Use brand colors subtly and elegantly
- Leave negative space for future headline placement
- If necesary include catchy text to support the image

Output:
Instagram-ready.
`,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: {
        role: "system",
        parts: [
          {
            text: `
            Eres un diseñador gráfico experto en marketing para todo tipo de marcas.
            `,
          },
        ],
      },
      temperature: 1,
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "2K",
      },
    },
  });

  const responseParts = response.candidates?.[0]?.content?.parts;
  if (!responseParts) return null;

  for (const part of responseParts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType || "image/png"};base64,${
        part.inlineData.data
      }`;
    }
  }

  return null;
}

export const saveAndCreateImage = async () => {
  const dataUri = await generateImageWithNanoBanana();

  if (!dataUri) {
    throw new Error("Failed to generate image");
  }

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "test/posts",
    resource_type: "image",
  });

  return result.secure_url;
};
