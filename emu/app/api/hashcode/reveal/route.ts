import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { resolveHashcodeDatasetPath } from "@/lib/catalog";

const execFileAsync = promisify(execFile);

// Opens the OS's native file explorer, revealing (selecting) the dataset
// file where the platform supports it, or its containing folder otherwise.
// This only makes sense because this whole app is meant to run locally on
// the reader's own machine (npm run dev) — never expose this route from a
// hosted/shared deployment.
function revealCommand(
  platform: NodeJS.Platform,
  absPath: string,
): { cmd: string; args: string[] } {
  if (platform === "darwin") return { cmd: "open", args: ["-R", absPath] };
  if (platform === "win32") {
    return { cmd: "explorer", args: [`/select,${absPath}`] };
  }
  return { cmd: "xdg-open", args: [path.dirname(absPath)] };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const { year, round, filename } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof year !== "string" ||
    typeof round !== "string" ||
    typeof filename !== "string"
  ) {
    return Response.json(
      { ok: false, error: "Missing year, round, or filename." },
      { status: 400 },
    );
  }

  const absPath = await resolveHashcodeDatasetPath(year, round, filename);
  if (!absPath) {
    return Response.json({ ok: false, error: "Dataset not found." }, { status: 404 });
  }

  const { cmd, args } = revealCommand(process.platform, absPath);

  try {
    await execFileAsync(cmd, args);
    return Response.json({ ok: true, path: absPath });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    // explorer.exe frequently exits non-zero even after successfully
    // opening a window — only ENOENT (the binary itself is missing) is a
    // real failure on Windows.
    if (process.platform === "win32" && code !== "ENOENT") {
      return Response.json({ ok: true, path: absPath });
    }
    return Response.json(
      {
        ok: false,
        error:
          code === "ENOENT"
            ? `No file-explorer command ("${cmd}") found on this system.`
            : "Failed to open the file explorer.",
        path: absPath,
      },
      { status: 500 },
    );
  }
}
