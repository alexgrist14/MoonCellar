// ISR cache that never writes to disk.
//
// The default FileSystemCache persists every on-demand rendered page into
// .next/server/app with no size limit. Crawlers walking the /games catalog
// filled the server disk that way (~40 GB in a day). With flushToDisk off it
// still serves build-time prerendered pages from disk, but keeps new entries
// only in its in-memory LRU, bounded by `cacheMaxMemorySize`.
//
// Relies on a Next.js internal module, so re-check this path on Next upgrades.
const FileSystemCache =
  require("next/dist/server/lib/incremental-cache/file-system-cache").default;

module.exports = class MemoryOnlyCacheHandler extends FileSystemCache {
  constructor(ctx) {
    super({ ...ctx, flushToDisk: false });
  }
};
