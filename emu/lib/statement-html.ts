const DARK_STYLE_OVERRIDE = `
<style>
  html, body { background: #0a0a0a !important; color: #e4e4e7 !important; }
  a { color: #7aa2f7; }
  code, pre { background: #18181b; color: #e4e4e7; }
  .sample-header {
    background: #18181b !important;
    color: #e4e4e7 !important;
    border-color: #3f3f46 !important;
  }
  .sample-content, .test-data-download-content {
    background: #18181b !important;
    color: #e4e4e7 !important;
    border-color: #3f3f46 !important;
  }
  .sample-interaction-content {
    background: #18181b !important;
    border-color: #3f3f46 !important;
  }
  .sample-interaction-judge-output-box,
  .sample-interaction-solution-output-box {
    background: #0a0a0a !important;
    border-color: #3f3f46 !important;
    color: #e4e4e7 !important;
  }
  .sample-interaction-judge-label,
  .sample-interaction-solution-label,
  .sample-interaction-judge-note,
  .sample-interaction-solution-note {
    color: #a1a1aa !important;
  }
</style>
`;

export function prepareStatementHtml(
  html: string,
  { basePath, dark }: { basePath: string; dark: boolean },
): string {
  const withBase = html.includes("<head>")
    ? html.replace("<head>", `<head>\n<base href="${basePath}">`)
    : `<base href="${basePath}">${html}`;

  if (!dark) return withBase;

  return withBase.includes("</head>")
    ? withBase.replace("</head>", `${DARK_STYLE_OVERRIDE}</head>`)
    : `${DARK_STYLE_OVERRIDE}${withBase}`;
}
