import { GoogleGenAI } from "@google/genai";
import cloudinary from "../cloudinary";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const BRAND = {
  name: "Renuve Aesthetics Bar",
  colors: ["#4D151C", "#FFFBF5"],
  description: `Renuve Aesthetics Bar es una clínica de medicina estética ubicada en la ciudad de México. Estamos ubicados en Av Prado Norte 427,  Planta Baja, cp 11000.¿Qué es?
    • Es una clínica de medicina estética moderna y profesional, con un enfoque médico-cosmético más que un simple spa o salón de belleza tradicional.
    • Se describe como un “Aesthetics Bar”, es decir, un concepto que combina tratamientos médicos estéticos con una experiencia más relajada, personalizada y amigable que la de clínicas tradicionales.
    • Su objetivo es ayudar a las personas a realzar su belleza natural con resultados sutiles, seguros y bien definidos.
    ¿Quiénes trabajan allí?
    • El equipo está compuesto por médicos certificados y especialistas en medicina estética, entrenados para aplicar tratamientos con altos estándares de seguridad.
    • Utilizan únicamente productos aprobados por organismos como la FDA y COFEPRIS, lo que garantiza calidad y cumplimiento de normas sanitarias.
    ¿Qué tipo de servicios ofrecen?
    Renuve ofrece un menú amplio de servicios médico-estéticos, entre ellos:
    • Botox para líneas de expresión y levantamientos como brow lift.
    • Rellenos con ácido hialurónico, especialmente para labios, pómulos y contornos faciales.
    • Tratamientos faciales: peelings, hidratación, anti-edad, tratamiento de acné, etc.
    • Rejuvenecimiento corporal, contorno corporal, eliminación de grasa localizada.
    • Sauna infrarrojo y otros tratamientos “wellness” de apoyo al cuidado de la piel y bienestar general.
    Concepto y experiencia
    • La clínica busca hacer de cada visita una experiencia personal y accesible, con atención guiada y asesoría antes de decidir cualquier procedimiento.
    • También promueven la idea de que los tratamientos estéticos no tienen por qué ser intimidantes o reservados solo para casos extremos, sino que pueden formar parte de una rutina regular de cuidado personal.
    • El ambiente tiende a ser relajado y “de boutique”, con servicios que apuntan a la comodidad y satisfacción del cliente.
    Sucursales y presencia
    • Aunque la sede principal que aparece listada está en Prado Norte, Ciudad de México, también existen otras ubicaciones en San Ángel (Altavista) y reportes de presencia en San Pedro Garza García, Nuevo León, lo que sugiere que es una marca con varias clínicas.
    Resumen de lo esencial
    ✨ Clínica de medicina estética con enfoque médico y experiencia premium.
    ✨ Servicios como botox, fillers, tratamientos faciales y corporales.
    ✨ Equipo de médicos especializados y productos certificados.
    ✨ Experiencia personalizada que busca realzar la belleza natural. `,
};

const CREATIVE_DIRECTOR_SYSTEM = `
Eres un Director Creativo senior (campañas premium/editorial para social media).
Tu tarea es transformar un brief corto + referencias visuales en un PROMPT CINEMATOGRÁFICO detallado para un generador de imágenes.

REGLAS:
- Extrae la “aesthetic DNA” de la imagen de inspiración (mood, composición, contraste, textura, luz). NO la copies.
- Integra el logo de forma natural como parte de la escena (placa, emboss, etiqueta, impresión en objeto). Debe ser visible pero sutil.
- Prohibido fondo plano y look “stock”.
- Usa los colores de marca de forma elegante (no saturada).
- Deja espacio negativo para copy.

SALIDA:
Devuelve SOLO un bloque de texto llamado IMAGE_PROMPT (sin markdown, sin bullets extra, sin explicaciones).
`;

const IMAGE_RENDER_SYSTEM = `
Eres un generador de imágenes premium para campañas de social media.
Sigue el IMAGE_PROMPT al pie de la letra.
Reglas: sin fondo plano, sin look stock, alta calidad editorial, luz comercial, profundidad y textura.
Integra el logo proporcionado de forma natural y visible (sin deformarlo).
Devuelve SOLO la imagen final.
`;

async function fetchImageAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.split(";")[0].trim();
    return { data: base64, mimeType };
  } catch {
    return null;
  }
}

function asInlinePart(img: { data: string; mimeType: string }) {
  return { inlineData: { mimeType: img.mimeType, data: img.data } };
}

async function buildImagePromptFromBrandOnly(): Promise<string> {
  const parts: any[] = [
    {
      text: `
Marca: ${BRAND.name}
Descripción: ${BRAND.description}
Colores de marca: ${BRAND.colors.join(", ")}

Tarea:
Genera un IMAGE_PROMPT cinematográfico para un visual de Instagram 1:1.
Interpreta el giro de la marca y define una escena premium/editorial con:
- ambiente realista (no fondo plano)
- composición minimal
- iluminación comercial
- texturas y profundidad
- uso elegante de la paleta de marca
- en el espacio negativo agrega un copy relacionado con el giro de la marca.
`,
    },
  ];

  const resp = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: {
        role: "system",
        parts: [{ text: CREATIVE_DIRECTOR_SYSTEM }],
      },
      temperature: 0.7,
    },
  });

  const text =
    resp.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .filter(Boolean)
      .join("\n") || "";

  return text.trim() || `Ultra realistic luxury wellness editorial scene...`;
}

