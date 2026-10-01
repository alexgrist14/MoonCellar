import { FC, ReactNode } from "react";
import classNames from "classnames";
import styles from "./InfoBlock.module.scss";
import { Box } from "../Box";

interface IInfoBlockProps {
  title: ReactNode;
  children: ReactNode;
  isBoxed?: boolean;
  as?: "h2" | "h3" | "h4" | "h5";
  className?: string;
}

export const InfoBlock: FC<IInfoBlockProps> = ({
  title,
  children,
  isBoxed = true,
  as: Title = "h4",
  className,
}) => {
  const content = (
    <section className={classNames(styles.block, className)}>
      <Title className={styles.block__title}>{title}</Title>
      {children}
    </section>
  );

  if (!isBoxed) return content;

  return <Box contentStyle={{ padding: "var(--padding-x3)" }}>{content}</Box>;
};
