import {
  FC,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import { Input } from "../Input";
import { Loader } from "../Loader";
import { Scrollbar } from "../Scrollbar";
import { useCloseEvents } from "@/src/lib/shared/hooks/useCloseEvents";
import { useSettingsStore } from "@/src/lib/shared/store/settings.store";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import {
  EMOJI_GROUPS,
  IEmoji,
  IEmojiGroup,
  loadEmojiGroups,
  searchEmojis,
} from "./emoji.data";
import styles from "./EmojiPicker.module.scss";

interface IEmojiPickerProps {
  anchorRef: RefObject<HTMLElement | null>;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const OFFSET = 8;
const RECENT_GROUP = -1;

export const EmojiPicker: FC<IEmojiPickerProps> = ({
  anchorRef,
  onSelect,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const recentEmojis = useSettingsStore((state) => state.recentEmojis);
  const addRecentEmoji = useSettingsStore((state) => state.addRecentEmoji);

  const [groups, setGroups] = useState<IEmojiGroup[]>();
  const [isFailed, setIsFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState(() =>
    recentEmojis?.length ? RECENT_GROUP : EMOJI_GROUPS[0].key
  );
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );

  const closeRefs = useMemo(() => [anchorRef, popoverRef], [anchorRef]);

  useCloseEvents(closeRefs, onClose);

  const connector = commonUtils.checkWindow(
    () => document.getElementById("dropdown-connector") ?? document.body
  );

  useEffect(() => {
    let isCancelled = false;

    loadEmojiGroups(
      popoverRef.current
        ? getComputedStyle(popoverRef.current).fontFamily
        : undefined
    )
      .then((loaded) => {
        if (!isCancelled) setGroups(loaded);
      })
      .catch(() => {
        if (!isCancelled) setIsFailed(true);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const updateCoords = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();

      if (!anchor) return;

      const popover = popoverRef.current?.getBoundingClientRect();
      const width = popover?.width ?? 0;
      const height = popover?.height ?? 0;
      const isFlipped =
        anchor.bottom + OFFSET + height > window.innerHeight &&
        anchor.top - OFFSET - height > 0;

      setCoords({
        top: Math.max(
          OFFSET,
          isFlipped ? anchor.top - OFFSET - height : anchor.bottom + OFFSET
        ),
        left: Math.max(
          OFFSET,
          Math.min(anchor.left, window.innerWidth - width - OFFSET)
        ),
      });
    };

    updateCoords();

    const frame = requestAnimationFrame(updateCoords);

    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [anchorRef, groups]);

  const recentGroup = useMemo<IEmoji[]>(() => {
    const labels = new Map(
      (groups ?? []).flatMap((group) =>
        group.emojis.map((item) => [item.emoji, item.label] as const)
      )
    );

    return (recentEmojis ?? []).map((emoji) => ({
      emoji,
      label: labels.get(emoji) ?? emoji,
      keywords: [],
    }));
  }, [groups, recentEmojis]);

  const isSearching = !!query.trim();
  const isRecentShown = !isSearching && activeGroup === RECENT_GROUP;

  const visibleEmojis = useMemo(() => {
    if (!groups) return [];
    if (isSearching) return searchEmojis(groups, query);
    if (activeGroup === RECENT_GROUP) return recentGroup;

    return groups.find((group) => group.key === activeGroup)?.emojis ?? [];
  }, [groups, isSearching, query, activeGroup, recentGroup]);

  const title = isSearching
    ? "Search results"
    : isRecentShown
      ? "Recently used"
      : (EMOJI_GROUPS.find((group) => group.key === activeGroup)?.label ??
        "Emoji");

  const select = (emoji: string) => {
    addRecentEmoji(emoji);
    onSelect(emoji);
  };

  if (!connector) return null;

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Emoji picker"
      className={styles.picker}
      style={coords ? coords : { visibility: "hidden" }}
    >
      <Input
        autoFocus
        type="search"
        placeholder="Search emoji"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {!isSearching && (
        <div
          className={styles.picker__groups}
          role="group"
          aria-label="Emoji categories"
        >
          {!!recentGroup.length && (
            <button
              type="button"
              title="Recently used"
              aria-label="Recently used"
              aria-pressed={isRecentShown}
              className={classNames(styles.picker__group, {
                [styles.picker__group_active]: isRecentShown,
              })}
              onClick={() => setActiveGroup(RECENT_GROUP)}
            >
              🕘
            </button>
          )}
          {EMOJI_GROUPS.map((group) => (
            <button
              key={group.key}
              type="button"
              title={group.label}
              aria-label={group.label}
              aria-pressed={activeGroup === group.key}
              className={classNames(styles.picker__group, {
                [styles.picker__group_active]: activeGroup === group.key,
              })}
              onClick={() => setActiveGroup(group.key)}
            >
              {group.icon}
            </button>
          ))}
        </div>
      )}

      <p className={styles.picker__title}>{title}</p>

      <Scrollbar
        key={isSearching ? "search" : activeGroup}
        type="absolute"
        fadeType="both"
        classNameContent={styles.picker__scroll}
        contentStyle={{ maxHeight: "var(--emoji-picker-grid-height)" }}
      >
        {!groups ? (
          <div className={styles.picker__state}>
            {isFailed ? (
              "Emoji could not be loaded. Close the picker and try again."
            ) : (
              <Loader type="pulse" />
            )}
          </div>
        ) : !visibleEmojis.length ? (
          <div className={styles.picker__state}>
            {isSearching ? "No emoji match this search." : "Nothing here yet."}
          </div>
        ) : (
          <div className={styles.picker__grid}>
            {visibleEmojis.map((item) => (
              <button
                key={item.emoji}
                type="button"
                title={item.label}
                aria-label={item.label}
                className={styles.picker__emoji}
                onClick={() => select(item.emoji)}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        )}
      </Scrollbar>
    </div>,
    connector
  );
};
