import { render } from "@testing-library/react";
import React, { ReactElement } from "react";
import { generateHeadTags, HeadTagsOptions } from "./generateHeadTags";

type AnyProps = Record<string, any>;
const propsOf = (el: ReactElement): AnyProps => el.props as AnyProps;

describe(generateHeadTags, () => {
  it("renders nothing for an empty options object", () => {
    // When
    const tags = generateHeadTags({});

    // Then
    expect(tags).toEqual([]);
  });

  it("renders a noIndex tag", () => {
    // When
    const tags = generateHeadTags({ noIndex: true });

    // Then
    expect(tags).toHaveLength(1);
    expect(tags[0].type).toEqual("meta");
    expect(propsOf(tags[0])).toMatchObject({ name: "robots", content: "noindex" });
  });

  it("renders a title tag", () => {
    // When
    const tags = generateHeadTags({ title: "Hello World" });

    // Then
    expect(tags).toHaveLength(1);
    expect(tags[0].type).toEqual("title");
    expect(propsOf(tags[0]).children).toEqual("Hello World");
  });

  it("renders a description tag", () => {
    // When
    const tags = generateHeadTags({ description: "My beautiful page" });

    // Then
    expect(tags).toHaveLength(1);
    expect(tags[0].type).toEqual("meta");
    expect(propsOf(tags[0])).toMatchObject({ name: "description", content: "My beautiful page" });
  });

  it("renders OpenGraph tags", () => {
    // When
    const tags = generateHeadTags({
      openGraph: {
        type: "article",
        title: "How to Test with Jest",
        image: "https://cdn/image.jpg",
        "article:author": "Jessy",
        "article:tag": ["javascript", "jest", "testing"],
        "article:published_time": "2020-12-31",
      },
    });

    // Then
    expect(tags).toHaveLength(8);
    expect(findOpenGraphContent(tags, "type")).toEqual(["article"]);
    expect(findOpenGraphContent(tags, "title")).toEqual(["How to Test with Jest"]);
    expect(findOpenGraphContent(tags, "image")).toEqual(["https://cdn/image.jpg"]);
    expect(findOpenGraphContent(tags, "article:author")).toEqual(["Jessy"]);
    expect(findOpenGraphContent(tags, "article:tag")).toEqual(["javascript", "jest", "testing"]);
    expect(findOpenGraphContent(tags, "article:published_time")).toEqual(["2020-12-31"]);
  });

  it(`doesn't add an "og" prefix to OpenGraph tags if the property key already starts with "og"`, () => {
    // When
    const tags = generateHeadTags({
      openGraph: {
        type: "article",
        "og:title": "How to Test with Jest",
      },
    });

    // Then
    expect(tags).toHaveLength(2);
    expect(propsOf(tags[1]).property).toEqual("og:title");
  });

  it("renders a StructuredData breadcrumb", () => {
    // When
    const tags = generateHeadTags({
      structuredData: {
        breadcrumb: [
          { name: "Home", item: "https://www.example.com" },
          { name: "Books", item: "https://www.example.com/books" },
          { name: "LO > TR", item: "https://www.example.com/books/lotr-4452" },
        ],
      },
    });

    // Then
    expect(tags).toHaveLength(1);
    expect(tags[0].type).toEqual("script");
    expect(propsOf(tags[0]).type).toEqual("application/ld+json");
    expect(JSON.parse(propsOf(tags[0]).dangerouslySetInnerHTML.__html)).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.example.com" },
        { "@type": "ListItem", position: 2, name: "Books", item: "https://www.example.com/books" },
        { "@type": "ListItem", position: 3, name: "LO &gt; TR", item: "https://www.example.com/books/lotr-4452" },
      ],
    });
  });

  it("renders a StructuredData article", () => {
    // When
    const tags = generateHeadTags({
      structuredData: {
        article: {
          headline: "How to Test with Jest <",
          image: "https://cdn/image.png",
          datePublished: "2020-12-31",
        },
      },
    });

    // Then
    expect(tags).toHaveLength(1);
    expect(tags[0].type).toEqual("script");
    expect(propsOf(tags[0]).type).toEqual("application/ld+json");
    expect(JSON.parse(propsOf(tags[0]).dangerouslySetInnerHTML.__html)).toEqual({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "How to Test with Jest &lt;",
      image: ["https://cdn/image.png"],
      datePublished: "2020-12-31",
    });
  });

  it("renders everything at the same time without React key warnings", () => {
    // Given
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const options: Required<HeadTagsOptions> = {
      noIndex: true,
      title: "Hello World",
      description: "My description",
      openGraph: {
        type: "article",
      },
      structuredData: {
        article: {
          headline: "My article",
          datePublished: "2020-12-31",
          image: "https://cdn/example.com",
        },
        breadcrumb: [{ name: "Bread", item: "https://example.com" }],
      },
    };

    // When
    render(<>{generateHeadTags(options)}</>);

    // Then: no errors logged for duplicate keys, or anything
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

function findOpenGraphContent(tags: ReactElement[], property: string): string[] {
  return tags.filter((t) => t.type === "meta" && propsOf(t).property === `og:${property}`).map((t) => propsOf(t).content);
}
