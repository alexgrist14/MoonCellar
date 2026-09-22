import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import classNames from "classnames";
import { ICustomList } from "@mooncellar/schemas";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { Highlight } from "../Highlight";
import { SvgHeartFilled, SvgLock } from "../svg";
import styles from "./ListCard.module.scss";

interface IListCardProps {
  list: ICustomList;
  layout?: "tile" | "row";
  query?: string;
  isWithAuthor?: boolean;
  isWithDate?: boolean;
  className?: string;
  onClick?: () => void;
}

export const getListHref = (list: Pick<ICustomList, "slug" | "author">) =>
  `/user/${list.author?.userName ?? ""}/lists/${list.slug}`;

const MOSAIC_SIZE = 4;

export const ListMosaic: FC<{
  covers: string[];
  className?: string;
  sizes?: string;
}> = ({ covers, className, sizes = "120px" }) => (
  <span className={classNames(styles.mosaic, className)} aria-hidden="true">
    {Array.from({ length: MOSAIC_SIZE }, (_, i) =>
      covers[i] ? (
        <span key={i} className={styles.mosaic__cell}>
          <Image
            src={covers[i]}
            alt=""
            fill
            sizes={sizes}
            className={styles.mosaic__image}
          />
        </span>
      ) : (
        <span
          key={i}
          className={classNames(styles.mosaic__cell, styles.mosaic__cell_empty)}
        />
      )
    )}
  </span>
);

export const ListCard: FC<IListCardProps> = ({
  list,
  layout = "tile",
  query,
  isWithAuthor = true,
  isWithDate = true,
  className,
  onClick,
}) => {
  const isDescriptionMatch =
    !!query?.trim() &&
    !list.name.toLowerCase().includes(query.trim().toLowerCase()) &&
    list.description.toLowerCase().includes(query.trim().toLowerCase());

  const meta = [
    `${list.gamesCount} ${commonUtils.addLastS("game", list.gamesCount)}`,
    isWithDate ? commonUtils.getHumanDate(list.updatedAt) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  if (layout === "row") {
    return (
      <Link
        href={getListHref(list)}
        className={classNames(styles.row, className)}
        onClick={onClick}
      >
        <ListMosaic
          covers={list.covers}
          className={styles.row__mosaic}
          sizes="44px"
        />
        <span className={styles.row__body}>
          <span className={styles.name}>
            <Highlight text={list.name} query={query} />
            {list.isPrivate && (
              <SvgLock size="12" className={styles.lock} aria-label="Private" />
            )}
          </span>
          {isWithAuthor && !!list.author && (
            <span className={styles.author}>{list.author.userName}</span>
          )}
          <span className={styles.meta}>
            {isDescriptionMatch ? (
              <span className={styles.description}>
                <Highlight text={list.description} query={query} />
              </span>
            ) : (
              <>
                {meta}
                {list.likesCount > 0 && " · "}
                {list.likesCount > 0 && (
                  <span
                    className={styles.likes}
                    aria-label={`${list.likesCount} likes`}
                  >
                    <span className={styles.likes__icon}>
                      <SvgHeartFilled size="12" style={{ color: "inherit" }} />
                    </span>
                    {list.likesCount}
                  </span>
                )}
              </>
            )}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={getListHref(list)}
      className={classNames(styles.tile, className)}
      onClick={onClick}
    >
      <span className={styles.tile__art}>
        <ListMosaic
          covers={list.covers}
          sizes="(max-width: 500px) 45vw, 220px"
        />
        <span className={styles.tile__count}>{list.gamesCount}</span>
      </span>
      <span className={styles.name}>
        <Highlight text={list.name} query={query} />
        {list.isPrivate && (
          <SvgLock size="12" className={styles.lock} aria-label="Private" />
        )}
      </span>
      {(isWithAuthor && !!list.author) || list.likesCount > 0 ? (
        <span className={styles.author}>
          {isWithAuthor && !!list.author && (
            <>
              {list.author.userName}
              {isWithDate && ` · ${commonUtils.getHumanDate(list.updatedAt)}`}
            </>
          )}
          {isWithAuthor && !!list.author && list.likesCount > 0 && " · "}
          {list.likesCount > 0 && (
            <span
              className={styles.likes}
              aria-label={`${list.likesCount} likes`}
            >
              <span className={styles.likes__icon}>
                <SvgHeartFilled size="12" style={{ color: "inherit" }} />
              </span>
              {list.likesCount}
            </span>
          )}
        </span>
      ) : null}
      {isDescriptionMatch && (
        <span className={styles.description}>
          <Highlight text={list.description} query={query} />
        </span>
      )}
    </Link>
  );
};
