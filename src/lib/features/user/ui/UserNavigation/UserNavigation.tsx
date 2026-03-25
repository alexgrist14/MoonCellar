import { FC } from "react";
import styles from "./UserNavigation.module.scss";
import { WrapperTemplate } from "@/src/lib/shared/ui/WrapperTemplate";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { modal } from "@/src/lib/shared/ui/Modal";
import { CustomFolder } from "@/src/lib/shared/ui/CustomFolderModal";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { userListCategories } from "@/src/lib/shared/constants/user.const";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import classNames from "classnames";
import { SvgPen, SvgSettings } from "@/src/lib/shared/ui/svg";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { IPlaythrough } from "@/src/lib/shared/lib/schemas/playthroughs.schema";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";

export const UserNavigation: FC<{
  isAuthedUser: boolean;
  user: IUser;
  playthroughs: IPlaythrough[];
}> = ({ isAuthedUser, user, playthroughs }) => {
  const { setQuery, query } = useAdvancedRouter();

  const { setExpanded } = useExpandStore();
  const { isMobile } = useStatesStore();

  const handleEditListClick = () => {
    modal.open(<CustomFolder />);
  };

  return (
    <div className={styles.panel}>
      <WrapperTemplate isWithBlur={!isMobile}>
        <Button
          className={styles.btn}
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
      </WrapperTemplate>
      <WrapperTemplate isWithBlur={!isMobile}>
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
        )}
      </WrapperTemplate>
      {isAuthedUser && (
        <WrapperTemplate isWithBlur={!isMobile}>
          <Button
            className={styles.btn}
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
        </WrapperTemplate>
      )}
    </div>
  );
};
