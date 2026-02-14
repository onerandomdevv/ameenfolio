import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Projects', value: 'projects' },
          { title: 'Building', value: 'building' },
          { title: 'Collabs', value: 'collabs' },
          { title: 'Marketplace', value: 'marketplace' },
        ],
      },
      initialValue: 'projects',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Image Gallery',
      type: 'array',
      description: 'Upload up to 3 additional images to create a cinematic sliding effect on the project details page.',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'technologies',
      title: 'Tech Stack',
      type: 'object',
      fields: [
        defineField({
          name: 'languages',
          title: 'Languages',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'skill' }] }],
        }),
        defineField({
          name: 'frontend',
          title: 'Frontend',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'skill' }] }],
        }),
        defineField({
          name: 'backend',
          title: 'Backend',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'skill' }] }],
        }),
        defineField({
          name: 'database',
          title: 'Database',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'skill' }] }],
        }),
        defineField({
          name: 'tools',
          title: 'Tools',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'skill' }] }],
        }),
      ],
    }),
    defineField({
      name: 'liveUrl',
      title: 'Live Preview URL',
      type: 'url',
    }),
    defineField({
      name: 'githubUrl',
      title: 'GitHub URL',
      type: 'url',
    }),
    defineField({
      name: 'cta',
      title: 'Contact Dev Options',
      type: 'object',
      fields: [
        defineField({
          name: 'telegram',
          title: 'Telegram URL',
          type: 'url',
          description: 'Link to your Telegram DM',
        }),
        defineField({
          name: 'whatsapp',
          title: 'WhatsApp URL',
          type: 'url',
          description: 'Link to your WhatsApp chat',
        }),
        defineField({
          name: 'email',
          title: 'Direct Email',
          type: 'string',
          description: 'Your contact email address',
        }),
      ],
    }),
    defineField({
      name: 'content',
      title: 'Detailed Content',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'verified',
      title: 'Verified Project',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
