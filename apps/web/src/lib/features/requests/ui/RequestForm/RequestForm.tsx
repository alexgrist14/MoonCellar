"use client";

import { FC, useState } from "react";
import {
  CreateContentRequestSchema,
  IContentRequestAction,
  IContentRequestKind,
  ICreateContentRequest,
} from "@mooncellar/schemas";
import { useCreateRequestMutation } from "@/src/lib/entities/request/api";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import {
  StringListField,
  TextField,
  TextareaField,
} from "@/src/lib/shared/ui/Fields";
import {
  ISearchPickerOption,
  SearchPicker,
} from "@/src/lib/shared/ui/SearchPicker";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  EMPTY_GAME_DRAFT,
  IGameDraft,
  buildGamePayload,
  compact,
} from "../../model/game-request.utils";
import { useEntitySearch } from "../../model/useEntitySearch";
import { GameRequestFields } from "../GameRequestFields";
import { SelectedChips } from "../SelectedChips";
import styles from "./RequestForm.module.scss";

const KINDS: IContentRequestKind[] = ["game", "character"];
const ACTIONS: IContentRequestAction[] = ["add", "update"];

interface ICharacterDraft {
  name: string;
  akas: string[];
  games: ISearchPickerOption[];
  gender: string;
  species: string;
  countryName: string;
  description: string;
  mugShot: string;
}

const EMPTY_CHARACTER_DRAFT: ICharacterDraft = {
  name: "",
  akas: [],
  games: [],
  gender: "",
  species: "",
  countryName: "",
  description: "",
  mugShot: "",
};

interface IRequestFormProps {
  initialKind?: IContentRequestKind;
  initialTarget?: ISearchPickerOption;
  onSent?: () => void;
}

