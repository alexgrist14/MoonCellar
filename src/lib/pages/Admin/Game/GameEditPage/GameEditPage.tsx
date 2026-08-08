"use client";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  FieldErrors,
  Path,
  Resolver,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import {
  useAdminGameQuery,
  useGameFiltersQuery,
} from "@/src/lib/entities/game/api/game.queries";
import {
  useCreateGameMutation,
  useUpdateGameMutation,
  useUploadGameImageMutation,
} from "@/src/lib/entities/game/api/game.mutations";
import { usePlatformsQuery } from "@/src/lib/entities/platform/api/platform.queries";
import {
  AddGameRequestSchema,
  IAddGameRequest,
  IUpdateGameRequest,
  UpdateGameRequestSchema,
} from "@/src/lib/shared/lib/schemas/games.schema";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  CollapsibleSection,
  EnumField,
  EnumListField,
  IObjectFieldDescriptor,
  NumberField,
  NumberListField,
  ObjectListField,
  StringListField,
  TextField,
  TextareaField,
  ToggleField,
  UploadButton,
} from "../fields";
import { GAME_SECTIONS, IFieldDescriptor, IOptionsKey } from "./sections";
import styles from "./GameEditPage.module.scss";

type IGameFormValues = IUpdateGameRequest;
type IFormPath = Path<IGameFormValues>;

const FIELD_LABELS: Record<string, string> = GAME_SECTIONS.reduce(
  (acc, section) => {
    section.fields.forEach((field) => {
      acc[field.path] = field.label;
    });
    return acc;
  },
  {} as Record<string, string>
);

const OBJECT_LIST_FIELDS: Record<string, IObjectFieldDescriptor[]> =
  GAME_SECTIONS.reduce(
    (acc, section) => {
      section.fields.forEach((field) => {
        if (field.kind === "objectList" && field.fields) {
          acc[field.path] = field.fields;
        }
      });
      return acc;
    },
    {} as Record<string, IObjectFieldDescriptor[]>
  );

const CREATE_DEFAULTS: Partial<IGameFormValues> = {
  cover: null,
  screenshots: [],
  artworks: [],
  platformIds: [],
};

const isBlankObjectListRow = (
  row: Record<string, unknown>,
  fields: IObjectFieldDescriptor[]
): boolean =>
  fields.every((field) => {
    if (field.kind === "boolean") return true;

    const value = row[field.key];

    return value === undefined || value === "";
  });

const nullifyUndefined = (value: unknown): unknown => {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        nullifyUndefined(nested),
      ])
    );
  }
  return value;
};

const findErrorMessage = (
  node: unknown,
  visited = new WeakSet<object>()
): string | undefined => {
  if (!node || typeof node !== "object") return;
  if (visited.has(node)) return;

  visited.add(node);

  const record = node as Record<string, unknown>;

  if (typeof record.message === "string") return record.message;

  for (const [key, value] of Object.entries(record)) {
    if (key === "ref") continue;

    const message = findErrorMessage(value, visited);
    if (message) return message;
  }
};

const getErrorMessage = (
  errors: FieldErrors<IGameFormValues>,
  path: string
): string | undefined => {
  let node: unknown = errors;

  for (const part of path.split(".")) {
    const directMessage = (node as Record<string, unknown> | undefined)
      ?.message;
    if (typeof directMessage === "string") return directMessage;

    node = (node as Record<string, unknown> | undefined)?.[part];
    if (!node) return;
  }

  return findErrorMessage(node);
};

interface IGameEditPageProps {
  gameId?: string;
}

