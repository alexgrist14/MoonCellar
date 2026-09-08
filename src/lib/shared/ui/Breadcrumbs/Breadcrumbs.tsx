import { FC } from "react";
import Link from "next/link";
import classNames from "classnames";
import styles from "./Breadcrumbs.module.scss";
import { SvgChevron } from "../svg";

export interface IBreadcrumb {
  name: string;
  href: string;
}

interface IBreadcrumbsProps {
  items: IBreadcrumb[];
  className?: string;
}

export const Breadcrumbs: FC<IBreadcrumbsProps> = ({ items, className }) => (
  <nav className={classNames(styles.crumbs, className)} aria-label="Breadcrumb">
    {items.map(({ name, href }, index) => (
      <span key={href} className={styles.crumbs__item}>
        {index > 0 && <span className={styles.crumbs__separator}>›</span>}
        {index === items.length - 1 ? (
          <span className={styles.crumbs__current} aria-current="page">
            {name}
          </span>
        ) : (
          <Link href={href} className={styles.crumbs__link}>
            {index === items.length - 2 && (
              <SvgChevron
                size="16"
                className={styles.crumbs__back}
                style={{ transform: "rotate(90deg)" }}
              />
            )}
            {name}
          </Link>
        )}
      </span>
    ))}
  </nav>
);
