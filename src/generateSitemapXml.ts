export type SitemapXmlOptions = {
  hostname?: string;
  urlSet?: Array<{
    loc: string;
    lastmod?: string;
    changefreq?: Changefreq | string;
    priority?: number;
  }>;
  sitemapIndex?: Array<{
    loc: string;
    lastmod?: string;
  }>;
  pretty?: boolean;
};

export enum Changefreq {
  always = "always",
  hourly = "hourly",
  daily = "daily",
  weekly = "weekly",
  monthly = "monthly",
  yearly = "yearly",
  never = "never",
}

type XmlNode = {
  tag: string;
  attrs?: Record<string, string>;
  children?: XmlNode[] | string | number;
};

/**
 * For more information, see:
 *  - https://www.sitemaps.org/protocol.html
 */
export function generateSitemapXml(options: SitemapXmlOptions): string {
  if (options.urlSet && options.sitemapIndex) {
    throw new Error(`Either a 'urlset' or a 'sitemapindex' can be generated, but not both`);
  }

  const header = '<?xml version="1.0" encoding="UTF-8"?>';
  const hostname = options.hostname || "";
  const pretty = Boolean(options.pretty);

  let root: XmlNode | null = null;

  if (options.urlSet) {
    root = {
      tag: "urlset",
      attrs: { xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9" },
      children: options.urlSet.map(({ loc, lastmod, changefreq, priority }) => {
        const children: XmlNode[] = [{ tag: "loc", children: `${hostname}${loc}` }];
        if (lastmod) children.push({ tag: "lastmod", children: lastmod });
        if (changefreq) children.push({ tag: "changefreq", children: changefreq });
        if (typeof priority === "number") children.push({ tag: "priority", children: priority });
        return { tag: "url", children };
      }),
    };
  }

  if (options.sitemapIndex) {
    root = {
      tag: "sitemapindex",
      attrs: { xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9" },
      children: options.sitemapIndex.map(({ loc, lastmod }) => {
        const children: XmlNode[] = [{ tag: "loc", children: `${hostname}${loc}` }];
        if (lastmod) children.push({ tag: "lastmod", children: lastmod });
        return { tag: "sitemap", children };
      }),
    };
  }

  if (!root) return header;
  return `${header}${pretty ? "\n" : ""}${renderNode(root, pretty, 0)}`;
}

function renderNode(node: XmlNode, pretty: boolean, depth: number): string {
  const indent = pretty ? "  ".repeat(depth) : "";
  const nl = pretty ? "\n" : "";
  const attrs = node.attrs
    ? Object.entries(node.attrs)
        .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
        .join("")
    : "";

  if (node.children === undefined) {
    return `${indent}<${node.tag}${attrs}/>`;
  }

  if (typeof node.children === "string" || typeof node.children === "number") {
    return `${indent}<${node.tag}${attrs}>${escapeText(String(node.children))}</${node.tag}>`;
  }

  const inner = node.children.map((c) => renderNode(c, pretty, depth + 1)).join(nl);
  return `${indent}<${node.tag}${attrs}>${nl}${inner}${nl}${indent}</${node.tag}>`;
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}
