"use client";

import { FC, useMemo, useState } from "react";
import Image from "next/image";
import { ICharacterResponse, ISaveCharacterRequest } from "@mooncellar/schemas";
import {
  useDeleteCharacterMutation,
  useFindCharacterPortraitsMutation,
  useSaveCharacterMutation,
  useUploadCharacterImageMutation,
} from "@/src/lib/entities/character/api";
import { CharacterPortrait } from "@/src/lib/entities/character/ui/CharacterPortrait";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import { revalidateGamePage } from "@/src/lib/entities/game/api/game.actions";
import { useEntitySearch } from "@/src/lib/features/requests/model/useEntitySearch";
import { SelectedChips } from "@/src/lib/features/requests/ui/SelectedChips";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal/ConfirmModal";
import { modal } from "@/src/lib/shared/ui/Modal";
import {
  StringListField,
  TextField,
  TextareaField,
  UploadButton,
} from "@/src/lib/shared/ui/Fields";
import {
  ISearchPickerOption,
  SearchPicker,
} from "@/src/lib/shared/ui/SearchPicker";
import { ImageFinder } from "@/src/lib/shared/ui/ImageFinder";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./CharacterEditor.module.scss";

interface ICharacterEditorProps {
  character?: ICharacterResponse;
  draft?: ISaveCharacterRequest;
  onSaved: (character: ICharacterResponse) => void;
  onClose: () => void;
}

