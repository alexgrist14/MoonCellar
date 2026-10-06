import { FC, ReactNode, useEffect, useState } from "react";
import { Button, ButtonColor, IButtonProps } from "../Button";
import cl from "classnames";
import styles from "./Tabs.module.scss";
import Link from "next/link";
import { ITabContent } from "@/src/lib/shared/types/tabs.type";
import { TabCount, TabsMenu } from "../TabsMenu";

interface ITabs {
  contents: ITabContent[];
  defaultTabIndex?: number;
  buttonsClassName?: string;
  isUseDefaultIndex?: boolean;
  isStopPropagation?: boolean;
  buttonColor?: IButtonProps["color"];
  resetCallback?: () => void;
  isAdaptive?: boolean;
  theme?: "segmented";
  ariaLabel?: string;
  isHideTabsButtons?: boolean;
  mobileMenuTitle?: string;
  isWrap?: boolean;
  isFit?: boolean;
}
const TabGroup: FC<{ addon?: ReactNode; children: ReactNode }> = ({
  addon,
  children,
}) =>
  addon ? (
    <span className={styles.tabs__group}>
      {children}
      <span className={styles.tabs__addon}>{addon}</span>
    </span>
  ) : (
    children
  );

export const Tabs: FC<ITabs> = ({
  contents,
  defaultTabIndex = 0,
  buttonsClassName,
  isUseDefaultIndex,
  isStopPropagation,
  isHideTabsButtons,
  buttonColor,
  theme,
  ariaLabel,
  resetCallback,
  isAdaptive,
  mobileMenuTitle,
  isWrap,
  isFit,
}) => {
  const isSegmented = theme === "segmented";
  const color =
    buttonColor ?? (isSegmented ? ButtonColor.SEGMENTED : ButtonColor.FANCY);

  const [tabIndex, setTabIndex] = useState(
    defaultTabIndex > contents.length - 1
      ? contents.length - 1
      : defaultTabIndex
  );

  useEffect(() => {
    if (isUseDefaultIndex) {
      setTabIndex(defaultTabIndex);
    }
  }, [isUseDefaultIndex, defaultTabIndex]);

  const selectTab = (content: ITabContent, index: number) => {
    !!resetCallback && resetCallback();
    content.onTabClick && content.onTabClick(content.tabName);
    !isStopPropagation && setTabIndex(index);
  };

  const buttons = (
    <div
      className={cl(styles.tabs__buttons, buttonsClassName, {
        [styles.tabs__buttons_desktop]: !!mobileMenuTitle,
        [styles.tabs__buttons_adaptive]: isAdaptive,
        [styles.tabs__buttons_segmented]: isSegmented,
        [styles.tabs__buttons_wrap]: isWrap,
        [styles.tabs__buttons_fit]: isFit,
      })}
      role={isSegmented ? "group" : undefined}
      aria-label={ariaLabel}
    >
      {!isHideTabsButtons &&
        contents?.map((content, i) => {
          if (content.isHidden) return null;

          return !!content.tabLink ? (
            <Link
              key={i}
              href={content.tabLink}
              className={cl(styles.tabs__link, content.className)}
            >
              <Button
                type="button"
                color={color}
                style={content.style}
                className={cl(styles.tabs__button, {
                  [styles.tabs__button_adaptive]: isAdaptive,
                  [styles.tabs__button_muted]: content.isMuted,
                })}
                active={!content.isUnselectable && i === tabIndex}
                aria-pressed={isSegmented ? i === tabIndex : undefined}
                aria-label={content.ariaLabel}
                tooltip={content.tooltip}
                onClick={() => selectTab(content, i)}
              >
                {!!content.prefix && (
                  <span className={styles.tabs__prefix}>{content.prefix}</span>
                )}
                {content.tabName}
                <TabCount count={content.count} />
                {content?.tabNameNode}
              </Button>
            </Link>
          ) : (
            <TabGroup key={i} addon={content.addon}>
              <Button
                type="button"
                color={color}
                className={cl(styles.tabs__button, content.className, {
                  [styles.tabs__button_adaptive]: isAdaptive,
                  [styles.tabs__button_muted]: content.isMuted,
                })}
                style={content.style}
                active={!content.isUnselectable && i === tabIndex}
                aria-pressed={isSegmented ? i === tabIndex : undefined}
                aria-label={content.ariaLabel}
                tooltip={content.tooltip}
                onClick={() => selectTab(content, i)}
              >
                {!!content.prefix && (
                  <span className={styles.tabs__prefix}>{content.prefix}</span>
                )}
                {content.tabName}
                <TabCount count={content.count} />
                {content?.tabNameNode}
              </Button>
            </TabGroup>
          );
        })}
    </div>
  );

  if (!mobileMenuTitle) return buttons;

  return (
    <>
      {buttons}
      <TabsMenu
        className={styles.tabs__menu}
        title={mobileMenuTitle}
        activeIndex={tabIndex}
        tabs={contents.map((content, i) => ({
          tabName: content.tabName,
          prefix: content.prefix,
          count: content.count,
          ariaLabel: content.ariaLabel,
          isHidden: content.isHidden,
          onTabClick: () => selectTab(content, i),
        }))}
      />
    </>
  );
};
