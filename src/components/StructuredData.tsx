import { Product, Post } from "@/lib/types"

// Organization schema for the entire site
export function OrganizationSchema({ settings }: { settings: Partial<{ site_name?: string; site_description?: string; phone?: string; email?: string; whatsapp?: string }> }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings?.site_name || "Ghana Appliances",
    description: settings?.site_description || "Quality Electrical Appliances in Ghana",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc",
    telephone: settings?.phone || "",
    email: settings?.email || "",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Accra",
      addressCountry: "GH",
    },
    sameAs: [
      settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}` : null,
    ].filter(Boolean),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// Product schema for product detail pages
export function ProductSchema({ product }: { product: Product }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.id,
    url: `${baseUrl}/products/${product.slug}`,
    image: product.images?.[0] ? `${baseUrl}${product.images[0]}` : undefined,
    offers: {
      "@type": "Offer",
      price: product.price_ghs,
      priceCurrency: "GHS",
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    category: product.category,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// BreadcrumbList schema
export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// FAQ schema
export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// BlogPosting schema
export function BlogPostingSchema({ post }: { post: Post }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.content?.replace(/<[^>]*>/g, "").slice(0, 160),
    image: post.featured_image || undefined,
    author: {
      "@type": "Organization",
      name: post.author || "Ghana Appliances",
    },
    publisher: {
      "@type": "Organization",
      name: "Ghana Appliances",
      url: baseUrl,
    },
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    url: `${baseUrl}/blog/${post.slug}`,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// WebSite schema for Google Sitelinks Searchbox
export function WebSiteSchema({ settings }: { settings: Partial<{ site_name?: string }> }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings?.site_name || "Ghana Appliances",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// LocalBusiness schema for local SEO
export function LocalBusinessSchema({ settings }: {
  settings: Partial<{
    site_name?: string
    site_description?: string
    phone?: string
    email?: string
    whatsapp?: string
    address?: string
    facebook_url?: string
    instagram_url?: string
    twitter_url?: string
    youtube_url?: string
  }>
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"
  const socialLinks = [
    settings?.facebook_url,
    settings?.instagram_url,
    settings?.twitter_url,
    settings?.youtube_url,
    settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}` : null,
  ].filter(Boolean)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    name: settings?.site_name || "Ghana Appliances",
    description: settings?.site_description || "Quality Electrical Appliances in Ghana",
    url: baseUrl,
    telephone: settings?.phone || "",
    email: settings?.email || "",
    address: {
      "@type": "PostalAddress",
      streetAddress: settings?.address || "",
      addressLocality: "Accra",
      addressRegion: "Greater Accra",
      addressCountry: "GH",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    priceRange: "GHS",
    image: `${baseUrl}/og-default.jpg`,
    sameAs: socialLinks.length > 0 ? socialLinks : undefined,
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// Review schema for testimonials
export function ReviewSchema({ review }: {
  review: { reviewBody: string; author: string; ratingValue: number }
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    reviewBody: review.reviewBody,
    author: { "@type": "Person", name: review.author },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.ratingValue,
      bestRating: 5,
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// AggregateRating schema for product pages
export function AggregateRatingSchema({
  ratingValue,
  reviewCount,
  itemReviewed,
}: {
  ratingValue: number
  reviewCount: number
  itemReviewed: string
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    ratingValue,
    reviewCount,
    bestRating: 5,
    itemReviewed: { "@type": "Product", name: itemReviewed },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// AboutPage schema
export function AboutPageSchema({ settings }: {
  settings: Partial<{ site_name?: string; site_description?: string }>
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${settings?.site_name || "Ghana Appliances"}`,
    description: settings?.site_description || "Quality Electrical Appliances in Ghana",
    url: `${baseUrl}/about`,
    about: {
      "@type": "Organization",
      name: settings?.site_name || "Ghana Appliances",
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