const GameEditPage: FC<IGameEditPageProps> = ({ gameId }) => {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isCreate = !gameId;
  const [original, setOriginal] = useState<Record<string, unknown>>({});
  const [invalidField, setInvalidField] = useState<{
    path: string;
    submission: number;
  } | null>(null);

  const {
    data: game,
    isPending: isGamePending,
    isError: isGameError,
  } = useAdminGameQuery(gameId);

  const { data: filters, isPending: isFiltersPending } = useGameFiltersQuery();
  const { data: platforms = [], isPending: isPlatformsPending } =
    usePlatformsQuery();

  const { mutate: createGame, isPending: isCreating } = useCreateGameMutation();
  const { mutate: updateGame, isPending: isUpdating } = useUpdateGameMutation();
  const { mutateAsync: uploadGameImage, isPending: isUploading } =
    useUploadGameImageMutation();

  const resolver = useMemo(
    () =>
      zodResolver(
        isCreate ? AddGameRequestSchema : UpdateGameRequestSchema
      ) as unknown as Resolver<IGameFormValues>,
    [isCreate]
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<IGameFormValues>({
    resolver,
    mode: "onBlur",
    defaultValues: isCreate ? CREATE_DEFAULTS : {},
  });

  const hydratedGameIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!gameId || !game) return;
    if (hydratedGameIdRef.current === gameId) return;
    hydratedGameIdRef.current = gameId;
    setOriginal(game as unknown as Record<string, unknown>);
    reset(game as unknown as IGameFormValues);
  }, [gameId, game, reset]);

  useEffect(() => {
    if (gameId) return;
    hydratedGameIdRef.current = undefined;
    setOriginal({});
    reset(CREATE_DEFAULTS);
  }, [gameId, reset]);

  useEffect(() => {
    if (!gameId || !isGameError) return;
    router.push("/admin");
  }, [gameId, isGameError, router]);

  const optionsFor = useCallback(
    (key?: IOptionsKey): string[] =>
      key && filters ? (filters[key] ?? []) : [],
    [filters]
  );

  const resolvedObjectFields = useMemo(() => {
    const map: Record<string, IObjectFieldDescriptor[]> = {};

    GAME_SECTIONS.forEach((section) =>
      section.fields.forEach((field) => {
        if (field.kind !== "objectList" || !field.fields) return;

        map[field.path] = field.fields.map((column) =>
          column.optionsKey
            ? {
                ...column,
                options: optionsFor(column.optionsKey as IOptionsKey),
              }
            : column
        );
      })
    );

    return map;
  }, [optionsFor]);

  useEffect(() => {
    if (!invalidField) return;

    const frame = requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(
        `[data-game-field="${CSS.escape(invalidField.path)}"]`
      );

      if (!element) return;

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element
        .querySelector<HTMLElement>(
          "input, textarea, button, [tabindex]:not([tabindex='-1'])"
        )
        ?.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [invalidField]);

  const platformNames = useMemo(
    () => platforms.map((platform) => platform.name),
    [platforms]
  );

  const onValid: SubmitHandler<IGameFormValues> = async (data) => {
    if (isCreate) {
      createGame(data as IAddGameRequest, {
        onSuccess: (game) => {
          toast.success({ description: "Game created" });
          router.push(`/admin/games/${game._id}`);
        },
      });
      return;
    }

    const sanitized: Record<string, unknown> = {
      ...(data as Record<string, unknown>),
    };
    Object.entries(OBJECT_LIST_FIELDS).forEach(([path, fields]) => {
      const rows = sanitized[path];
      if (!Array.isArray(rows)) return;

      sanitized[path] = rows.filter(
        (row) => !isBlankObjectListRow(row as Record<string, unknown>, fields)
      );
    });

    const patch: Record<string, unknown> = {};
    Object.keys(sanitized).forEach((key) => {
      if (JSON.stringify(sanitized[key]) === JSON.stringify(original[key]))
        return;
      patch[key] = nullifyUndefined(sanitized[key]);
    });

    if (!Object.keys(patch).length) {
      toast.success({ description: "Nothing to save" });
      return;
    }

    if (!gameId) return;

    updateGame(
      { gameId, patch: patch as IUpdateGameRequest },
      {
        onSuccess: (game) => {
          toast.success({ description: "Game updated" });
          setOriginal(game as unknown as Record<string, unknown>);
          reset(game as unknown as IGameFormValues);
        },
      }
    );
  };

  const onInvalid = (formErrors: FieldErrors<IGameFormValues>) => {
    const labels: string[] = [];
    const invalidPath = Object.keys(FIELD_LABELS).find((path) =>
      getErrorMessage(formErrors, path)
    );

    Object.keys(FIELD_LABELS).forEach((path) => {
      if (!getErrorMessage(formErrors, path)) return;
      const label = FIELD_LABELS[path];
      if (!labels.includes(label)) labels.push(label);
    });

    toast.error({
      description: `Required fields are missing or invalid: ${labels.join(", ") || "check the form"}`,
    });

    if (invalidPath) {
      setInvalidField((current) => ({
        path: invalidPath,
        submission: (current?.submission ?? 0) + 1,
      }));
    }
  };

  const handleUpload = async (
    path: string,
    uploadType: "cover" | "screenshot" | "artwork",
    file: File
  ) => {
    if (!gameId) return;

    const url = await uploadGameImage({
      gameId,
      type: uploadType,
      file,
    });
    const formPath = path as IFormPath;

    if (uploadType === "cover") {
      setValue(formPath, url, { shouldDirty: true });
      return;
    }

    const current = (getValues(formPath) as string[] | undefined) || [];
    setValue(formPath, [...current, url], { shouldDirty: true });
  };

  const renderField = (
    field: IFieldDescriptor,
    isLabelHidden: boolean = false
  ) => {
    const formPath = field.path as IFormPath;
    const error = getErrorMessage(errors, field.path);

    switch (field.kind) {
      case "text":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <TextField
                label={field.label}
                value={rhf.value as string}
                error={error}
                isLabelHidden={isLabelHidden}
                onChange={rhf.onChange}
              />
            )}
          />
        );
      case "number":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <NumberField
                label={field.label}
                value={rhf.value as number}
                error={error}
                onChange={rhf.onChange}
              />
            )}
          />
        );
      case "textarea":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <TextareaField
                label={field.label}
                value={rhf.value as string}
                onChange={rhf.onChange}
              />
            )}
          />
        );
      case "toggle":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <ToggleField
                label={field.label}
                value={rhf.value as boolean}
                onChange={rhf.onChange}
              />
            )}
          />
        );
      case "stringList":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <StringListField
                label={field.label}
                value={rhf.value as string[]}
                onChange={rhf.onChange}
              />
            )}
          />
        );
      case "numberList":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <NumberListField
                label={field.label}
                value={rhf.value as number[]}
                onChange={rhf.onChange}
              />
            )}
          />
        );
      case "enum":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <EnumField
                label={field.label}
                value={rhf.value as string}
                options={optionsFor(field.optionsKey)}
                error={error}
                onChange={rhf.onChange}
              />
            )}
          />
        );
      case "enumList":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <EnumListField
                label={field.label}
                value={rhf.value as string[]}
                options={optionsFor(field.optionsKey)}
                onChange={rhf.onChange}
              />
            )}
          />
        );
      case "objectList":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <div>
                <ObjectListField
                  label={field.label}
                  value={rhf.value as Record<string, unknown>[]}
                  fields={
                    resolvedObjectFields[field.path] || field.fields || []
                  }
                  isLabelHidden={isLabelHidden}
                  onChange={rhf.onChange}
                />
                {!!error && <span className={styles.fieldError}>{error}</span>}
              </div>
            )}
          />
        );
      case "platforms":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <div>
                <Dropdown
                  list={platformNames}
                  title={isLabelHidden ? undefined : field.label}
                  placeholder="Select platforms"
                  overwriteValue={
                    (rhf.value as string[])?.length
                      ? `Selected ${(rhf.value as string[]).length}`
                      : undefined
                  }
                  isMulti
                  isWithSearch
                  isWithReset
                  isThroughPortal
                  initialMultiValue={((rhf.value as string[]) || [])
                    .map((id) => platforms.findIndex((p) => p._id === id))
                    .filter((index) => index >= 0)}
                  getIndexes={(indexes) =>
                    rhf.onChange(
                      indexes
                        .map((index) => platforms[index]?._id)
                        .filter(Boolean)
                    )
                  }
                />
                {!!error && <span className={styles.fieldError}>{error}</span>}
              </div>
            )}
          />
        );
      case "coverUpload":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <div>
                <TextField
                  label={field.label}
                  value={rhf.value as string}
                  error={error}
                  readOnly
                  isLabelHidden={isLabelHidden}
                  onChange={rhf.onChange}
                />
                {!!rhf.value && (
                  <Image
                    className={styles.preview}
                    src={rhf.value as string}
                    alt="cover"
                    width={160}
                    height={224}
                  />
                )}
                {isCreate ? (
                  <span className={styles.uploadHint}>
                    Save the game first to upload images
                  </span>
                ) : (
                  <UploadButton
                    onFile={(file) =>
                      handleUpload(field.path, "cover", file).catch(
                        () => undefined
                      )
                    }
                  />
                )}
              </div>
            )}
          />
        );
      case "imageList":
        return (
          <Controller
            key={field.path}
            control={control}
            name={formPath}
            render={({ field: rhf }) => (
              <StringListField
                label={field.label}
                value={rhf.value as string[]}
                onChange={rhf.onChange}
                isAddDisabled
                action={
                  isCreate ? (
                    <span className={styles.uploadHint}>
                      Save the game first to upload
                    </span>
                  ) : (
                    <UploadButton
                      onFile={(file) =>
                        field.uploadType &&
                        handleUpload(field.path, field.uploadType, file).catch(
                          () => undefined
                        )
                      }
                    />
                  )
                }
              />
            )}
          />
        );
      default:
        return null;
    }
  };

  if (!isAdmin) return;

  const isPageLoading =
    isFiltersPending ||
    isPlatformsPending ||
    Boolean(gameId && isGamePending);

  if (isPageLoading || !filters) {
    return (
      <Box classNameContent={styles.loading}>
        <Loader className={styles.loader} />
      </Box>
    );
  }

  return (
    <Box className={styles.page} classNameContent={styles.content}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {isCreate ? "Create game" : `Edit: ${original.name as string}`}
        </h2>
        <div className={styles.actions}>
          {!isCreate && (
            <Button
              color={ButtonColor.DEFAULT}
              onClick={() => router.push(`/games/${original.slug as string}`)}
            >
              View game
            </Button>
          )}
          <Button
            color={ButtonColor.DEFAULT}
            onClick={() => router.push("/admin")}
          >
            Back to list
          </Button>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit(onValid, onInvalid)}>
        {!isCreate && (
          <div className={styles.readonly}>
            <span>id: {original._id as string}</span>
            <span>created: {original.createdAt as string}</span>
            <span>updated: {original.updatedAt as string}</span>
            <span>averageRating: {String(original.averageRating ?? "—")}</span>
            <span>isCustom: {String(original.isCustom ?? false)}</span>
          </div>
        )}

        <div>
          {GAME_SECTIONS.map((section) => (
            <CollapsibleSection
              key={section.title}
              title={section.title}
              note={section.note}
              isDefaultOpen={section.isDefaultOpen}
              hasError={section.fields.some(
                (field) => !!getErrorMessage(errors, field.path)
              )}
            >
              {section.fields.map((field) => {
                const isLabelHidden =
                  section.fields.length === 1 && field.label === section.title;

                return (
                  <div key={field.path} data-game-field={field.path}>
                    {renderField(field, isLabelHidden)}
                  </div>
                );
              })}
            </CollapsibleSection>
          ))}
        </div>

        <div className={styles.footer}>
          <Button
            type="submit"
            color={ButtonColor.GREEN}
            disabled={isSubmitting || isCreating || isUpdating || isUploading}
          >
            {isCreate ? "Create" : "Save"}
          </Button>
        </div>
      </form>
    </Box>
  );
};

export default GameEditPage;
