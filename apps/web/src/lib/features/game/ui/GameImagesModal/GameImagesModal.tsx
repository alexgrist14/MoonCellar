"use client";

import { FC, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IGameResponse } from "@mooncellar/schemas";
import { useUpdateGameMutation } from "@/src/lib/entities/game/api/game.mutations";
import { revalidateGamePage } from "@/src/lib/entities/game/api/game.actions";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { modal } from "@/src/lib/shared/ui/Modal";
import {
  IImagePickerOption,
  ImagePickerField,
} from "@/src/lib/shared/ui/Fields";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./GameImagesModal.module.scss";

export const GAME_IMAGES_MODAL_ID = "game-images";

export const GameImagesModal: FC<{ game: IGameResponse }> = ({ game }) => {
  const router = useRouter();
  const { mutate, isPending } = useUpdateGameMutation();
  const [backgroundImage, setBackgroundImage] = useState(
    game.backgroundImage ?? null
  );
  const [bannerImage, setBannerImage] = useState(game.bannerImage ?? null);

  const options = useMemo<IImagePickerOption[]>(
    () => [
      ...(game.artworks ?? []).map((url, index) => ({
        url,
        caption: `Artwork ${index + 1}`,
      })),
      ...(game.screenshots ?? []).map((url, index) => ({
        url,
        caption: `Screenshot ${index + 1}`,
      })),
    ],
    [game.artworks, game.screenshots]
  );

  const close = () => modal.close(GAME_IMAGES_MODAL_ID);

  const handleSave = () =>
    mutate(
      { gameId: game._id, patch: { backgroundImage, bannerImage } },
      {
        onSuccess: async () => {
          toast.success({ title: "Images saved", description: game.name });
          close();
          await revalidateGamePage(game.slug);
          router.refresh();
        },
      }
    );

  return (
    <Box
      title="Background and banner"
      isTitleStart
      onClose={close}
      isWithScrollBar
      wrapperStyle={{ width: "var(--game-images-modal-width)" }}
      contentStyle={{ padding: "var(--padding-x5)" }}
    >
      <div className={styles.modal}>
        <ImagePickerField
          label="Hero banner"
          value={bannerImage}
          options={options}
          autoCaption="First artwork, or the first screenshot"
          disabled={isPending}
          onChange={setBannerImage}
        />
        <ImagePickerField
          label="Page background"
          value={backgroundImage}
          options={options}
          autoCaption="Random artwork, or a screenshot when there are none"
          disabled={isPending}
          onChange={setBackgroundImage}
        />
        <div className={styles.modal__actions}>
          <Button color={ButtonColor.DEFAULT} disabled={isPending} onClick={close}>
            Cancel
          </Button>
          <Button
            color={ButtonColor.ACCENT}
            disabled={isPending}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </Box>
  );
};
