import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/login', '/forgot-password', '/reset-password'],
      disallow: ['/dashboard/', '/admin/', '/api/'],
    },
  }
}
