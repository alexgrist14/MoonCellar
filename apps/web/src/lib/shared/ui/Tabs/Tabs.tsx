import { FC, useEffect, useState } from "react";
import { Button, ButtonColor, IButtonProps } from "../Button";
import cl from "classnames";
import styles from "./Tabs.module.scss";
import Link from "next/link";
import { ITabContent } from "@/src/lib/shared/types/tabs.type";

interface ITabs {
  contents: ITabContent[];
  defaultTabIndex?: number;
  wrapperClassName?: string;
  buttonsClassName?: string;
  tabBodyClassName?: string;
  isUseDefaultIndex?: boolean;
  isStopPropagation?: boolean;
  buttonColor?: IButtonProps["color"];
  resetCallback?: () => void;
  isAdaptive?: boolean;
  theme?: "segmented";
  ariaLabel?: string;
  isHideTabsButtons?: boolean;
}
export const Tabs: FC<ITabs> = ({
  contents,
  defaultTabIndex = 0,
  buttonsClassName,
  tabBodyClassName,
  wrapperClassName,
  isUseDefaultIndex,
  isStopPropagation,
  isHideTabsButtons,
  buttonColor,
  theme,
  ariaLabel,
  resetCallback,
  isAdaptive,
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

  return (
    <div
      className={cl(styles.tabs__buttons, buttonsClassName, {
        [styles.tabs__buttons_adaptive]: isAdaptive,
        [styles.tabs__buttons_segmented]: isSegmented,
      })}
      role={isSegmented ? "group" : undefined}
      aria-label={ariaLabel}
    >
      {!isHideTabsButtons &&
        contents?.map((content, i) => {
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
                className={cl({
                  [styles.tabs__button_adaptive]: isAdaptive,
                })}
                active={!content.isUnselectable && i === tabIndex}
                onClick={() => {
                  !!resetCallback && resetCallback();
                  content.onTabClick && content.onTabClick(content.tabName);
                  !isStopPropagation && setTabIndex(i);
                }}
              >
                {content.tabName}
                {content?.tabNameNode}
              </Button>
            </Link>
          ) : (
            <Button
              type="button"
              color={color}
              className={cl(styles.tabs__button, content.className, {
                [styles.tabs__button_adaptive]: isAdaptive,
              })}
              key={i}
              style={content.style}
              active={!content.isUnselectable && i === tabIndex}
              aria-pressed={isSegmented ? i === tabIndex : undefined}
              onClick={() => {
                !!resetCallback && resetCallback();
                content.onTabClick && content.onTabClick(content.tabName);
                !isStopPropagation && setTabIndex(i);
              }}
            >
              {content.tabName}
              {content?.tabNameNode}
            </Button>
          );
        })}
    </div>
  );
};