export async function generateImageBrandOnly() {
  const imagePrompt = await buildImagePromptFromBrandOnly();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      {
        role: "user",
        parts: [{ text: `IMAGE_PROMPT:\n${imagePrompt}` }],
      },
    ],
    config: {
      systemInstruction: {
        role: "system",
        parts: [{ text: IMAGE_RENDER_SYSTEM }],
      },
      temperature: 0.8,
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "1:1", imageSize: "4K" },
    },
  });

  const responseParts = response.candidates?.[0]?.content?.parts;
  if (!responseParts) return null;

  for (const part of responseParts as any[]) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
    }
  }
  return null;
}
export async function generateImageBrandOnlyWithLogo() {
  const logoImage = await fetchImageAsBase64(
    "https://res.cloudinary.com/dgujs7cy9/image/upload/v1771527424/brand-assets/bzq8gbwfyru9pmj4ygn1.png",
  );

  const imagePrompt = await buildImagePromptFromBrandOnly();

  const renderParts: any[] = [];
  if (logoImage) renderParts.push(asInlinePart(logoImage));

  renderParts.push({
    text: `IMAGE_PROMPT:\n${imagePrompt}\nLogo must be integrated naturally and remain unchanged.`,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: renderParts }],
    config: {
      systemInstruction: {
        role: "system",
        parts: [{ text: IMAGE_RENDER_SYSTEM }],
      },
      temperature: 0.8,
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "1:1", imageSize: "4K" },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const p of parts as any[]) {
    if (p.inlineData?.data) {
      return `data:${p.inlineData.mimeType || "image/png"};base64,${p.inlineData.data}`;
    }
  }
  return null;
}

/**
 * Paso 1: generar prompt cinematográfico (Holo-like)
 */
async function buildImagePrompt({
  inspirationImage,
  employeeImage,
  logoImage,
}: {
  inspirationImage: { data: string; mimeType: string } | null;
  employeeImage: { data: string; mimeType: string } | null;
  logoImage: { data: string; mimeType: string } | null;
}): Promise<string> {
  const parts: any[] = [];

  if (inspirationImage) parts.push(asInlinePart(inspirationImage));
  if (employeeImage) parts.push(asInlinePart(employeeImage));
  if (logoImage) parts.push(asInlinePart(logoImage));

  parts.push({
    text: `
Marca: ${BRAND.name}
Descripción: ${BRAND.description}
Colores de marca: ${BRAND.colors.join(", ")}

Instrucciones:
- Imagen 1: inspiración de feed/estilo
- Imagen 2: empleado/protagonista
- Imagen 3: logo para integrar

Genera un IMAGE_PROMPT cinematográfico para un visual de Instagram 1:1.
Debe describir: escena/ambiente realista, composición, iluminación, texturas, paleta, profundidad de campo, y cómo integrar el logo de forma natural.
No fondo plano. No stock look.
En el espacio negativo agrega un copy relacionado con el giro de la marca.
`,
  });

  const resp = await ai.models.generateContent({
    model: "gemini-2.5-flash", // ✅ texto (más “cerebro” para dirección de arte)
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: {
        role: "system",
        parts: [{ text: CREATIVE_DIRECTOR_SYSTEM }],
      },
      temperature: 0.6,
    },
  });

  const text =
    resp.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .filter(Boolean)
      .join("\n") || "";

  // fallback por si viene vacío
  return text.trim() || `Ultra realistic luxury wellness editorial scene...`;
}

/**
 * Paso 2: render de imagen usando el prompt cinematográfico
 */
export async function generateImageWithNanoBanana() {
  const inspirationImage = await fetchImageAsBase64(
    "https://res.cloudinary.com/dgujs7cy9/image/upload/v1771519348/brand-assets/fqwnn2umwej0hl4t7xnh.png",
  );
  const employeeImage = await fetchImageAsBase64(
    "https://res.cloudinary.com/dgujs7cy9/image/upload/v1771519370/brand-assets/o1pczo5xejw5pu25d4fo.png",
  );
  const logoImage = await fetchImageAsBase64(
    "https://res.cloudinary.com/dgujs7cy9/image/upload/v1771518855/brand-assets/yikfmndq043yrljol7nc.png",
  );

  // ✅ Paso 1: prompt cinematográfico
  const imagePrompt = await buildImagePrompt({
    inspirationImage,
    employeeImage,
    logoImage,
  });

  // ✅ Paso 2: render
  const renderParts: any[] = [];
  if (employeeImage) renderParts.push(asInlinePart(employeeImage));
  if (logoImage) renderParts.push(asInlinePart(logoImage));

  renderParts.push({
    text: `IMAGE_PROMPT:\n${imagePrompt}\n\nOutput: Instagram-ready 1:1 image.`,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: renderParts }],
    config: {
      systemInstruction: {
        role: "system",
        parts: [{ text: IMAGE_RENDER_SYSTEM }],
      },
      temperature: 1.0,
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "1:1", imageSize: "4K" },
    },
  });

  const responseParts = response.candidates?.[0]?.content?.parts;
  if (!responseParts) return null;

  for (const part of responseParts as any[]) {
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
  if (!dataUri) throw new Error("Failed to generate image");

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "test/posts",
    resource_type: "image",
  });

  return result.secure_url;
};
