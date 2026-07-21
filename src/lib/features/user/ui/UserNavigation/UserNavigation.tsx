import { FC, useRef, useState } from "react";
import styles from "./UserNavigation.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { modal } from "@/src/lib/shared/ui/Modal";
import { CustomFolder } from "@/src/lib/shared/ui/CustomFolderModal";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { userListCategories } from "@/src/lib/shared/constants/user.const";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import classNames from "classnames";
import { SvgPen, SvgSettings, SvgSort } from "@/src/lib/shared/ui/svg";
import { Separator } from "@/src/lib/shared/ui/Separator";
import { IPlaythrough } from "@/src/lib/shared/lib/schemas/playthroughs.schema";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";
import { SortType } from "@/src/lib/shared/types/sort.type";
import { CustomDropdown } from "@/src/lib/shared/ui/CustomDropdown";
import useCloseEvents from "@/src/lib/shared/hooks/useCloseEvents";

const sortOptions = [
  { label: SortType.DATE_ADDED },
  { label: SortType.RATING },
];
const sortOrderOptions = [{ label: "asc" }, { label: "desc" }];

export const UserNavigation: FC<{
  isAuthedUser: boolean;
  user: IUser;
  playthroughs: IPlaythrough[];
  selectedSort: SortType;
  sortOrder: string;
  onSortChange: (value: SortType) => void;
  onSortOrderChange: (value: string) => void;
}> = ({
  isAuthedUser,
  user,
  playthroughs,
  selectedSort,
  sortOrder,
  onSortChange,
  onSortOrderChange,
}) => {
  const { setQuery, query } = useAdvancedRouter();

  const { setExpanded } = useExpandStore();

  const sortRef = useRef<HTMLDivElement>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useCloseEvents([sortRef], () => setIsSortOpen(false));

  const isGamesTab = userListCategories.some(
    (category) => category === query.get("list")
  );

  const handleEditListClick = () => {
    modal.open(<CustomFolder />);
  };

  return (
    <div className={styles.panel}>
      <Box>
        <Button
          className={classNames(styles.btn, styles.tall)}
          color={ButtonColor.TRANSPARENT}
          onClick={() => {
            setExpanded([]);
            setQuery({ list: "profile" });
          }}
        >
          <div>
            <div className={styles.avatar}>
              <Avatar user={user} isWithoutTooltip={true} />
            </div>
            <span>Profile</span>
          </div>
        </Button>
      </Box>
      <Box>
        {userListCategories.map((category, i) => {
          const plays = playthroughs?.reduce((res: IPlaythrough[], play) => {
            if (
              ((play.category === category && !play.isMastered) ||
                (category === "mastered" && play.isMastered)) &&
              !res.some((p) => p.gameId === play.gameId)
            ) {
              res.push(play);
            }
            return res;
          }, []);

          return (
            <Button
              key={category + i}
              className={styles.btn}
              active={query.get("list") === category}
              color={ButtonColor.TRANSPARENT}
              onClick={() => {
                setExpanded([]);
                setQuery({ list: category.toLowerCase(), page: 1 });
              }}
            >
              <span>{commonUtils.upFL(category)}</span>
              <span>{plays.length}</span>
            </Button>
          );
        })}
        {isAuthedUser && (
          <>
            <Separator direction="horizontal" />
            <Button
              color={ButtonColor.TRANSPARENT}
              className={classNames(styles.btn, styles.last)}
              onClick={handleEditListClick}
            >
              <div className={styles.edit}>
                <span>Edit</span>
                <SvgPen />
              </div>
            </Button>
          </>
        )}
      </Box>
      {isAuthedUser && (
        <Box>
          <Button
            className={classNames(styles.btn, styles.tall)}
            active={query.get("list") === "settings"}
            color={ButtonColor.TRANSPARENT}
            onClick={() => {
              setExpanded([]);
              setQuery({ list: "settings" });
            }}
          >
            <div>
              <SvgSettings />
              <span>Settings</span>
            </div>
          </Button>
        </Box>
      )}
      {isGamesTab && (
        <Box>
          <div className={styles.sort} ref={sortRef}>
            <CustomDropdown
              isOpen={isSortOpen}
              setIsOpen={setIsSortOpen}
              onSelect={onSortChange}
              onExtendedSelect={onSortOrderChange}
              extendedSelected={sortOrder}
              options={sortOptions}
              selected={selectedSort}
              extendedOptions={sortOrderOptions}
              headerClassName={styles.sort__header}
              className={styles.sort__dropdown}
              icon={
                <SvgSort
                  size="24"
                  style={{ color: "var(--color-neutral-80)" }}
                  className={classNames(styles.sort__icon, {
                    [styles.sort__icon_active]: sortOrder === "asc",
                  })}
                />
              }
            />
          </div>
        </Box>
      )}
    </div>
  );
};
