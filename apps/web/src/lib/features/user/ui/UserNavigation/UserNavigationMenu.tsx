import { ComponentProps, FC } from "react";
import styles from "./UserNavigation.module.scss";
import { UserNavigation } from "./UserNavigation";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import { SvgBurger } from "@/src/lib/shared/ui/svg";
import { useStatesStore } from "@/src/lib/shared/store/states.store";

export const UserNavigationMenu: FC<ComponentProps<typeof UserNavigation>> = (
  props
) => {
  const { isMobile } = useStatesStore();

  if (!isMobile) return null;

  return (
    <ExpandMenu
      position="bottom-right"
      titleClose={
        <span className={styles.menuTitle}>
          <SvgBurger size="32" isOpen />
        </span>
      }
      titleOpen={
        <span className={styles.menuTitle}>
          <SvgBurger size="32" />
        </span>
      }
      titleStyle={{ width: "fit-content" }}
    >
      <UserNavigation {...props} />
    </ExpandMenu>
  );
};
