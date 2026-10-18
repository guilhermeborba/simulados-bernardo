import type { MobileSessionClient } from "../core/session";

export const SVG_MAX_BYTES = 128 * 1024;
export const AUDIO_MAX_BYTES = 4 * 1024 * 1024;
export class MobileMediaError extends Error {
  constructor() {
    super("Não foi possível carregar esta mídia. Tente novamente.");
    this.name = "MobileMediaError";
  }
}
export class MediaCancelledError extends Error {
  constructor() {
    super("Carregamento da mídia cancelado.");
    this.name = "MediaCancelledError";
  }
}

/** Media has one authenticated attempt/question route; arbitrary API paths are refused. */
export function validateMediaPath(
  path: string,
  kind: "image" | "audio",
): string {
  if (typeof path !== "string" || !["image", "audio"].includes(kind))
    throw new MobileMediaError();
  const match = new RegExp(
    `^/attempts/[A-Za-z0-9_-]{1,128}/questions/[A-Za-z0-9_-]{1,128}/media/${kind}$`,
  ).exec(path);
  // JavaScript's $ also matches before a final newline; require the full string.
  if (!match || match[0] !== path) throw new MobileMediaError();
  return path;
}

/** Only the static SVG subset used by our reviewed illustrations is accepted. */
export function renderSvgXml(bytes: Uint8Array): string {
  if (bytes.length === 0 || bytes.length > SVG_MAX_BYTES)
    throw new MobileMediaError();
  let xml: string;
  try {
    xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new MobileMediaError();
  }
  if (
    !/^\s*(?:<\?xml[^?]*\?>\s*)?<svg[\s>]/i.test(xml) ||
    !/<\/svg>\s*$/i.test(xml) ||
    /<!DOCTYPE|<!ENTITY|<\s*(?:script|foreignObject|iframe|object|embed|audio|video|animate\w*|set)\b/i.test(
      xml,
    ) ||
    /\son[a-z]+\s*=|@import|javascript:/i.test(xml) ||
    /(?:href|src)\s*=\s*(?:"(?!#)[^"]*"|'(?!#)[^']*'|[^\s"'][^\s>]*)/i.test(xml)
  )
    throw new MobileMediaError();
  for (const match of xml.matchAll(/url\(([^)]*)\)/gi)) {
    const reference = match[1].trim().replace(/^["']|["']$/g, "");
    if (!/^#[A-Za-z_][A-Za-z0-9_.:-]*$/.test(reference))
      throw new MobileMediaError();
  }
  return xml;
}

/** The current catalogue uses short linear-PCM WAV narration. */
export function validateNarrationWav(bytes: Uint8Array): void {
  const ascii = (offset: number, length: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + length));
  if (
    bytes.length < 44 ||
    bytes.length > AUDIO_MAX_BYTES ||
    ascii(0, 4) !== "RIFF" ||
    ascii(8, 4) !== "WAVE"
  )
    throw new MobileMediaError();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(4, true) + 8 !== bytes.length)
    throw new MobileMediaError();
  let format = false;
  let data = false;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const name = ascii(offset, 4);
    const size = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (start + size > bytes.length) throw new MobileMediaError();
    if (name === "fmt ") {
      if (size < 16 || format) throw new MobileMediaError();
      const channels = view.getUint16(start + 2, true);
      const sampleRate = view.getUint32(start + 4, true);
      const byteRate = view.getUint32(start + 8, true);
      const blockAlign = view.getUint16(start + 12, true);
      const bits = view.getUint16(start + 14, true);
      if (
        view.getUint16(start, true) !== 1 ||
        ![1, 2].includes(channels) ||
        ![8, 16].includes(bits) ||
        sampleRate < 8_000 ||
        sampleRate > 48_000 ||
        blockAlign !== (channels * bits) / 8 ||
        byteRate !== sampleRate * blockAlign
      )
        throw new MobileMediaError();
      format = true;
    }
    if (name === "data" && size > 0) data = true;
    offset = start + size + (size % 2);
  }
  if (!format || !data || offset !== bytes.length) throw new MobileMediaError();
}

interface MediaPlayer {
  play(): void;
  pause(): void;
  remove(): void;
}
export interface MediaPorts {
  writeWav(bytes: Uint8Array, name: string): Promise<string>;
  deleteWav(uri: string): Promise<void>;
  clearDirectory(): Promise<void>;
  createPlayer(uri: string): Promise<MediaPlayer>;
}

