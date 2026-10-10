// Renders structured data as <script type="application/ld+json">. Server component.
// "<" is escaped so a dish description can never close the script tag early.
export function JsonLd({ data }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
