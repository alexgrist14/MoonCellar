import { FC } from "react";
import {
  usePortGamesQuery,
  usePortPlayerGamesQuery,
} from "@/src/lib/entities/port-achievement/api";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { UserPortGame } from "./UserPortGame";
import styles from "./UserPortAchievements.module.scss";

interface IUserPortAchievementsProps {
  userId: string;
}

// The player's progress in the MoonCellar Team ports (apps/game); hidden until they have some
export const UserPortAchievements: FC<IUserPortAchievementsProps> = ({
  userId,
}) => {
  const { data: games = [] } = usePortPlayerGamesQuery(userId);
  const { data: ports = [] } = usePortGamesQuery(!!games.length);

  if (!games.length) return null;

  return (
    <section className={styles.ports} aria-labelledby="profile-port-games">
      <SectionTitle as="h3" count={games.length}>
        <span id="profile-port-games">MoonCellar Team ports</span>
      </SectionTitle>
      <ul className={styles.ports__list}>
        {games.map((summary) => (
          <li key={summary.game}>
            <UserPortGame
              userId={userId}
              summary={summary}
              siteGame={
                ports.find((port) => port.slug === summary.game)?.siteGame
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
};
