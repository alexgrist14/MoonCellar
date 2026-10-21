// The map format of the port's player levels (docs/level-format.md of the decompilation project):
// big-endian, read in the order of the game's map loader, which trusts the file. This check walks
// the structure and the indices the loader dereferences, so a level that passes cannot crash the
// game; it is the server copy of the port's own check (port/src/platform/levels.cpp). It knows only
// the layout of the format and the lengths of the game's lookup tables, never level data.

import type { IGameLevelMode } from "@mooncellar/schemas";

// Lengths of the loader's lookup tables: palette and sounds, model sets, materials, object types,
// hint texts, cutscenes.
const TABLES = {
  resource: 48,
  modelSet: 12,
  material: 8,
  objectType: 16,
  hint: 40,
  cutscene: 14,
} as const;

const NUM_LAYERS = 4;
const PATH_OBJECTS = new Set([1, 4, 5, 7, 8]); // walk a path; 5 and 7 always take one
const NEEDS_PATH = new Set([5, 7]);

class Reader {
  pos = 0;
  error: string | null = null;

  constructor(private readonly data: Buffer) {}

  private take(n: number) {
    if (n < 0 || this.pos + n > this.data.length) {
      this.fail(`the file ends at byte ${this.pos}`);
      this.pos = this.data.length;
      return false;
    }
    return true;
  }
  fail(what: string) {
    this.error ??= `${what} (byte ${this.pos})`;
  }
  i8() {
    if (!this.take(1)) return 0;
    return this.data.readInt8(this.pos++);
  }
  u8() {
    if (!this.take(1)) return 0;
    return this.data.readUInt8(this.pos++);
  }
  i16() {
    if (!this.take(2)) return 0;
    const v = this.data.readInt16BE(this.pos);
    this.pos += 2;
    return v;
  }
  u16() {
    if (!this.take(2)) return 0;
    const v = this.data.readUInt16BE(this.pos);
    this.pos += 2;
    return v;
  }
  i32() {
    if (!this.take(4)) return 0;
    const v = this.data.readInt32BE(this.pos);
    this.pos += 4;
    return v;
  }
  skip(n: number) {
    if (this.take(n)) this.pos += n;
  }
  count(n: number, what: string, min = 0) {
    if (n < min) this.fail(`${what}: ${n}`);
    return Math.max(0, n);
  }
  index(v: number, size: number, what: string) {
    if (v < 0 || v >= size) this.fail(`${what} ${v} is out of range`);
  }
}

type ISection = { nodes: number; visions: number };

const readRef = (r: Reader, layers: ISection[][][], checkpoint: boolean) => {
  const [l, c, s, n] = [r.i16(), r.i16(), r.i16(), r.i16()];
  const section = layers[l]?.[c]?.[s];
  if (!section || n < 0 || n >= section.nodes) {
    r.fail("a graphics reference points outside the graphics");
  } else if (checkpoint && n >= section.visions) {
    r.fail("a checkpoint points at a piece without a highlight");
  }
};

const BAG = 3;

