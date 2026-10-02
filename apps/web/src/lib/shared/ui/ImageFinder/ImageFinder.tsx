import { FC, useState } from "react";
import Image from "next/image";
import cn from "classnames";
import { Button, ButtonColor } from "../Button";
import { Input } from "../Input";
import styles from "./ImageFinder.module.scss";

const IMAGE_FINDER_MAX_PAGE = 10;

interface IImageFinderProps {
  label: string;
  defaultQuery: string;
  onSearch: (query: string, page: number) => Promise<string[]>;
  selected: string[];
  onChange: (selected: string[]) => void;
  isMultiple?: boolean;
  isPortrait?: boolean;
  isDisabled?: boolean;
  emptyText?: string;
}

export const ImageFinder: FC<IImageFinderProps> = ({
  label,
  defaultQuery,
  onSearch,
  selected,
  onChange,
  isMultiple,
  isPortrait,
  isDisabled,
  emptyText = "Nothing found.",
}) => {
  const [results, setResults] = useState<{
    query: string;
    pages: string[][];
    index: number;
    isLast: boolean;
  }>();
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [editedQuery, setEditedQuery] = useState<string>();
  const query = (editedQuery ?? defaultQuery).trim();
  const candidates = results?.pages[results.index];
  const hasNext =
    !!results && (results.index < results.pages.length - 1 || !results.isLast);

  const search = async () => {
    if (!query) return;

    setIsSearching(true);

    try {
      const urls = await onSearch(query, 1);

      setResults({ query, pages: [urls], index: 0, isLast: !urls.length });
    } catch {
      setResults(undefined);
    } finally {
      setIsSearching(false);
    }
  };

  const showNext = async () => {
    if (!results) return;

    if (results.index < results.pages.length - 1) {
      setResults({ ...results, index: results.index + 1 });
      return;
    }

    const page = results.pages.length + 1;

    setIsLoadingMore(true);

    try {
      const shown = results.pages.flat();
      const fresh = (await onSearch(results.query, page)).filter(
        (url) => !shown.includes(url)
      );

      setResults(
        fresh.length
          ? {
              ...results,
              pages: [...results.pages, fresh],
              index: results.pages.length,
              isLast: page >= IMAGE_FINDER_MAX_PAGE,
            }
          : { ...results, isLast: true }
      );
    } catch {
      setResults({ ...results, isLast: true });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const showPrevious = () =>
    results &&
    results.index > 0 &&
    setResults({ ...results, index: results.index - 1 });

  const dropBroken = (url: string) => {
    setResults(
      (current) =>
        current && {
          ...current,
          pages: current.pages.map((page) =>
            page.filter((item) => item !== url)
          ),
        }
    );

    if (selected.includes(url)) {
      onChange(selected.filter((item) => item !== url));
    }
  };

  const toggle = (url: string) => {
    const isSelected = selected.includes(url);

    if (!isMultiple) {
      onChange(isSelected ? [] : [url]);
      return;
    }

    onChange(
      isSelected ? selected.filter((item) => item !== url) : [...selected, url]
    );
  };

  return (
    <div className={styles.finder}>
      <div className={styles.finder__head}>
        <div className={styles.finder__query}>
          <Input
            value={editedQuery ?? defaultQuery}
            placeholder="Search query or page link"
            disabled={isDisabled}
            onChange={(event) => setEditedQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              search();
            }}
          />
        </div>
        <Button
          type="button"
          color={ButtonColor.DEFAULT}
          disabled={isDisabled || isSearching || !query}
          onClick={search}
        >
          {isSearching ? "Searching…" : label}
        </Button>
        {!!selected.length && (
          <span className={styles.finder__note}>
            {selected.length === 1
              ? "1 picture selected"
              : `${selected.length} pictures selected`}
            , applied on save
          </span>
        )}
      </div>
      {candidates &&
        (candidates.length ? (
          <div
            className={cn(styles.grid, {
              [styles.grid_portrait]: isPortrait,
            })}
          >
            {candidates.map((url) => (
              <button
                key={url}
                type="button"
                className={styles.item}
                aria-pressed={selected.includes(url)}
                aria-label={selected.includes(url) ? "Unselect" : "Select"}
                onClick={() => toggle(url)}
              >
                <Image
                  src={url}
                  alt=""
                  width={320}
                  height={180}
                  unoptimized
                  referrerPolicy="no-referrer"
                  onError={() => dropBroken(url)}
                />
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.finder__note}>{emptyText}</p>
        ))}
      {!!results && (results.index > 0 || hasNext) && (
        <div className={styles.finder__pages}>
          {results.index > 0 && (
            <Button
              type="button"
              disabled={isDisabled || isLoadingMore || isSearching}
              onClick={showPrevious}
            >
              Show previous
            </Button>
          )}
          {hasNext && (
            <Button
              type="button"
              disabled={isDisabled || isLoadingMore || isSearching}
              onClick={showNext}
            >
              {isLoadingMore ? "Loading…" : "Show more"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
