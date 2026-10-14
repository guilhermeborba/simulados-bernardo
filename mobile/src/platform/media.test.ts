import assert from "node:assert/strict";
import test from "node:test";
import {
  MobileMediaCache,
  MediaCancelledError,
  MobileMediaError,
  renderSvgXml,
  validateNarrationWav,
  type MediaPorts,
} from "./media";

const svg = (value: string) => new TextEncoder().encode(value);
const mediaPath = (kind: "image" | "audio", question = "question-test") =>
  `/attempts/attempt-test/questions/${question}/media/${kind}`;
function wav() {
  const bytes = new Uint8Array(46);
  const view = new DataView(bytes.buffer);
  const tag = (offset: number, value: string) =>
    bytes.set(new TextEncoder().encode(value), offset);
  tag(0, "RIFF");
  view.setUint32(4, 38, true);
  tag(8, "WAVE");
  tag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16_000, true);
  view.setUint32(28, 32_000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  tag(36, "data");
  view.setUint32(40, 2, true);
  return bytes;
}

test("static SVG allows local gradients and rejects external or executable content", () => {
  assert.match(
    renderSvgXml(
      svg('<svg viewBox="0 0 10 10"><rect fill="url(#paint)" /></svg>'),
    ),
    /rect/,
  );
  assert.match(
    renderSvgXml(svg("<svg><rect style=\"fill:url('#paint')\" /></svg>")),
    /rect/,
  );
  for (const content of [
    "<script>1</script>",
    "<foreignObject/>",
    '<use href="https://external.test"/>',
    '<use xlink:href="data:text/xml,bad"/>',
    '<rect onload="bad"/>',
    '<rect fill="url(https://external.test)"/>',
    '<animate attributeName="href" to="https://external.test"/>',
  ]) {
    assert.throws(
      () => renderSvgXml(svg(`<svg>${content}</svg>`)),
      MobileMediaError,
    );
  }
});

test("WAV accepts the catalogue PCM subset and rejects invalid container/codec/length", () => {
  assert.doesNotThrow(() => validateNarrationWav(wav()));
  const bad = wav();
  new DataView(bad.buffer).setUint16(20, 3, true);
  assert.throws(() => validateNarrationWav(bad), MobileMediaError);
  assert.throws(
    () => validateNarrationWav(wav().subarray(0, 45)),
    MobileMediaError,
  );
});

test("logout/background clearing cancels an outstanding illustration before it can be shown", async () => {
  let resolve!: (value: { bytes: Uint8Array; contentType: string }) => void;
  const media = new MobileMediaCache({
    requestBytes: async () =>
      new Promise((ready) => {
        resolve = ready;
      }),
  });
  const loading = media.loadSvg(mediaPath("image"));
  await media.clear();
  resolve({ bytes: svg("<svg></svg>"), contentType: "image/svg+xml" });
  await assert.rejects(loading, MediaCancelledError);
});

test("only checked bytes are written privately and clearing stops/removes the player and file", async () => {
  const events: string[] = [];
  const ports: MediaPorts = {
    writeWav: async () => {
      events.push("write");
      return "file:///private/cache/narration.wav";
    },
    deleteWav: async () => {
      events.push("delete");
    },
    clearDirectory: async () => {
      events.push("directory");
    },
    createPlayer: async () => ({
      play: () => {
        events.push("play");
      },
      pause: () => {
        events.push("pause");
      },
      remove: () => {
        events.push("remove");
      },
    }),
  };
  const media = new MobileMediaCache(
    {
      requestBytes: async (_path, limits) => {
        assert.ok(limits.contentTypes.includes("audio/wav"));
        return { bytes: wav(), contentType: "audio/wav" };
      },
    },
    async () => ports,
  );
  await media.playAudio(mediaPath("audio"));
  await media.clear();
  assert.deepEqual(events, [
    "write",
    "play",
    "pause",
    "remove",
    "delete",
    "directory",
  ]);
});

test("background clearing during WAV download never creates a file or starts playback", async () => {
  let resolve!: (value: { bytes: Uint8Array; contentType: string }) => void;
  let nativeCalls = 0;
  const media = new MobileMediaCache(
    {
      requestBytes: async () =>
        new Promise((ready) => {
          resolve = ready;
        }),
    },
    async () => {
      nativeCalls++;
      throw new Error();
    },
  );
  const playing = media.playAudio(mediaPath("audio"));
  await new Promise<void>((ready) => setImmediate(ready));
  await media.clear();
  resolve({ bytes: wav(), contentType: "audio/wav" });
  await assert.rejects(playing, MediaCancelledError);
  assert.equal(nativeCalls, 0);
});

test("cache cleanup failure is explicit and never reports successful cleanup", async () => {
  const media = new MobileMediaCache(
    { requestBytes: async () => ({ bytes: wav(), contentType: "audio/wav" }) },
    async () => ({
      writeWav: async () => "file:///private/audio.wav",
      deleteWav: async () => {
        throw new Error("native secret details");
      },
      clearDirectory: async () => {
        throw new Error();
      },
      createPlayer: async () => ({ play() {}, pause() {}, remove() {} }),
    }),
  );
  await media.playAudio(mediaPath("audio"));
  await assert.rejects(
    media.clear(),
    (error: unknown) =>
      error instanceof MobileMediaError &&
      !error.message.includes("native secret"),
  );
});

