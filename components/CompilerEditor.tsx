"use client";

import axios from "axios";
import Editor from "@monaco-editor/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Judge0SubmissionResult = {
  token?: string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: { id?: number; description?: string } | null;
};

export type CompilerEditorProps = {
  language: string;
  languageId: number;
  code: string;
  onCodeChange: (code: string) => void;

  /**
   * Optional stdin to use for a single run.
   * If `stdinList` is provided, the editor will run once per stdin entry (sequentially).
   */
  stdin?: string;
  stdinList?: string[];

  runActionRef: React.MutableRefObject<(() => Promise<void> | void) | null>;

  onResult: (result: {
    raw: Judge0SubmissionResult;
    token: string;
    stdoutText: string;
    stderrText: string;
    compileOutputText: string;
    statusId: number | null;
    statusDescription: string | null;
    stdinIndex?: number;
    stdinText?: string;
  }) => void;

  onError: (message: string) => void;
  onRunningChange?: (running: boolean) => void;
};

function safeUtf8Btoa(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}

function safeUtf8Atob(value: string) {
  return decodeURIComponent(escape(atob(value)));
}

function decodeMaybeBase64(value: string | null | undefined) {
  if (!value) return "";
  try {
    return safeUtf8Atob(value);
  } catch {
    return value;
  }
}

function getJudge0Config() {
  // Use same-origin API routes to avoid browser CORS/mixed-content blocks.
  return { apiBase: "/api/judge0" };
}

export default function CompilerEditor(props: CompilerEditorProps) {
  const [internalRunning, setInternalRunning] = useState(false);
  const runAbortRef = useRef<{ aborted: boolean } | null>(null);

  const monacoLanguage = useMemo(() => {
    const lang = props.language.toLowerCase();
    if (lang === "csharp" || lang === "c#" || lang === "c sharp") return "csharp";
    if (lang === "cpp" || lang === "c++") return "cpp";
    if (lang === "c") return "c";
    if (lang === "python" || lang === "py") return "python";
    if (lang === "typescript" || lang === "ts") return "typescript";
    if (lang === "javascript" || lang === "js") return "javascript";
    if (lang === "java") return "java";
    return "plaintext";
  }, [props.language]);

  const setRunning = useCallback(
    (running: boolean) => {
      setInternalRunning(running);
      props.onRunningChange?.(running);
    },
    [props]
  );

  const pollUntilDone = useCallback(async (
    token: string, abortRef: { aborted: boolean }) => {
    const { apiBase } = getJudge0Config();
    const url = `${apiBase}/submissions/${encodeURIComponent(token)}`;

    for (let attempt = 0; attempt < 25; attempt++) {
      if (abortRef.aborted) {
        throw new Error("Run cancelled");
      }

      const res = await axios.get<Judge0SubmissionResult>(url);

      const statusId = res.data?.status?.id;
      if (statusId && statusId !== 1 && statusId !== 2) {
        return res.data;
      }

      await new Promise((r) => setTimeout(r, 1200));
    }

    throw new Error("Timed out waiting for Judge0 result");
  }, []);

  const runOnce = useCallback(
    async (stdinText: string, abortRef: { aborted: boolean }, stdinIndex?: number) => {
      const { apiBase } = getJudge0Config();
      const submitUrl = `${apiBase}/submissions`;

      const submission = {
        language_id: props.languageId,
        source_code: safeUtf8Btoa(props.code || ""),
        stdin: safeUtf8Btoa(stdinText || ""),
      };

      const submitRes = await axios.post<Judge0SubmissionResult>(submitUrl, submission, {
        headers: { "Content-Type": "application/json" },
      });

      const token = submitRes.data?.token;
      if (!token) {
        throw new Error("Judge0 did not return a submission token");
      }

      const finalRes = await pollUntilDone(token, abortRef);

      const stdoutText = decodeMaybeBase64(finalRes.stdout);
      const stderrText = decodeMaybeBase64(finalRes.stderr);
      const compileOutputText = decodeMaybeBase64(finalRes.compile_output);
      const statusId = typeof finalRes.status?.id === "number" ? finalRes.status.id : null;
      const statusDescription =
        typeof finalRes.status?.description === "string" ? finalRes.status.description : null;

      props.onResult({
        raw: finalRes,
        token,
        stdoutText,
        stderrText,
        compileOutputText,
        statusId,
        statusDescription,
        stdinIndex,
        stdinText,
      });
    },
    [pollUntilDone, props]
  );

  const run = useCallback(async () => {
    if (internalRunning) return;

    if (!Number.isFinite(props.languageId) || props.languageId <= 0) {
      props.onError("Unsupported language: missing languageId");
      return;
    }

    const abortRef = { aborted: false };
    runAbortRef.current = abortRef;

    try {
      setRunning(true);

      const stdinList = Array.isArray(props.stdinList) && props.stdinList.length > 0
        ? props.stdinList
        : [props.stdin ?? ""];

      for (let i = 0; i < stdinList.length; i++) {
        if (abortRef.aborted) {
          throw new Error("Run cancelled");
        }
        await runOnce(stdinList[i] ?? "", abortRef, stdinList.length > 1 ? i : undefined);
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const data = e.response?.data as any;
        const detail =
          typeof data === "string"
            ? data
            : typeof data?.error === "string"
              ? data.error
              : typeof data?.message === "string"
                ? data.message
                : status
                  ? `HTTP ${status}`
                  : "Request failed";

        const message = status
          ? `Request failed (${status}): ${detail}`
          : e.message || "Request failed";

        props.onError(message);
        return;
      }

      const message = e instanceof Error ? e.message : String(e);
      props.onError(message);
    } finally {
      setRunning(false);
    }
  }, [internalRunning, props, runOnce, setRunning]);

  useEffect(() => {
    props.runActionRef.current = run;
    return () => {
      if (props.runActionRef.current === run) {
        props.runActionRef.current = null;
      }
    };
  }, [props.runActionRef, run]);

  useEffect(() => {
    return () => {
      if (runAbortRef.current) {
        runAbortRef.current.aborted = true;
      }
    };
  }, []);

  return (
    <div className="h-full min-h-0 w-full">
      <Editor
        height="100%"
        defaultLanguage={monacoLanguage}
        language={monacoLanguage}
        value={props.code}
        onChange={(value) => props.onCodeChange(value ?? "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          scrollbar: {
            verticalScrollbarSize: 5,
            horizontalScrollbarSize: 5,
            useShadows: false,
            verticalSliderSize: 5,
            horizontalSliderSize: 5,
          },
          smoothScrolling: true,
          fontSize: 19,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
