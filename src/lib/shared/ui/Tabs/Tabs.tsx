import { FC, useEffect, useState } from "react";
import { Button } from "../Button";
import cl from "classnames";
import styles from "./Tabs.module.scss";
import Link from "next/link";
import { ITabContent } from "../../types/tabs";

interface ITabs {
  contents: ITabContent[];
  defaultTabIndex?: number;
  wrapperClassName?: string;
  buttonsClassName?: string;
  tabBodyClassName?: string;
  isUseDefaultIndex?: boolean;
  isStopPropagation?: boolean;
  resetCallback?: () => void;
  isAdaptive?: boolean;
}
export const Tabs: FC<ITabs> = ({
  contents,
  defaultTabIndex = 0,
  buttonsClassName,
  tabBodyClassName,
  wrapperClassName,
  isUseDefaultIndex,
  isStopPropagation,
  resetCallback,
  isAdaptive,
}) => {
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
    <div className={cl(styles.tabs, wrapperClassName)}>
      <div
        className={cl(styles.tabs__buttons, buttonsClassName, {
          [styles.tabs__buttons_adaptive]: isAdaptive,
        })}
      >
        {contents?.map((content, i) => {
          return !!content.tabLink ? (
            <Link
              key={i}
              href={content.tabLink}
              className={cl(styles.tabs__link, content.className)}
            >
              <Button
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
              </Button>
            </Link>
          ) : (
            <Button
              className={cl(styles.tabs__button, content.className, {
                [styles.tabs__button_adaptive]: isAdaptive,
              })}
              key={i}
              style={content.style}
              active={!content.isUnselectable && i === tabIndex}
              onClick={() => {
                !!resetCallback && resetCallback();
                content.onTabClick && content.onTabClick(content.tabName);
                !isStopPropagation && setTabIndex(i);
              }}
            >
              {content.tabName}
            </Button>
          );
        })}
      </div>
      {!!contents?.length && !!contents[tabIndex]?.tabBody && (
        <div className={cl(styles.tabs__body, tabBodyClassName)}>
          {contents[tabIndex].tabBody}
        </div>
      )}
    </div>
  );
};
