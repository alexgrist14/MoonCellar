import { FC } from "react";
import styles from "./UserNavigation.module.scss";
import { WrapperTemplate } from "@/src/lib/shared/ui/WrapperTemplate";
import { Button } from "@/src/lib/shared/ui/Button";
import { modal } from "@/src/lib/shared/ui/Modal";
import { CustomFolder } from "@/src/lib/shared/ui/CustomFolderModal";
import { setQuery } from "@/src/lib/shared/utils/query";
import { useRouter } from "next/router";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { IUser } from "@/src/lib/shared/types/auth";
import { userListCategories } from "@/src/lib/shared/constants/user.const";
import { commonUtils } from "@/src/lib/shared/utils/common";
import { CategoriesType } from "@/src/lib/shared/types/user.type";
import classNames from "classnames";
import { SvgPen, SvgSettings } from "@/src/lib/shared/ui/svg";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";

export const UserNavigation: FC<{
  isAuthedUser: boolean;
  user: IUser;
  games: Record<CategoriesType, number[]>;
}> = ({ isAuthedUser, user, games }) => {
  const router = useRouter();
  const { setExpanded } = useCommonStore();
  const { isMobile } = useStatesStore();

  const handleEditListClick = () => {
    modal.open(<CustomFolder />);
  };

  return (
    <div className={styles.panel}>
      <WrapperTemplate isWithBlur={!isMobile}>
        <Button
          className={styles.btn}
          color="transparent"
          onClick={() => {
            setExpanded([]);
            setQuery({ list: "profile" }, router);
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
        {userListCategories.map((category, i) => (
          <Button
            key={category + i}
            className={styles.btn}
            active={router.query.list === category}
            color="transparent"
            onClick={() => {
              setExpanded([]);
              setQuery({ list: category.toLowerCase(), page: 1 }, router);
            }}
          >
            <span>{commonUtils.upFL(category)}</span>
            <span>{games[`${category}`].length}</span>
          </Button>
        ))}
        {isAuthedUser && (
          <Button
            color="transparent"
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
            active={router.query.list === "settings"}
            color="transparent"
            onClick={() => {
              setExpanded([]);
              setQuery({ list: "settings" }, router);
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
