/** Renders guide copy: paragraph breaks + **bold** markers from locale strings. */

function RichLine({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-zinc-100 light:text-zinc-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function GuideSectionBody({ paragraphs }) {
  if (!paragraphs?.length) return null;
  return (
    <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-300 light:text-zinc-700">
      {paragraphs.map((para, i) => (
        <p key={i}>
          <RichLine text={para} />
        </p>
      ))}
    </div>
  );
}
