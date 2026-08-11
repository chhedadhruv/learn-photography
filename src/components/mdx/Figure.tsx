import Image from "next/image";

interface FigureProps {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  /** Visible caption. Distinct from alt text: the caption adds context, alt describes content. */
  readonly caption?: string;
  readonly priority?: boolean;
}

/**
 * The only sanctioned way to put an image in a lesson.
 *
 * `alt` is a required prop, and empty strings are rejected at runtime, so an inaccessible image
 * fails the build rather than shipping. A decorative image has no place in a lesson — if it is
 * worth including, it is worth describing.
 */
export function Figure({ src, alt, width, height, caption, priority = false }: FigureProps) {
  if (alt.trim().length === 0) {
    throw new Error(
      `<Figure src="${src}"> has empty alt text. Describe what the photograph shows — ` +
        `for an exposure example, say what is sharp, blurred or clipped.`,
    );
  }

  return (
    <figure className="my-8">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(min-width: 768px) 42rem, 100vw"
        className="h-auto w-full rounded-md"
      />
      {caption === undefined ? null : (
        <figcaption className="mt-3 text-sm text-ink-faint">{caption}</figcaption>
      )}
    </figure>
  );
}
