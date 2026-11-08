import SparkMD5 from "spark-md5";

const chunkSize = 2 * 1024 * 1024;

export async function calculateMd5(
  file: Blob,
  onProgress?: (progress: number) => void,
) {
  const digest = new SparkMD5.ArrayBuffer();

  for (let offset = 0; offset < file.size; offset += chunkSize) {
    const chunk = await file.slice(offset, offset + chunkSize).arrayBuffer();
    digest.append(chunk);
    onProgress?.(Math.round(((offset + chunk.byteLength) / file.size) * 100));
  }

  if (file.size === 0) onProgress?.(100);
  return digest.end();
}