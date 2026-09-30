import { FC, useState } from "react";
import Image from "next/image";
import cn from "classnames";
import { Button, ButtonColor } from "../Button";
import { Input } from "../Input";
import styles from "./ImageFinder.module.scss";

interface IImageFinderProps {
  label: string;
  defaultQuery: string;
  onSearch: (query: string) => Promise<string[]>;
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
  const [candidates, setCandidates] = useState<string[]>();
  const [isSearching, setIsSearching] = useState(false);
  const [editedQuery, setEditedQuery] = useState<string>();
  const query = (editedQuery ?? defaultQuery).trim();

  const search = async () => {
    if (!query) return;

    setIsSearching(true);

    try {
      setCandidates(await onSearch(query));
    } catch {
      setCandidates(undefined);
    } finally {
      setIsSearching(false);
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
                <Image src={url} alt="" width={320} height={180} unoptimized />
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.finder__note}>{emptyText}</p>
        ))}
    </div>
  );
};
