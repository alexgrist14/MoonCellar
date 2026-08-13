import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { AuthModal } from "@/src/lib/shared/ui/AuthModal";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { Box } from "@/src/lib/shared/ui/Box";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SearchModal } from "@/src/lib/shared/ui/SearchModal";
import { Separator } from "@/src/lib/shared/ui/Separator";
import {
  SvgAdmin,
  SvgSearch,
  SvgGames,
  SvgGauntlet,
  SvgRandom,
  SvgBurger,
} from "@/src/lib/shared/ui/svg";
import Link from "next/link";
import { FC, MouseEvent, useCallback, useMemo, useRef, useState } from "react";
import styles from "./Header.module.scss";
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";
import { IButtonGroupItem } from "@/src/lib/shared/types/buttons.type";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { gamesApi } from "@/src/lib/shared/api";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import useCloseEvents from "@/src/lib/shared/hooks/useCloseEvents";
import classNames from "classnames";
import { CustomDropdown } from "@/src/lib/shared/ui/CustomDropdown";

export const Header: FC = () => {
  const { isMobile } = useStatesStore();

  const { isAuth, isAdmin, profile } = useAuthStore();

  const { router } = useAdvancedRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useCloseEvents([menuRef], () => setIsMenuOpen(false));

  const handleProfileClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isAuth || !profile) {
      e.preventDefault();
      modal.open(<AuthModal />);
    }
  };

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const searchClickHandler = useCallback(() => {
    closeMenu();
    modal.open(<SearchModal />, { id: "search-games" });
  }, [closeMenu]);

  const randomClickHandler = useCallback(async () => {
    closeMenu();
    const res = await gamesApi.getRandomSlug();

    router.push(`/games/${res.data.slug}`);
  }, [router, closeMenu]);

  const buttons = useMemo(
    () =>
      [
        {
          title: (
            <>
              <SvgGames className={styles.svg} />
              <span>Games</span>
            </>
          ),
          link: "/games",
          color: ButtonColor.TRANSPARENT,
          onClick: closeMenu,
        },
        {
          title: (
            <>
              <SvgGauntlet className={styles.svg} />
              <span>Gauntlet</span>
            </>
          ),
          link: "/gauntlet",
          color: ButtonColor.TRANSPARENT,
          onClick: closeMenu,
        },
        {
          title: (
            <>
              <SvgRandom className={styles.svg} />
              <span>Random</span>
            </>
          ),
          onClick: randomClickHandler,
          color: ButtonColor.TRANSPARENT,
        },
        isAdmin && {
          title: (
            <>
              <SvgAdmin className={styles.svg} />
              <span>Admin</span>
            </>
          ),
          link: "/admin",
          color: ButtonColor.TRANSPARENT,
          onClick: closeMenu,
        },
        {
          title: (
            <>
              <SvgSearch className={styles.svg} />
              <span>Search</span>
            </>
          ),
          onClick: searchClickHandler,
          color: ButtonColor.TRANSPARENT,
        },
      ].filter(Boolean) as IButtonGroupItem[],
    [isAdmin, randomClickHandler, searchClickHandler, closeMenu]
  );

  return (
    <div className={styles.container}>
      <div className={styles.container__left}>
        <Link href="/" className={styles.title}>
          MoonCellar
        </Link>
        <Separator />
        {isMobile ? (
          <div className={styles.burger} ref={menuRef}>
            <Button
              className={styles.burger__toggle}
              color={ButtonColor.TRANSPARENT}
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <SvgBurger
                size="24"
                className={styles.svg}
                topId={classNames(styles.burgerTop, {
                  [styles.burgerTop_active]: isMenuOpen,
                })}
                middleId={classNames(styles.burgerMiddle, {
                  [styles.burgerMiddle_active]: isMenuOpen,
                })}
                bottomId={classNames(styles.burgerBottom, {
                  [styles.burgerBottom_active]: isMenuOpen,
                })}
              />
            </Button>
            {isMenuOpen && (
              <div className={styles.burger__dropdown}>
                <Box isWithBlur classNameContent={styles.burger__content}>
                  <ButtonGroup
                    wrapperClassName={styles.burger__buttons}
                    buttons={buttons}
                  />
                </Box>
              </div>
            )}
          </div>
        ) : (
          <ButtonGroup
            wrapperClassName={styles.container__buttons}
            buttons={buttons}
          />
        )}
      </div>
      <div className={styles.container__right}>
        <Link
          href={`/user/${profile?.userName}`}
          onClick={handleProfileClick}
          className={styles.profile__link}
        >
          <Avatar user={profile} isWithoutTooltip priority />
        </Link>
      </div>
    </div>
  );
};