test("two quick narration requests allow only the newest player to start", async () => {
  let plays = 0;
  const media = new MobileMediaCache(
    { requestBytes: async () => ({ bytes: wav(), contentType: "audio/wav" }) },
    async () => ({
      writeWav: async () => "file:///private/audio.wav",
      deleteWav: async () => {},
      clearDirectory: async () => {},
      createPlayer: async () => ({
        play() {
          plays++;
        },
        pause() {},
        remove() {},
      }),
    }),
  );
  const first = media.playAudio(mediaPath("audio", "first-question"));
  const second = media.playAudio(mediaPath("audio", "second-question"));
  await assert.rejects(first, MediaCancelledError);
  await second;
  assert.equal(plays, 1);
  await media.clear();
});

test("a player prepared after background cleanup is removed without starting playback", async () => {
  let ready!: (value: { play(): void; pause(): void; remove(): void }) => void;
  let creation!: () => void;
  const started = new Promise<void>((resolve) => {
    creation = resolve;
  });
  let plays = 0;
  let removed = 0;
  const media = new MobileMediaCache(
    { requestBytes: async () => ({ bytes: wav(), contentType: "audio/wav" }) },
    async () => ({
      writeWav: async () => "file:///private/audio.wav",
      deleteWav: async () => {},
      clearDirectory: async () => {},
      createPlayer: async () => {
        creation();
        return new Promise((resolve) => {
          ready = resolve;
        });
      },
    }),
  );
  const playing = media.playAudio(mediaPath("audio"));
  await started;
  await media.clear();
  ready({
    play() {
      plays++;
    },
    pause() {},
    remove() {
      removed++;
    },
  });
  await assert.rejects(playing, MediaCancelledError);
  assert.equal(plays, 0);
  assert.equal(removed, 1);
});

test("playing narration does not cancel an illustration loading for the same question", async () => {
  let finishImage!: (value: { bytes: Uint8Array; contentType: string }) => void;
  const media = new MobileMediaCache(
    {
      requestBytes: async (path) =>
        path.endsWith("image")
          ? new Promise((resolve) => {
              finishImage = resolve;
            })
          : { bytes: wav(), contentType: "audio/wav" },
    },
    async () => ({
      writeWav: async () => "file:///private/audio.wav",
      deleteWav: async () => {},
      clearDirectory: async () => {},
      createPlayer: async () => ({ play() {}, pause() {}, remove() {} }),
    }),
  );
  const image = media.loadSvg(mediaPath("image"));
  await media.playAudio(mediaPath("audio"));
  finishImage({ bytes: svg("<svg></svg>"), contentType: "image/svg+xml" });
  assert.equal(await image, "<svg></svg>");
  await media.clear();
});

test("failed native stop/release retains the player and cleanup retry must release that same handle", async () => {
  let canStop = false;
  let playing = false;
  let pauseCalls = 0;
  let removeCalls = 0;
  const media = new MobileMediaCache(
    { requestBytes: async () => ({ bytes: wav(), contentType: "audio/wav" }) },
    async () => ({
      writeWav: async () => "file:///private/audio.wav",
      deleteWav: async () => {},
      clearDirectory: async () => {},
      createPlayer: async () => ({
        play() {
          playing = true;
        },
        pause() {
          pauseCalls++;
          if (!canStop) throw new Error("native pause failed");
          playing = false;
        },
        remove() {
          removeCalls++;
          if (!canStop) throw new Error("native remove failed");
          playing = false;
        },
      }),
    }),
  );
  await media.playAudio(mediaPath("audio"));
  await assert.rejects(media.clear(), MobileMediaError);
  assert.equal(playing, true);
  await assert.rejects(media.clear(), MobileMediaError);
  assert.equal(playing, true);
  assert.equal(pauseCalls, 2);
  assert.equal(removeCalls, 2);
  canStop = true;
  await media.clear();
  assert.equal(playing, false);
  assert.equal(pauseCalls, 3);
  assert.equal(removeCalls, 3);
});

test("illustrations reject wrong routes, query/fragment and external URLs before any request", async () => {
  let requests = 0;
  const media = new MobileMediaCache({
    requestBytes: async () => {
      requests++;
      throw new Error();
    },
  });
  for (const path of [
    "/auth/me",
    mediaPath("audio"),
    `${mediaPath("image")}\n`,
    `${mediaPath("image")}?token=example`,
    `${mediaPath("image")}#secret`,
    `https://external.test${mediaPath("image")}`,
    `/attempts/attempt-test/questions/../media/image`,
    `/attempts/${"a".repeat(129)}/questions/question-test/media/image`,
  ])
    await assert.rejects(media.loadSvg(path), MobileMediaError);
  assert.equal(requests, 0);
});

test("narration rejects wrong routes, query/fragment and external URLs before requests or native I/O", async () => {
  let requests = 0;
  let nativeCalls = 0;
  const media = new MobileMediaCache(
    {
      requestBytes: async () => {
        requests++;
        throw new Error();
      },
    },
    async () => {
      nativeCalls++;
      throw new Error();
    },
  );
  for (const path of [
    "/auth/logout",
    mediaPath("image"),
    `${mediaPath("audio")}\n`,
    `${mediaPath("audio")}?download=1`,
    `${mediaPath("audio")}#secret`,
    `https://external.test${mediaPath("audio")}`,
    "//external.test/media/audio",
    "/attempts/attempt-test/questions/encoded%2Fquestion/media/audio",
  ])
    await assert.rejects(media.playAudio(path), MobileMediaError);
  assert.equal(requests, 0);
  assert.equal(nativeCalls, 0);
});
