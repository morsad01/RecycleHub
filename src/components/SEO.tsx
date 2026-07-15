import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  canonical?: string;
  schema?: Record<string, any>;
}

export function SEO({ title, description, image, canonical, schema }: SEOProps) {
  useEffect(() => {
    // 1. Update Title
    const formattedTitle = `${title} | RecycleHub`;
    document.title = formattedTitle;

    // Helper to find or create meta tag
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Set Description
    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
      setMetaTag('name', 'twitter:description', description);
    }

    // 3. Set Open Graph / Twitter title
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('name', 'twitter:title', formattedTitle);

    // 4. Set Image
    if (image) {
      setMetaTag('property', 'og:image', image);
      setMetaTag('name', 'twitter:image', image);
    }

    // 5. Canonical Link
    const canonicalUrl = canonical || window.location.href;
    let canonicalElement = document.querySelector('link[rel="canonical"]');
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.setAttribute('href', canonicalUrl);

    // 6. JSON-LD Structured Data
    let schemaScript = document.getElementById('json-ld-schema');
    if (schemaScript) {
      schemaScript.remove();
    }

    if (schema) {
      const script = document.createElement('script');
      script.id = 'json-ld-schema';
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      // Clean up schema on unmount
      const script = document.getElementById('json-ld-schema');
      if (script) script.remove();
    };
  }, [title, description, image, canonical, schema]);

  return null;
}