export const RequestForm: FC<IRequestFormProps> = ({
  initialKind = "game",
  initialTarget,
  onSent,
}) => {
  const systems = useCommonStore((s) => s.systems);
  const { mutate, isPending } = useCreateRequestMutation();

  const [kind, setKind] = useState<IContentRequestKind>(initialKind);
  const [action, setAction] = useState<IContentRequestAction>(
    initialTarget ? "update" : "add"
  );
  const [target, setTarget] = useState<ISearchPickerOption | undefined>(
    initialTarget
  );
  const [gameDraft, setGameDraft] = useState<IGameDraft>(EMPTY_GAME_DRAFT);
  const [characterDraft, setCharacterDraft] = useState<ICharacterDraft>(
    EMPTY_CHARACTER_DRAFT
  );
  const [sources, setSources] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const targetSearch = useEntitySearch(kind);
  const gameSearch = useEntitySearch("game");

  const setCharacter =
    <K extends keyof ICharacterDraft>(key: K) =>
    (value: ICharacterDraft[K]) =>
      setCharacterDraft((current) => ({ ...current, [key]: value }));

  const switchKind = (next: IContentRequestKind) => {
    setKind(next);
    setTarget(undefined);
  };

  const buildRequest = (): ICreateContentRequest => {
    const base = {
      action,
      targetId: action === "update" ? target?.id : undefined,
      sources,
      note: note.trim() || undefined,
    };

    if (kind === "game") {
      return { ...base, kind, payload: buildGamePayload(gameDraft, systems) };
    }

    return {
      ...base,
      kind,
      payload: compact({
        name: characterDraft.name.trim(),
        akas: characterDraft.akas,
        gameIds: characterDraft.games.map((game) => game.id),
        gender: characterDraft.gender.trim(),
        species: characterDraft.species.trim(),
        countryName: characterDraft.countryName.trim(),
        description: characterDraft.description.trim(),
        mugShot: characterDraft.mugShot.trim(),
      }),
    };
  };

  const handleSubmit = () => {
    let request: ICreateContentRequest;

    try {
      request = buildRequest();
    } catch (err) {
      toast.error({
        title: "Check the form",
        description: (err as Error).message,
      });
      return;
    }

    const parsed = CreateContentRequestSchema.safeParse(request);

    if (!parsed.success) {
      const [issue] = parsed.error.issues;
      const field = issue.path.filter((part) => part !== "payload").join(" ");

      toast.error({
        title: "Check the form",
        description: field ? `${field}: ${issue.message}` : issue.message,
      });
      return;
    }

    mutate(request, {
      onSuccess: () => {
        toast.success({
          title: "Request sent",
          description: "A moderator will review it soon.",
        });
        setGameDraft(EMPTY_GAME_DRAFT);
        setCharacterDraft(EMPTY_CHARACTER_DRAFT);
        setSources([]);
        setNote("");
        onSent?.();
      },
    });
  };

  const isUpdate = action === "update";

  return (
    <div className={styles.form}>
      <div className={styles.switches}>
        <Tabs
          theme="segmented"
          ariaLabel="What to suggest"
          defaultTabIndex={KINDS.indexOf(kind)}
          isUseDefaultIndex
          contents={[
            { tabName: "Game", onTabClick: () => switchKind("game") },
            { tabName: "Character", onTabClick: () => switchKind("character") },
          ]}
        />
        <Tabs
          theme="segmented"
          ariaLabel="New or existing"
          defaultTabIndex={ACTIONS.indexOf(action)}
          isUseDefaultIndex
          contents={[
            { tabName: "Add new", onTabClick: () => setAction("add") },
            {
              tabName: "Update existing",
              onTabClick: () => setAction("update"),
            },
          ]}
        />
      </div>

      {isUpdate && (
        <section className={styles.group}>
          {target ? (
            <div className={styles.target}>
              <div>
                <p className={styles.target__label}>Updating</p>
                <p className={styles.target__name}>{target.label}</p>
                {!!target.meta && (
                  <p className={styles.target__meta}>{target.meta}</p>
                )}
              </div>
              <Button
                type="button"
                color={ButtonColor.TRANSPARENT}
                onClick={() => setTarget(undefined)}
              >
                Change
              </Button>
            </div>
          ) : (
            <SearchPicker
              label={kind === "game" ? "Which game" : "Which character"}
              placeholder="Start typing a name"
              search={targetSearch.search}
              onSearch={targetSearch.setSearch}
              options={targetSearch.options}
              isLoading={targetSearch.isLoading}
              onPick={(option) => {
                setTarget(option);
                targetSearch.setSearch("");
              }}
            />
          )}
          <p className={styles.hint}>
            Fill in only what should change. Empty fields keep their current
            value.
          </p>
        </section>
      )}

      {kind === "game" ? (
        <GameRequestFields
          draft={gameDraft}
          onChange={setGameDraft}
          isUpdate={isUpdate}
        />
      ) : (
        <>
          <section className={styles.group}>
            <h3 className={styles.group__title}>Character</h3>
            <div className={styles.grid}>
              <TextField
                label={isUpdate ? "Name — leave empty to keep" : "Name"}
                value={characterDraft.name}
                onChange={setCharacter("name")}
              />
              <TextField
                label="From"
                value={characterDraft.countryName}
                onChange={setCharacter("countryName")}
              />
              <TextField
                label="Gender"
                value={characterDraft.gender}
                onChange={setCharacter("gender")}
              />
              <TextField
                label="Species"
                value={characterDraft.species}
                onChange={setCharacter("species")}
              />
            </div>
            <StringListField
              label="Also known as"
              value={characterDraft.akas}
              onChange={setCharacter("akas")}
            />
            <SearchPicker
              label="Appears in"
              placeholder="Search a game to link"
              search={gameSearch.search}
              onSearch={gameSearch.setSearch}
              options={gameSearch.options.filter(
                (option) =>
                  !characterDraft.games.some((game) => game.id === option.id)
              )}
              isLoading={gameSearch.isLoading}
              onPick={(option) => {
                setCharacter("games")([...characterDraft.games, option]);
                gameSearch.setSearch("");
              }}
            />
            <SelectedChips
              items={characterDraft.games}
              onRemove={(id) =>
                setCharacter("games")(
                  characterDraft.games.filter((game) => game.id !== id)
                )
              }
            />
            <TextareaField
              label="Description"
              value={characterDraft.description}
              onChange={setCharacter("description")}
            />
          </section>
          <section className={styles.group}>
            <h3 className={styles.group__title}>
              Portrait
              <span>
                A link to an image on another site. Nothing is stored until a
                moderator approves.
              </span>
            </h3>
            <TextField
              label="Portrait link"
              value={characterDraft.mugShot}
              onChange={setCharacter("mugShot")}
            />
          </section>
        </>
      )}

      <section className={styles.group}>
        <h3 className={styles.group__title}>
          Sources
          <span>Where a moderator can check the facts</span>
        </h3>
        <StringListField
          label="Source links"
          value={sources}
          onChange={setSources}
        />
        <TextareaField
          label="Note for the moderator"
          value={note}
          onChange={setNote}
        />
      </section>

      <div className={styles.footer}>
        <p className={styles.hint}>
          You can withdraw the request while it is pending.
        </p>
        <Button
          type="button"
          color={ButtonColor.ACCENT}
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isUpdate ? "Send correction" : "Send request"}
        </Button>
      </div>
    </div>
  );
};