async function createNativeMediaPorts(): Promise<MediaPorts> {
  const files = await import("expo-file-system");
  const directory = new files.Directory(
    files.Paths.cache,
    "simulados-bernardo-media",
  );
  // A previous process may have ended without an AppState event. Discard its
  // private narration before allowing this process to create a new player.
  if (directory.exists) directory.delete();
  return {
    async writeWav(bytes, name) {
      directory.create({ intermediates: true, idempotent: true });
      const file = new files.File(directory, name);
      file.create({ overwrite: true });
      try {
        file.write(bytes);
      } catch (error) {
        try {
          if (file.exists) file.delete();
        } catch {
          /* clearDirectory retries cleanup. */
        }
        throw error;
      }
      return file.uri;
    },
    async deleteWav(uri) {
      const file = new files.File(uri);
      if (file.exists) file.delete();
    },
    async clearDirectory() {
      if (directory.exists) directory.delete();
    },
    async createPlayer(uri) {
      const audio = await import("expo-audio");
      await audio.setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
        interruptionMode: "doNotMix",
      });
      const player = audio.createAudioPlayer({ uri });
      try {
        if (!player.currentStatus.isLoaded) {
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
              listener.remove();
              reject(new MobileMediaError());
            }, 10_000);
            const listener = player.addListener(
              "playbackStatusUpdate",
              (status) => {
                if (status.error || status.isLoaded) {
                  clearTimeout(timer);
                  listener.remove();
                  if (status.error) reject(new MobileMediaError());
                  else resolve();
                }
              },
            );
          });
        }
        return player;
      } catch {
        try {
          player.remove();
        } catch {
          /* Preserve the public media error. */
        }
        throw new MobileMediaError();
      }
    },
  };
}

/** A session-bound cache: callers clear it on logout, account/attempt switch and background. */
export class MobileMediaCache {
  private generation = 0;
  private audioGeneration = 0;
  private counter = 0;
  private ports: Promise<MediaPorts> | undefined;
  private cleanupQueue: Promise<void> = Promise.resolve();
  private readonly players = new Set<MediaPlayer>();
  private readonly illustrations = new Map<string, string>();
  private readonly files = new Set<string>();

  constructor(
    private readonly client: Pick<MobileSessionClient, "requestBytes">,
    private readonly loadPorts: () => Promise<MediaPorts> = createNativeMediaPorts,
  ) {}

  private current(generation: number, signal?: AbortSignal) {
    if (generation !== this.generation || signal?.aborted)
      throw new MediaCancelledError();
  }
  private native() {
    return (this.ports ??= this.loadPorts());
  }

  async loadSvg(path: string, signal?: AbortSignal): Promise<string> {
    validateMediaPath(path, "image");
    const generation = this.generation;
    this.current(generation, signal);
    const cached = this.illustrations.get(path);
    if (cached) return cached;
    const { bytes } = await this.client.requestBytes(
      path,
      { maxBytes: SVG_MAX_BYTES, contentTypes: ["image/svg+xml"] },
      { signal },
    );
    this.current(generation, signal);
    const xml = renderSvgXml(bytes);
    this.illustrations.set(path, xml);
    return xml;
  }

  async playAudio(path: string, signal?: AbortSignal): Promise<void> {
    validateMediaPath(path, "audio");
    const clearing = this.clearAudio();
    const generation = this.generation;
    const audioGeneration = this.audioGeneration;
    const current = () => {
      this.current(generation, signal);
      if (audioGeneration !== this.audioGeneration)
        throw new MediaCancelledError();
    };
    await clearing;
    let uri: string | undefined;
    let player: MediaPlayer | undefined;
    try {
      current();
      const { bytes } = await this.client.requestBytes(
        path,
        {
          maxBytes: AUDIO_MAX_BYTES,
          contentTypes: ["audio/wav", "audio/x-wav", "audio/wave"],
        },
        { signal },
      );
      current();
      validateNarrationWav(bytes);
      const ports = await this.native();
      current();
      uri = await ports.writeWav(
        bytes,
        `narration-${Date.now()}-${this.counter++}.wav`,
      );
      this.files.add(uri);
      current();
      player = await ports.createPlayer(uri);
      this.players.add(player);
      current();
      player.play();
    } catch (error) {
      if (player) {
        try {
          player.pause();
        } catch {
          /* Preserve the public error and attempt removal. */
        }
        try {
          player.remove();
          this.players.delete(player);
        } catch {
          /* Retain the handle so clear() can retry stopping/releasing it. */
        }
      }
      if (uri && this.ports) {
        try {
          await (await this.ports).deleteWav(uri);
          this.files.delete(uri);
        } catch {
          /* clear() retains ownership for a later retry. */
        }
      }
      if (error instanceof MediaCancelledError) throw error;
      throw new MobileMediaError();
    }
  }

  clear(): Promise<void> {
    this.generation++;
    this.illustrations.clear();
    return this.clearAudio();
  }

  private clearAudio(): Promise<void> {
    this.audioGeneration++;
    let failed = false;
    for (const player of [...this.players]) {
      try {
        player.pause();
      } catch {
        failed = true;
      }
      try {
        player.remove();
        this.players.delete(player);
      } catch {
        failed = true; /* Retain ownership until native release succeeds. */
      }
    }
    const clean = async () => {
      if (this.ports) {
        try {
          const ports = await this.ports;
          for (const uri of [...this.files]) {
            try {
              await ports.deleteWav(uri);
              this.files.delete(uri);
            } catch {
              failed = true;
            }
          }
          await ports.clearDirectory();
          this.files.clear();
        } catch {
          failed = true;
        }
      }
      if (failed) throw new MobileMediaError();
    };
    const operation = this.cleanupQueue.then(clean, clean);
    this.cleanupQueue = operation.catch(() => undefined);
    return operation;
  }
}
