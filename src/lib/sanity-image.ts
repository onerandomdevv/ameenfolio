import { createImageUrlBuilder } from '@sanity/image-url'
import { client } from './sanity'

const builder = createImageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}
