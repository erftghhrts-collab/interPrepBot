export type ProctoringViolationCode =
  | "MULTIPLE_PEOPLE"
  | "PHONE_VISIBLE"
  | "FACE_NOT_VISIBLE"
  | "LOOKING_AWAY"
  | "TAB_SWITCH"
  | "CLIPBOARD_SHORTCUT";

export type ProctoringViolation = {
  code: ProctoringViolationCode;
  message: string;
  meta?: Record<string, unknown>;
};

type ProctoringOptions = {
  videoEl: HTMLVideoElement;
  intervalMs?: number;
  lookingAwayMinDurationMs?: number;
  lookingAwayCooldownMs?: number;
  onViolation: (violation: ProctoringViolation) => void;
};

type LoadedModels = {
  coco: any;
  faceDetector: any;
};

let modelsPromise: Promise<LoadedModels> | null = null;

export async function preloadProctoringModels(): Promise<void> {
  await loadModels();
}

export async function warmupProctoringModels(videoEl: HTMLVideoElement): Promise<void> {
  // Run a first inference pass to warm up TF/WebGL and model kernels.
  // Without this, the first few real detections can be slow and/or skipped
  // (e.g., user shows phone briefly and it misses the first interval).
  const models = await loadModels();

  if (!videoEl?.videoWidth || !videoEl?.videoHeight || videoEl.readyState < 2) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  try {
    await Promise.all([
      models.coco.detect(canvas),
      models.faceDetector.estimateFaces(canvas, false),
    ]);
  } catch {
    // Non-blocking: warmup is best-effort.
  }
}

async function loadModels(): Promise<LoadedModels> {
  if (typeof window === "undefined") {
    throw new Error("Proctoring can only run in the browser");
  }

  if (modelsPromise) return modelsPromise;

  modelsPromise = (async () => {
    // Ensure TFJS is initialized.
    const tf: any = await import("@tensorflow/tfjs");
    try {
      // Prefer WebGL for performance.
      await tf.setBackend("webgl");
    } catch {
      try {
        // Fallback: CPU backend (slower but reliable)
        await tf.setBackend("cpu");
      } catch {
        // Ignore; TF will choose a default backend.
      }
    }
    await tf.ready();

    const cocoSsd: any = await import("@tensorflow-models/coco-ssd");
    // lite_mobilenet_v2 is faster and good enough for coarse proctoring checks.
    const coco = await cocoSsd.load({ base: "lite_mobilenet_v2" });

    // BlazeFace is lightweight and does not depend on MediaPipe bundles,
    // avoiding Next.js build errors like missing FaceMesh exports.
    const blazeface: any = await import("@tensorflow-models/blazeface");
    const faceDetector = await blazeface.load({ maxFaces: 2 });

    return { coco, faceDetector };
  })();

  return modelsPromise;
}

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function getFirstFaceKeypoints(face: any): Array<{ x: number; y: number }> {
  // BlazeFace returns `landmarks` as an array of [x, y] tuples:
  // [rightEye, leftEye, nose, mouth, rightEar, leftEar]
  const raw = face?.landmarks;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((pt: any) => {
      const x = Array.isArray(pt) ? Number(pt[0]) : Number(pt?.x);
      const y = Array.isArray(pt) ? Number(pt[1]) : Number(pt?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    })
    .filter(
      (v: { x: number; y: number } | null): v is { x: number; y: number } =>
        v !== null
    );
}

function inferLookingAway(keypoints: Array<{ x: number; y: number }>): boolean {
  // BlazeFace landmarks:
  // 0: rightEye, 1: leftEye, 2: nose
  const rightEye = keypoints[0];
  const leftEye = keypoints[1];
  const nose = keypoints[2];

  if (!leftEye || !rightEye || !nose) return false;

  const midX = (leftEye.x + rightEye.x) / 2;
  const midY = (leftEye.y + rightEye.y) / 2;
  const eyeDist = Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y);
  if (!Number.isFinite(eyeDist) || eyeDist < 10) return false;

  // Normalized offsets from eye-center.
  const normX = (nose.x - midX) / eyeDist;
  const normY = (nose.y - midY) / eyeDist;

  // Heuristic thresholds.
  const lookingSideways = Math.abs(normX) > 0.35;
  const lookingUpDown = Math.abs(normY) > 0.55;

  return lookingSideways || lookingUpDown;
}

