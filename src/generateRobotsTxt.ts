export type RobotsTxtOptions = {
  policy?: RobotsTxtPolicy | RobotsTxtPolicy[];
  sitemap?: string | string[];
};

export type RobotsTxtPolicy = {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
};

/**
 * For more information, see:
 *  - https://www.robotstxt.org/robotstxt.html
 *  - https://developers.google.com/search/docs/advanced/robots/create-robots-txt
 */
export function generateRobotsTxt(options: RobotsTxtOptions): string {
  const blocks: string[] = [];

  toArray(options.policy).forEach((policy) => {
    let policyBlock = "";
    toArray(policy.userAgent).forEach((ua) => (policyBlock += `User-agent: ${ua}\n`));
    toArray(policy.allow).forEach((a) => (policyBlock += `Allow: ${a}\n`));
    toArray(policy.disallow).forEach((d) => (policyBlock += `Disallow: ${d}\n`));
    blocks.push(policyBlock);
  });

  let sitemapBlock = "";
  toArray(options.sitemap).forEach((s) => (sitemapBlock += `Sitemap: ${s}\n`));
  blocks.push(sitemapBlock);

  return blocks
    .map((block) => block.trim())
    .filter(Boolean)
    .join("\n\n");
}

function toArray<T>(argument?: T | T[]): T[] {
  if (Array.isArray(argument)) {
    return argument;
  }
  if (argument !== undefined && argument !== null) {
    return [argument];
  }
  return [];
}
