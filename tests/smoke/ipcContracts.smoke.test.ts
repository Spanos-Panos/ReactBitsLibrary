import { describe, expect, it } from "vitest";

const {
  validateGeneratePlaygroundArgs,
  validateStructurePayload,
  validateVisionReworkPayload,
} = require("../../electron/ipcContracts.cjs");

describe("IPC contract smoke tests", () => {
  it("accepts rich generate-playground payload", () => {
    const result = validateGeneratePlaygroundArgs([
      {
        options: {
          projectPath: "C:\\temp",
          projectName: "demo-app",
          packageManager: "npm",
        },
        selectedComponents: [{ id: "Components/CardNav", name: "CardNav", category: "Components" }],
      },
      null,
      "task-123",
    ]);

    expect(result.error).toBeUndefined();
    expect(result.isRichPayload).toBe(true);
  });

  it("rejects invalid structure package manager", () => {
    const err = validateStructurePayload({
      pages: [],
      projectName: "demo",
      outputPath: "C:\\temp",
      packageManager: "pip",
    });

    expect(err).toContain("packageManager");
  });

  it("requires key fields for vision rework", () => {
    const err = validateVisionReworkPayload({
      projectPath: "C:\\temp",
      projectName: "demo",
      referenceImagePath: "",
      weaknessesMd: "missing spacing consistency",
      taskId: "rework-1",
      originalPreset: {},
      backupFirst: true,
    });

    expect(err).toContain("referenceImagePath");
  });
});
