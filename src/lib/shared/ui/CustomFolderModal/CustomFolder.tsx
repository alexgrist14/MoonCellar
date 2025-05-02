import React, { useState } from "react";
import styles from "./CustomFolderModal.module.scss";
import { SvgPlus } from "../svg";
import { Button } from "../Button";
import Image from "next/image";

type Props = {};

export const CustomFolder = (props: Props) => {
  const [img, setImg] = useState(false);
  return (
    <div className={styles.container}>
      <h2>Edit lists</h2>
      {img && <div className={styles.img}></div>}
      <Button color="transparent" onClick={() => setImg(true)}>
        <p> Create new folder </p>
        <SvgPlus />
      </Button>
    </div>
  );
};
