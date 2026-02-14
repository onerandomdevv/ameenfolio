import { defineField, defineType } from "sanity";

export default defineType({
  name: "settings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "heroBanners",
      title: "Hero Banners",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      description:
        "Upload high-resolution images for the Hero Slider. Recommended size: 1920x1080px (16:9). The Cinematic Ken Burns effect works best with high-quality landscape images.",
    }),
    defineField({
      name: "aboutImages",
      title: "About Section Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      description: "Images for the interactive slider in the About section.",
    }),
    defineField({
      name: "resume",
      title: "Resume Image",
      type: "image",
      description:
        "Upload your resume as an image. MUST be exactly 723x1024px.",
      validation: (Rule) =>
        Rule.custom(async (value: any, context: any) => {
          if (!value?.asset?._ref) {
            return true;
          }

          const client = context.getClient({ apiVersion: "2023-01-01" });
          const assetId = value.asset._ref;

          try {
            const asset = await client.fetch(`*[_id == $id][0]`, {
              id: assetId,
            });

            if (!asset?.metadata?.dimensions) {
              return true; // Skipping check if metadata is missing (shouldn't happen for images)
            }

            const { width, height } = asset.metadata.dimensions;

            if (width !== 723 || height !== 1024) {
              return `Image dimensions must be exactly 723x1024px. Uploaded: ${width}x${height}px.`;
            }

            return true;
          } catch (error) {
            console.error("Validation error:", error);
            return true; // Fail open if check fails to avoid blocking
          }
        }),
      options: {
        accept: "image/png,image/jpeg",
      },
    }),
    defineField({
      name: "externalResumeLink",
      title: "Resume (External Link)",
      type: "url",
      description:
        "Optional: Provide a direct link to your resume (e.g., Google Drive, LinkedIn) instead of uploading a file. This will take priority if both are present.",
    }),
    defineField({
      name: "siteName",
      title: "Site Name",
      type: "string",
      initialValue: "Ameen Portfolio",
    }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "object",
      fields: [
        { name: "whatsapp", title: "WhatsApp URL", type: "url" },
        { name: "telegram", title: "Telegram URL", type: "url" },
        { name: "twitter", title: "Twitter URL", type: "url" },
        { name: "github", title: "GitHub URL", type: "url" },
        { name: "linkedin", title: "LinkedIn URL", type: "url" },
        { name: "email", title: "Email Address", type: "string" },
      ],
    }),
  ],
});
