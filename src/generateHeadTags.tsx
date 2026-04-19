import React, { ReactElement } from "react";

export type HeadTagsOptions = {
  noIndex?: boolean;
  title?: string;
  description?: string;
  openGraph?: {
    type: string;
    [key: string]: string | string[];
  };
  structuredData?: {
    breadcrumb?: Array<{
      name: string;
      item: string;
    }>;
    article?: {
      headline: string;
      image: string;
      datePublished: string;
    };
  };
};

export function generateHeadTags(options: HeadTagsOptions): ReactElement[] {
  const tags: ReactElement[] = [];

  if (options.noIndex) {
    tags.push(<meta key="rst-noindex" name="robots" content="noindex" />);
  }

  if (options.title) {
    tags.push(<title key="rst-title">{options.title}</title>);
  }

  if (options.description) {
    tags.push(<meta key="rst-description" name="description" content={options.description} />);
  }

  if (options.openGraph) {
    Object.keys(options.openGraph)
      .map((key) => {
        const content = options.openGraph![key];
        const property = key.startsWith("og:") ? key : `og:${key}`;
        if (typeof content === "string") {
          return [<meta key={`rst-${property}-${content}`} property={property} content={content} />];
        }
        if (Array.isArray(content)) {
          return content.map((contentElement) => (
            <meta key={`rst-${property}-${contentElement}`} property={property} content={contentElement} />
          ));
        }
        return [];
      })
      .forEach((array) => array.forEach((tag) => tags.push(tag)));
  }

  if (options.structuredData) {
    const { breadcrumb, article } = options.structuredData;
    if (breadcrumb) {
      tags.push(
        <script
          key="rst-sd-breadcrumb"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: htmlEncodeAngleBrackets(
              JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: breadcrumb.map((bc, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: bc.name,
                  item: bc.item,
                })),
              }),
            ),
          }}
        />,
      );
    }
    if (article) {
      tags.push(
        <script
          key="rst-sd-article"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: htmlEncodeAngleBrackets(
              JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: article.headline,
                image: [article.image],
                datePublished: article.datePublished,
              }),
            ),
          }}
        />,
      );
    }
  }

  return tags;
}

function htmlEncodeAngleBrackets(str: string): string {
  const pattern = /[<>]/g;
  const replacements: Record<string, string> = {
    "<": "&lt;",
    ">": "&gt;",
  };
  return str.replace(pattern, (match) => replacements[match]);
}