export const CharacterEditor: FC<ICharacterEditorProps> = ({
  character,
  draft,
  onSaved,
  onClose,
}) => {
  const initialGameIds = useMemo(
    () => character?.gameIds ?? draft?.gameIds ?? [],
    [character, draft]
  );
  const { data: initialGames = [] } = useGamesByIdsQuery(
    initialGameIds,
    undefined,
    initialGameIds.length > 0
  );

  const initial = character ?? draft;

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [akas, setAkas] = useState(initial?.akas ?? []);
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [species, setSpecies] = useState(initial?.species ?? "");
  const [countryName, setCountryName] = useState(initial?.countryName ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [mugShotUrl, setMugShotUrl] = useState(draft?.mugShotUrl ?? "");
  const previewUrl = /^https?:\/\//.test(mugShotUrl.trim())
    ? mugShotUrl.trim()
    : undefined;
  const [games, setGames] = useState<ISearchPickerOption[]>();

  const gameSearch = useEntitySearch("game");
  const [pickedPortrait, setPickedPortrait] = useState<string[]>([]);
  const { mutateAsync: findPortraits } = useFindCharacterPortraitsMutation();
  const { mutate: save, isPending: isSaving } = useSaveCharacterMutation();
  const { mutate: remove } = useDeleteCharacterMutation();
  const { mutate: upload, isPending: isUploading } =
    useUploadCharacterImageMutation();

  const linkedGames =
    games ??
    initialGames.map((game) => ({
      id: game._id,
      label: game.name,
      slug: game.slug,
    }));

  const affectedSlugs = () =>
    [
      ...initialGames.map((game) => game.slug),
      ...linkedGames.map((game) => game.slug),
    ].filter((value): value is string => !!value);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error({ description: "A name is required" });
      return;
    }

    save(
      {
        id: character?._id,
        body: {
          name: name.trim(),
          ...(slug.trim() && { slug: slug.trim() }),
          akas,
          gender: gender.trim() || null,
          species: species.trim() || null,
          countryName: countryName.trim() || null,
          description: description.trim() || null,
          gameIds: linkedGames.map((game) => game.id),
          ...((pickedPortrait[0] || mugShotUrl.trim()) && {
            mugShotUrl: pickedPortrait[0] || mugShotUrl.trim(),
          }),
        },
      },
      {
        onSuccess: async (saved) => {
          toast.success({ description: "Character saved" });
          setMugShotUrl("");
          setPickedPortrait([]);
          onSaved(saved);
          await revalidateGamePage(...affectedSlugs());
        },
      }
    );
  };

  const handleDelete = () => {
    if (!character) return;

    const modalId = `delete-character-${character._id}`;

    modal.open(
      <ConfirmModal
        title="Delete character"
        message={
          <>
            Delete <strong>{character.name}</strong>?
          </>
        }
        warning="Favourites that point to this character lose it."
        onConfirm={() =>
          new Promise<void>((resolve, reject) =>
            remove(character._id, {
              onSuccess: async () => {
                modal.close(modalId);
                toast.success({ description: "Character deleted" });
                onClose();
                await revalidateGamePage(...affectedSlugs());
                resolve();
              },
              onError: reject,
            })
          )
        }
        onCancel={() => modal.close(modalId)}
      />,
      { id: modalId }
    );
  };

  return (
    <section className={styles.editor} aria-label="Character editor">
      <div className={styles.editor__form}>
        <div className={styles.editor__head}>
          <h3>{character ? character.name : "New character"}</h3>
          <Button color={ButtonColor.TRANSPARENT} onClick={onClose}>
            Close
          </Button>
        </div>
        <div className={styles.editor__grid}>
          <TextField label="Name" value={name} onChange={setName} />
          <TextField
            label="Slug (generated when empty)"
            value={slug}
            onChange={setSlug}
          />
          <TextField label="Gender" value={gender} onChange={setGender} />
          <TextField label="Species" value={species} onChange={setSpecies} />
        </div>
        <TextField label="From" value={countryName} onChange={setCountryName} />
        <StringListField
          label="Also known as"
          value={akas}
          onChange={setAkas}
        />
        <SearchPicker
          label="Games"
          placeholder="Search a game to link"
          search={gameSearch.search}
          onSearch={gameSearch.setSearch}
          options={gameSearch.options.filter(
            (option) => !linkedGames.some((game) => game.id === option.id)
          )}
          isLoading={gameSearch.isLoading}
          onPick={(option) => {
            setGames([...linkedGames, option]);
            gameSearch.setSearch("");
          }}
        />
        <SelectedChips
          items={linkedGames}
          onRemove={(id) =>
            setGames(linkedGames.filter((game) => game.id !== id))
          }
        />
        <TextareaField
          label="Description"
          value={description}
          onChange={setDescription}
        />
        <div className={styles.editor__actions}>
          {!!character && (
            <Button color={ButtonColor.RED} onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button
            color={ButtonColor.GREEN}
            disabled={isSaving}
            onClick={handleSave}
          >
            {character ? "Save" : "Create"}
          </Button>
        </div>
      </div>
      <div className={styles.editor__portrait}>
        <h4>Portrait</h4>
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={name || "Portrait"}
            width={160}
            height={213}
            unoptimized
            className={styles.editor__image}
          />
        ) : (
          character && (
            <CharacterPortrait
              character={character}
              sizes="160px"
              className={styles.editor__image}
            />
          )
        )}
        <TextField
          label="Replace by link (copied to storage on save)"
          value={mugShotUrl}
          onChange={setMugShotUrl}
        />
        <ImageFinder
          label="Find portraits"
          isPortrait
          selected={pickedPortrait}
          onChange={setPickedPortrait}
          emptyText="No portraits found. Try adding the game title to the name."
          defaultQuery={[name.trim(), linkedGames[0]?.label]
            .filter(Boolean)
            .join(" ")}
          onSearch={findPortraits}
        />
        {character ? (
          <UploadButton
            label="Upload a file"
            disabled={isUploading}
            onFile={(file) =>
              upload(
                { id: character._id, file },
                {
                  onSuccess: ({ mugShot }) => {
                    toast.success({ description: "Portrait uploaded" });
                    onSaved({ ...character, mugShot });
                  },
                }
              )
            }
          />
        ) : (
          <p className={styles.muted}>Create the character to upload a file.</p>
        )}
      </div>
    </section>
  );
};