export async function startProctoring(options: ProctoringOptions): Promise<() => void> {
  const { videoEl, onViolation } = options;
  // Lower interval improves responsiveness (e.g., phone detection), but increases CPU usage.
  const intervalMs = Math.max(500, Number(options.intervalMs ?? 900));
  const lookingAwayMinDurationMs = Math.max(0, Number(options.lookingAwayMinDurationMs ?? 2500));
  const lookingAwayCooldownMs = Math.max(500, Number(options.lookingAwayCooldownMs ?? 8000));

  const models = await loadModels();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to initialize canvas context for proctoring");
  }

  let stopped = false;
  let inFlight = false;

  // Cooldown so we don’t spam toasts.
  const cooldownByCode: Record<ProctoringViolationCode, number> = {
    MULTIPLE_PEOPLE: 0,
    PHONE_VISIBLE: 0,
    FACE_NOT_VISIBLE: 0,
    LOOKING_AWAY: 0,
    TAB_SWITCH: 0,
    CLIPBOARD_SHORTCUT: 0,
  };
  const cooldownMsByCode: Record<ProctoringViolationCode, number> = {
    MULTIPLE_PEOPLE: 4000,
    PHONE_VISIBLE: 2000,
    FACE_NOT_VISIBLE: 3000,
    LOOKING_AWAY: lookingAwayCooldownMs,
    TAB_SWITCH: 0,
    CLIPBOARD_SHORTCUT: 2000,
  };

  // Reduce false positives for "LOOKING_AWAY" by requiring a sustained duration.
  // This avoids firing when the candidate glances at the keyboard or makes small eye movements.
  let lookingAwaySinceMs: number | null = null;

  const maybeEmit = (violation: ProctoringViolation) => {
    const t = nowMs();
    const last = cooldownByCode[violation.code] ?? 0;
    const cooldownMs = cooldownMsByCode[violation.code] ?? 4000;
    if (t - last < cooldownMs) return;
    cooldownByCode[violation.code] = t;
    onViolation(violation);
  };

  const tick = async () => {
    if (stopped || inFlight) return;

    // Video not ready.
    if (!videoEl.videoWidth || !videoEl.videoHeight || videoEl.readyState < 2) return;

    inFlight = true;
    try {
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      // Start face detection, but don't block phone/person violations on it.
      const facePromise = models.faceDetector.estimateFaces(canvas, false);

      const detections = await models.coco.detect(canvas);
      const dets = Array.isArray(detections) ? detections : [];

      const persons = dets.filter(
        (d: any) => d?.class === "person" && clamp01(Number(d?.score)) >= 0.55
      );
      const phones = dets.filter(
        (d: any) => d?.class === "cell phone" && clamp01(Number(d?.score)) >= 0.40
      );

      // Faces can finish after COCO; await them only once we need face-related checks.
      const faces = await facePromise;
      const faceList = Array.isArray(faces) ? faces : [];

      const faceCount = faceList.length;
      const personCount = persons.length;

      if (personCount > 1 || faceCount > 1) {
        maybeEmit({
          code: "MULTIPLE_PEOPLE",
          message: "Proctoring: multiple people detected in frame.",
          meta: { personCount, faceCount },
        });
      }

      if (phones.length > 0) {
        maybeEmit({
          code: "PHONE_VISIBLE",
          message: "Proctoring: phone detected in frame.",
          meta: { phoneCount: phones.length },
        });
      }

      if (faceCount === 0) {
        maybeEmit({
          code: "FACE_NOT_VISIBLE",
          message: "Proctoring: your face is not visible.",
        });
        lookingAwaySinceMs = null;
      } else {
        const keypoints = getFirstFaceKeypoints(faceList[0]);
        const away = inferLookingAway(keypoints);
        const t = nowMs();

        if (!away) {
          lookingAwaySinceMs = null;
        } else {
          if (lookingAwaySinceMs === null) lookingAwaySinceMs = t;

          if (t - lookingAwaySinceMs >= lookingAwayMinDurationMs) {
            maybeEmit({
              code: "LOOKING_AWAY",
              message: "Proctoring: please look at the screen.",
            });
            // Reset the timer so continued "away" doesn't rapidly re-trigger after cooldown.
            lookingAwaySinceMs = t;
          }
        }
      }
    } catch (error) {
      // Don’t crash the interview flow; just log once per interval.
      console.error("[proctoring] detection error", error);
    } finally {
      inFlight = false;
    }
  };

  const timer = window.setInterval(() => void tick(), intervalMs);
  // Run once immediately so we don't wait up to `intervalMs` after call start.
  void tick();

  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
}
