"use client";

export function StatementFrame({
  html,
  title,
}: {
  html: string;
  title: string;
}) {
  return (
    <iframe
      key={html}
      srcDoc={html}
      title={title}
      sandbox="allow-scripts allow-popups"
      className="h-full w-full border-0 bg-white"
    />
  );
}
