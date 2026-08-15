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
