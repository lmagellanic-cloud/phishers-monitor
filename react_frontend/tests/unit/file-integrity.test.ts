import { describe, expect, it, vi } from "vitest";
import { calculateMd5 } from "../../app/file-integrity";

describe("calculateMd5", () => {
  it("returns the MD5 digest for a file", async () => {
    const digest = await calculateMd5(new Blob(["hello"]));

    expect(digest).toBe("5d41402abc4b2a76b9719d911017c592");
  });

  it("reports completion for an empty file", async () => {
    const onProgress = vi.fn();

    await expect(calculateMd5(new Blob(), onProgress)).resolves.toBe(
      "d41d8cd98f00b204e9800998ecf8427e",
    );
    expect(onProgress).toHaveBeenCalledWith(100);
  });
});