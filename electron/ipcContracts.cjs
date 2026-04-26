function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validationFailure(stage, error) {
  return { success: false, stage, error };
}

function errorToMessage(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

function shapeFailure(stage, error) {
  return { success: false, stage, error: errorToMessage(error) };
}

async function withTimeout(promise, timeoutMs, stage) {
  if (!timeoutMs || timeoutMs <= 0) return promise;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${stage} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function runWithRetry(stage, fn, { retries = 0, timeoutMs = 0, shouldRetry, onRetry } = {}) {
  let attempt = 0;
  let lastError;
  while (attempt <= retries) {
    try {
      return await withTimeout(Promise.resolve().then(() => fn(attempt)), timeoutMs, stage);
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt >= retries;
      const canRetry = !isLastAttempt && (typeof shouldRetry === "function" ? shouldRetry(errorToMessage(error)) : true);
      if (!canRetry) break;
      attempt += 1;
      if (typeof onRetry === "function") onRetry(attempt, retries, errorToMessage(error));
    }
  }
  throw lastError;
}

function validateEnhancePromptPayload(payload) {
  if (!isPlainObject(payload)) return "Payload must be an object.";
  if (typeof payload.rawPrompt !== "string" || !payload.rawPrompt.trim()) return "rawPrompt must be a non-empty string.";
  if (!Array.isArray(payload.selectedComponents) || payload.selectedComponents.length === 0) {
    return "selectedComponents must be a non-empty array.";
  }
  return null;
}

function validateGeneratePlaygroundArgs(args) {
  const validPackageManagers = new Set(["npm", "pnpm", "yarn", "bun"]);
  const isRichPayload = args.length === 3 && isPlainObject(args[0]) && isPlainObject(args[0].options);
  if (isRichPayload) {
    const payload = args[0];
    const taskId = args[2];
    if (!Array.isArray(payload.selectedComponents) || payload.selectedComponents.length === 0) {
      return { error: "selectedComponents must be a non-empty array for AI Build." };
    }
    if (typeof taskId !== "string" || !taskId.trim()) {
      return { error: "taskId must be a non-empty string for AI Build." };
    }
    if (!payload.options || typeof payload.options.projectPath !== "string" || !payload.options.projectPath.trim()) {
      return { error: "options.projectPath is required." };
    }
    if (typeof payload.options.projectName !== "string" || !payload.options.projectName.trim()) {
      return { error: "options.projectName is required." };
    }
    if (!validPackageManagers.has(payload.options.packageManager)) {
      return { error: "options.packageManager must be one of npm/pnpm/yarn/bun." };
    }
    return { isRichPayload: true, payload, taskId };
  }

  const [category, name, usageCode, componentFiles, options, taskId] = args;
  if (typeof category !== "string" || typeof name !== "string") {
    return { error: "Legacy payload requires category and name strings." };
  }
  if (typeof usageCode !== "string") {
    return { error: "Legacy payload requires usageCode string." };
  }
  if (!Array.isArray(componentFiles)) {
    return { error: "Legacy payload requires componentFiles array." };
  }
  if (!isPlainObject(options) || typeof options.projectPath !== "string" || !options.projectPath.trim()) {
    return { error: "Legacy payload requires options.projectPath." };
  }
  if (typeof options.projectName !== "string" || !options.projectName.trim()) {
    return { error: "Legacy payload requires options.projectName." };
  }
  if (!validPackageManagers.has(options.packageManager)) {
    return { error: "Legacy payload requires a valid options.packageManager." };
  }
  if (typeof taskId !== "string" || !taskId.trim()) {
    return { error: "Legacy payload requires taskId string." };
  }
  return { isRichPayload: false, taskId };
}

function validateStructurePayload(options) {
  const validPackageManagers = new Set(["npm", "pnpm", "yarn", "bun"]);
  if (!isPlainObject(options)) return "Payload must be an object.";
  if (!Array.isArray(options.pages)) return "pages must be an array.";
  if (typeof options.projectName !== "string" || !options.projectName.trim()) return "projectName is required.";
  if (typeof options.outputPath !== "string" || !options.outputPath.trim()) return "outputPath is required.";
  if (typeof options.packageManager !== "string" || !validPackageManagers.has(options.packageManager)) {
    return "packageManager must be one of npm/pnpm/yarn/bun.";
  }
  return null;
}



module.exports = {
  validationFailure,
  shapeFailure,
  runWithRetry,
  validateEnhancePromptPayload,
  validateGeneratePlaygroundArgs,
  validateStructurePayload,

};
