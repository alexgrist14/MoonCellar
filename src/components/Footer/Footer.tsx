import { FC } from "react";
import styles from "./Footer.module.scss";
import githubIcon from "../../assets/github-logo.png";
import alexgrist from "../../assets/alexgrist.png";
import clown from "../../assets/clown.png";

const Footer:FC = ()=>{
    return(
        <div className={styles.footer}>
            <div className={styles.developers}>
                <h4>Developers:</h4>
                <a className={styles.link} href="https://github.com/alexgrist14" target="_blank" rel="noreferrer"><img className={styles.img} src={alexgrist} alt="avatar"/></a>
                <a className={styles.link} href="https://github.com/sergeyhist" target="_blank" rel="noreferrer"><img className={styles.img} src={clown} alt="avatar"/></a>
            </div>
            <a className={styles.rep} target="_blank" href="https://github.com/alexgrist14/RetroAchievements-Gauntlet" rel="noreferrer"><img className={styles.logo} src={githubIcon} alt="icon"/></a>
        </div>
    )
}

export default Footer;