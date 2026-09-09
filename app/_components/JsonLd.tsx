/** Structured data, server-rendered. Google reads JSON-LD from the DOM, so
 *  this ships as markup rather than through `metadata`, which has no field
 *  for it. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own data, never from a viewer's input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
