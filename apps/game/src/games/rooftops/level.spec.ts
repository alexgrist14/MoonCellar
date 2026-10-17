import { describe, expect, test } from "bun:test";
import { checkLevel } from "./level";

// A minimal level written field by field in the loader's order: one floor block, no graphics,
// one start and one finish. No game data is involved.
class Writer {
  private bytes: number[] = [];
  i8(v: number) {
    this.bytes.push(v & 0xff);
    return this;
  }
  i16(v: number) {
    return this.i8(v >> 8).i8(v);
  }
  i32(v: number) {
    return this.i16(v >> 16).i16(v);
  }
  fix(v: number) {
    return this.i32(Math.round(v * 65536));
  }
  done() {
    return Buffer.from(this.bytes);
  }
}

type IOverrides = { shapeType?: number; starts?: number; trailing?: number };

const level = ({ shapeType = 0, starts = 1, trailing = 0 }: IOverrides = {}) => {
  const w = new Writer();
  w.i32(0).i8(0).i32(0).fix(-50).fix(200).fix(64);
  w.i16(4); // strips per layer
  for (let layer = 0; layer < 4; layer++) {
    for (let i = 0; i < 4; i++) w.i16(layer === 0 ? 0 : 1).i16(1);
  }
  w.fix(-40).fix(0).fix(150).fix(1).i8(shapeType).i32(0); // the floor
  w.i8(0); // graphics layers
  w.i16(0).i16(0).i16(0); // paths, fall areas, pain areas
  w.i16(0); // objects
  w.i8(starts);
  for (let i = 0; i < starts; i++) w.fix(0).fix(1).fix(0).i8(1);
  w.i8(1).fix(100).fix(1).fix(10).fix(6); // finish
  w.i8(0); // checkpoints
  w.i16(0).i16(0).i16(0); // sounds
  w.i8(0); // zip lines
  w.i16(0).i16(0); // hints, cutscene triggers
  w.i16(0); // camera animations
  for (let i = 0; i < trailing; i++) w.i8(0);
  return w.done();
};

describe("checkLevel", () => {
  test("takes a minimal level", () => {
    expect(checkLevel(level())).toBeNull();
  });

  test("rejects an unknown shape type", () => {
    expect(checkLevel(level({ shapeType: 7 }))).toContain("shape type 7");
  });

  test("rejects a level without a start", () => {
    expect(checkLevel(level({ starts: 0 }))).toContain("starts: 0");
  });

  test("rejects bytes after the end", () => {
    expect(checkLevel(level({ trailing: 3 }))).toContain("3 bytes after");
  });

  test("rejects a cut file", () => {
    const data = level();
    expect(checkLevel(data.subarray(0, data.length - 5))).toContain(
      "the file ends"
    );
  });
});
