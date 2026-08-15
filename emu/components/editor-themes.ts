import type { Monaco } from "@monaco-editor/react";

type ThemeData = Parameters<Monaco["editor"]["defineTheme"]>[1];

export type EditorThemeId =
  | "vs"
  | "github-light"
  | "solarized-light"
  | "minimal-dark"
  | "vs-dark"
  | "cursor-dark"
  | "dracula";

export interface EditorThemeOption {
  id: EditorThemeId;
  label: string;
  kind: "light" | "dark";
  /** Omitted for Monaco's two built-in base themes ("vs" / "vs-dark"). */
  data?: ThemeData;
}

export const EDITOR_THEMES: EditorThemeOption[] = [
  { id: "vs", label: "Light", kind: "light" },
  {
    id: "github-light",
    label: "GitHub Light",
    kind: "light",
    data: {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6a737d", fontStyle: "italic" },
        { token: "keyword", foreground: "d73a49" },
        { token: "string", foreground: "032f62" },
        { token: "number", foreground: "005cc5" },
        { token: "type", foreground: "22863a" },
        { token: "function", foreground: "6f42c1" },
        { token: "variable", foreground: "24292e" },
        { token: "identifier", foreground: "24292e" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#24292e",
        "editorLineNumber.foreground": "#1b1f234d",
        "editorLineNumber.activeForeground": "#24292e",
        "editor.selectionBackground": "#0366d625",
        "editorCursor.foreground": "#044289",
        "editor.lineHighlightBackground": "#f6f8fa",
      },
    },
  },
  {
    id: "solarized-light",
    label: "Solarized Light",
    kind: "light",
    data: {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "93a1a1", fontStyle: "italic" },
        { token: "keyword", foreground: "859900" },
        { token: "string", foreground: "2aa198" },
        { token: "number", foreground: "d33682" },
        { token: "type", foreground: "b58900" },
        { token: "function", foreground: "268bd2" },
        { token: "variable", foreground: "657b83" },
        { token: "identifier", foreground: "657b83" },
      ],
      colors: {
        "editor.background": "#fdf6e3",
        "editor.foreground": "#657b83",
        "editorLineNumber.foreground": "#93a1a1",
        "editorLineNumber.activeForeground": "#586e75",
        "editor.selectionBackground": "#eee8d5",
        "editorCursor.foreground": "#657b83",
        "editor.lineHighlightBackground": "#eee8d580",
      },
    },
  },
  {
    id: "minimal-dark",
    label: "Minimal",
    kind: "dark",
    data: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b6b6b", fontStyle: "italic" },
        { token: "keyword", foreground: "e0e0e0" },
        { token: "string", foreground: "a8a8a8" },
        { token: "number", foreground: "c9c9c9" },
        { token: "type", foreground: "d4d4d4" },
        { token: "function", foreground: "ffffff" },
        { token: "variable", foreground: "b0b0b0" },
        { token: "identifier", foreground: "b0b0b0" },
      ],
      colors: {
        "editor.background": "#0a0a0a",
        "editor.foreground": "#c9c9c9",
        "editorLineNumber.foreground": "#3d3d3d",
        "editorLineNumber.activeForeground": "#8a8a8a",
        "editor.selectionBackground": "#2a2a2a",
        "editorCursor.foreground": "#ffffff",
        "editor.lineHighlightBackground": "#151515",
      },
    },
  },
  { id: "vs-dark", label: "VS Code Dark+", kind: "dark" },
  {
    id: "cursor-dark",
    label: "Cursor",
    kind: "dark",
    data: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6a7681", fontStyle: "italic" },
        { token: "keyword", foreground: "7aa2f7" },
        { token: "string", foreground: "a9d97e" },
        { token: "number", foreground: "c9a5f7" },
        { token: "type", foreground: "5ccfe6" },
        { token: "function", foreground: "7dcfff" },
        { token: "variable", foreground: "d8dee9" },
        { token: "identifier", foreground: "d8dee9" },
      ],
      colors: {
        "editor.background": "#181818",
        "editor.foreground": "#d8dee9",
        "editorLineNumber.foreground": "#4b4b4b",
        "editorLineNumber.activeForeground": "#a0a0a0",
        "editor.selectionBackground": "#3a3d5c",
        "editorCursor.foreground": "#7aa2f7",
        "editor.lineHighlightBackground": "#1f1f1f",
      },
    },
  },
  {
    id: "dracula",
    label: "Dracula",
    kind: "dark",
    data: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6272a4", fontStyle: "italic" },
        { token: "keyword", foreground: "ff79c6" },
        { token: "string", foreground: "f1fa8c" },
        { token: "number", foreground: "bd93f9" },
        { token: "type", foreground: "8be9fd", fontStyle: "italic" },
        { token: "function", foreground: "50fa7b" },
        { token: "variable", foreground: "f8f8f2" },
        { token: "identifier", foreground: "f8f8f2" },
      ],
      colors: {
        "editor.background": "#282a36",
        "editor.foreground": "#f8f8f2",
        "editorLineNumber.foreground": "#6272a4",
        "editorLineNumber.activeForeground": "#f8f8f2",
        "editor.selectionBackground": "#44475a",
        "editorCursor.foreground": "#f8f8f2",
        "editor.lineHighlightBackground": "#44475a4d",
      },
    },
  },
];

export function registerEditorThemes(monaco: Monaco) {
  for (const theme of EDITOR_THEMES) {
    if (theme.data) {
      monaco.editor.defineTheme(theme.id, theme.data);
    }
  }
}
