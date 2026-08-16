"use client";

import Editor from "@monaco-editor/react";
import { useMemo, useState } from "react";
import {
  EDITOR_THEMES,
  registerEditorThemes,
  type EditorThemeId,
} from "@/components/editor-themes";
import type { Language } from "@/lib/starter-code";

const LANGUAGE_LABELS: Record<Language, string> = {
  cpp: "C++",
  python: "Python",
};

const LANGUAGE_EXTENSIONS: Record<Language, string> = {
  cpp: "cpp",
  python: "py",
};

const LIGHT_THEMES = EDITOR_THEMES.filter((t) => t.kind === "light");
const DARK_THEMES = EDITOR_THEMES.filter((t) => t.kind === "dark");

export function CodeEditorPanel({
  problemId,
  starterCode,
}: {
  problemId: string;
  starterCode: Record<Language, string>;
}) {
  const [language, setLanguage] = useState<Language>("cpp");
  const [codeByProblem, setCodeByProblem] = useState<
    Record<string, Record<Language, string>>
  >({});
  const [themeId, setThemeId] = useState<EditorThemeId>("vs-dark");

  const code = codeByProblem[problemId] ?? starterCode;

  async function handleFileUpload(file: File) {
    const content = await file.text();
    setCodeByProblem((prev) => ({
      ...prev,
      [problemId]: { ...code, [language]: content },
    }));
  }

  function handleFileDownload() {
    const blob = new Blob([code[language]], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${problemId}.${LANGUAGE_EXTENSIONS[language]}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const isDark = useMemo(
    () => EDITOR_THEMES.find((t) => t.id === themeId)?.kind === "dark",
    [themeId],
  );

  return (
    <div
      className={`flex h-full flex-col bg-panel text-foreground ${isDark ? "dark" : ""}`}
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-panel-border px-4">
        <span className="text-xs font-medium text-panel-muted">Solution</span>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-panel-border px-2 py-1 text-sm text-foreground transition-colors hover:border-blue-600 hover:text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M12 16V4M12 4 7 9M12 4l5 5" />
              <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
            Upload file
            <input
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleFileUpload(file);
              }}
            />
          </label>
          <button
            type="button"
            onClick={handleFileDownload}
            className="flex items-center gap-1.5 rounded-md border border-panel-border px-2 py-1 text-sm text-foreground transition-colors hover:border-blue-600 hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M12 4v12M12 16l-5-5M12 16l5-5" />
              <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
            Download file
          </button>
          <select
            value={themeId}
            onChange={(event) =>
              setThemeId(event.target.value as EditorThemeId)
            }
            aria-label="Editor theme"
            className="rounded-md border border-panel-border bg-panel px-2 py-1 text-sm text-foreground outline-none"
          >
            <optgroup label="Light">
              {LIGHT_THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Dark">
              {DARK_THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </optgroup>
          </select>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            aria-label="Programming language"
            className="rounded-md border border-panel-border bg-panel px-2 py-1 text-sm text-foreground outline-none"
          >
            {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          language={language}
          theme={themeId}
          beforeMount={registerEditorThemes}
          value={code[language]}
          onChange={(value) =>
            setCodeByProblem((prev) => ({
              ...prev,
              [problemId]: { ...code, [language]: value ?? "" },
            }))
          }
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16 },
          }}
        />
      </div>
    </div>
  );
}
