import {
  IRoyalGamesPosition,
  IRoyalGamesResponse,
  ROYAL_GAMES_LIMIT,
  RoyalSocketEvent,
} from "@mooncellar/schemas";
import {
  getRoyalSocket,
  IRoyalSocket,
} from "@/src/lib/shared/socket/royal.socket";
import { useRoyalStore } from "@/src/lib/shared/store/royal.store";
import { toast } from "@/src/lib/shared/utils/toast.utils";

const ACK_TIMEOUT = 10000;

const applyResponse = (response: IRoyalGamesResponse) => {
  if (!response.ok) throw new Error(response.error);

  useRoyalStore.getState().setAccountRoyalGames(response.royalGames);

  if (response.rejected.length) {
    toast.error({
      title: "Royal games",
      description: `${response.rejected.length} of the games could not be added. The list holds up to ${ROYAL_GAMES_LIMIT} games.`,
    });
  }

  return response;
};

export const syncRoyalGames = () =>
  getRoyalSocket()
    .then((socket) =>
      socket.timeout(ACK_TIMEOUT).emitWithAck(RoyalSocketEvent.SYNC, {})
    )
    .then(applyResponse)
    .catch(() => undefined);

const updateRoyalGames = (
  request: (socket: IRoyalSocket) => Promise<IRoyalGamesResponse>,
  preview: (royalGames: string[]) => string[]
) => {
  const { accountRoyalGames, setAccountRoyalGames } = useRoyalStore.getState();

  setAccountRoyalGames(preview(accountRoyalGames ?? []));

  return getRoyalSocket()
    .then(request)
    .then(applyResponse)
    .catch(() => {
      toast.error({
        title: "Royal games",
        description: "The change could not be saved, the list was reloaded.",
      });
      syncRoyalGames();

      return undefined;
    });
};

export const addAccountRoyalGames = (
  gameIds: string[],
  position: IRoyalGamesPosition
) =>
  updateRoyalGames(
    (socket) =>
      socket
        .timeout(ACK_TIMEOUT)
        .emitWithAck(RoyalSocketEvent.ADD, { gameIds, position }),
    (royalGames) => {
      const freshGames = [...new Set(gameIds)].filter(
        (gameId) => !royalGames.includes(gameId)
      );

      return position === "start"
        ? [...freshGames, ...royalGames]
        : [...royalGames, ...freshGames];
    }
  );

export const removeAccountRoyalGames = (gameIds: string[]) =>
  updateRoyalGames(
    (socket) =>
      socket
        .timeout(ACK_TIMEOUT)
        .emitWithAck(RoyalSocketEvent.REMOVE, { gameIds }),
    (royalGames) => royalGames.filter((gameId) => !gameIds.includes(gameId))
  );

export const replaceAccountRoyalGames = (gameIds: string[]) =>
  updateRoyalGames(
    (socket) =>
      socket
        .timeout(ACK_TIMEOUT)
        .emitWithAck(RoyalSocketEvent.SET, { gameIds }),
    () => [...new Set(gameIds)]
  );