// The reason the level would not load, or null when it would. A race needs a finish, a bags level
// a bag to collect.
export const checkLevel = (
  data: Buffer,
  mode: IGameLevelMode = "race"
): string | null => {
  const r = new Reader(data);
  r.index(r.i32(), TABLES.resource, "palette");
  r.i8();
  r.index(r.i32(), TABLES.modelSet, "model set");
  r.skip(12);
  // Shape strips: every end within the shape list, whose length is the last end
  const strips = r.count(r.i16(), "shape strips", 1);
  const ranges: [number, number][] = [];
  for (let i = 0; i < strips * NUM_LAYERS && !r.error; i++) {
    ranges.push([r.i16(), r.i16()]);
  }
  const shapes = ranges.length ? ranges[ranges.length - 1][1] : 0;
  for (const [start, end] of ranges) {
    if (start < 0 || start > end || end > shapes) {
      r.fail("a shape strip points outside the shapes");
    }
  }
  for (let i = 0; i < shapes && !r.error; i++) {
    r.skip(16);
    const type = r.i8();
    if (type < 0 || type > 2) r.fail(`shape type ${type}`);
    const material = r.i32();
    if (material < 0) r.fail(`material ${material}`);
    r.index(material & 0xff, TABLES.material, "material");
  }
  // Graphics: every section has a piece, and no more highlights than slots for them
  const layers: ISection[][][] = [];
  const layerCount = r.count(r.i8(), "graphics layers");
  for (let l = 0; l < layerCount && !r.error; l++) {
    const columns: ISection[][] = [];
    const columnCount = r.count(r.i8(), "columns");
    for (let c = 0; c < columnCount && !r.error; c++) {
      r.skip(24);
      const sections: ISection[] = [];
      const sectionCount = r.count(r.i8(), "sections");
      for (let s = 0; s < sectionCount && !r.error; s++) {
        r.skip(24);
        const slots = r.count(r.i8(), "highlight slots");
        const nodes = r.count(r.i8(), "pieces in a section", 1);
        let visions = 0;
        for (let n = 0; n < nodes && !r.error; n++) {
          r.skip(17); // id, x, y, z, shared
          if (r.i8() === 1) {
            visions++;
            r.skip(17); // type, area
          }
        }
        if (visions > slots) r.fail("more highlights than slots for them");
        sections.push({ nodes, visions });
      }
      columns.push(sections);
    }
    layers.push(columns);
  }
  // Paths, fall and pain areas
  const paths: number[] = [];
  const pathCount = r.count(r.i16(), "paths");
  for (let p = 0; p < pathCount && !r.error; p++) {
    const points = r.count(r.i16(), "path points");
    r.skip(points * 20);
    paths.push(points);
  }
  r.skip(r.count(r.i16(), "fall areas") * 24);
  r.skip(r.count(r.i16(), "pain areas") * 24);
  // Objects: path walkers need a path (-1 stands still, except 5 and 7)
  let bags = 0;
  for (let n = r.u16(); n > 0 && !r.error; n--) {
    const type = r.i32();
    if (type === BAG) bags++;
    r.skip(12);
    const path = r.i32();
    const pathOk = path >= 0 && path < paths.length && paths[path] >= 1;
    if (PATH_OBJECTS.has(type)) {
      if (!pathOk && (NEEDS_PATH.has(type) || path !== -1)) {
        r.fail("an object walks a path that is not there");
      }
    } else if (type !== 0 && type !== 6) {
      r.index(type, TABLES.objectType, "object type");
    }
    if (r.i8() === 1) readRef(r, layers, false);
  }
  const starts = r.count(r.u8(), "starts", 1);
  for (let i = 0; i < starts && !r.error; i++) {
    r.skip(12);
    const facing = r.i8();
    if (facing !== -1 && facing !== 1) r.fail(`start facing ${facing}`);
  }
  r.skip(r.count(r.u8(), "finishes", mode === "race" ? 1 : 0) * 16);
  if (mode === "bags" && bags === 0 && !r.error) r.fail("bags: 0");
  for (let n = r.u8(); n > 0 && !r.error; n--) {
    r.skip(16);
    readRef(r, layers, true);
  }
  for (let list = 0; list < 3 && !r.error; list++) {
    for (let n = r.u16(); n > 0 && !r.error; n--) {
      r.index(r.i32(), TABLES.resource, "sound");
      r.skip(12);
    }
  }
  r.skip(r.count(r.i8(), "zip lines") * 20);
  for (const [what, size] of [
    ["hint", TABLES.hint],
    ["cutscene", TABLES.cutscene],
  ] as const) {
    for (let n = r.count(r.i16(), `${what}s`); n > 0 && !r.error; n--) {
      r.index(r.i32(), size, what);
      r.skip(16);
    }
  }
  for (
    let anims = r.count(r.i16(), "camera animations");
    anims > 0 && !r.error;
    anims--
  ) {
    r.i8();
    r.skip(r.count(r.i16(), "camera steps") * 32);
  }
  if (!r.error && r.pos !== data.length) {
    r.fail(`${data.length - r.pos} bytes after the camera animations`);
  }
  return r.error;
};
