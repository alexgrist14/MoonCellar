"use client";
import { FC, useEffect, useMemo, useState } from "react";
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
import { adminGamesApi, gamesApi } from "@/src/lib/shared/api";
import { platformsAPI } from "@/src/lib/shared/api/platforms.api";
import {
  AddGameRequestSchema,
  IAddGameRequest,
  IUpdateGameRequest,
  UpdateGameRequestSchema,
} from "@/src/lib/shared/lib/schemas/games.schema";
import { IPlatform } from "@/src/lib/shared/lib/schemas/platforms.schema";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  CollapsibleSection,
  IObjectFieldDescriptor,
  NumberField,
  NumberListField,
  ObjectListField,
  StringListField,
  TextField,
  TextareaField,
  ToggleField,
} from "../fields";
import { GAME_SECTIONS, IFieldDescriptor } from "./sections";
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

const getErrorMessage = (
  errors: FieldErrors<IGameFormValues>,
  path: string
): string | undefined => {
  let node: unknown = errors;

  for (const part of path.split(".")) {
    node = (node as Record<string, unknown> | undefined)?.[part];
  }

  return (node as { message?: string } | undefined)?.message;
};

interface IGameEditPageProps {
  gameId?: string;
}

const GameEditPage: FC<IGameEditPageProps> = ({ gameId }) => {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isCreate = !gameId;
  const [original, setOriginal] = useState<Record<string, unknown>>({});
  const [platforms, setPlatforms] = useState<IPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(!isCreate);

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

  useEffect(() => {
    platformsAPI.getAll().then((res) => setPlatforms(res.data));
  }, []);

  useEffect(() => {
    if (!gameId) {
      setOriginal({});
      reset(CREATE_DEFAULTS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    adminGamesApi
      .getGameById(gameId)
      .then((res) => {
        setOriginal(res.data as unknown as Record<string, unknown>);
        reset(res.data as unknown as IGameFormValues);
      })
      .catch(() => router.push("/admin"))
      .finally(() => setIsLoading(false));
  }, [gameId, reset, router]);

  const platformNames = useMemo(
    () => platforms.map((platform) => platform.name),
    [platforms]
  );

  const onValid: SubmitHandler<IGameFormValues> = async (data) => {
    try {
      if (isCreate) {
        const res = await gamesApi.add(data as IAddGameRequest);
        toast.success({ description: "Game created" });
        router.push(`/admin/games/${res.data._id}`);
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

      const res = await gamesApi.update(gameId, patch as IUpdateGameRequest);
      toast.success({ description: "Game updated" });
      setOriginal(res.data as unknown as Record<string, unknown>);
      reset(res.data as unknown as IGameFormValues);
    } catch {
      return;
    }
  };

  const onInvalid = (formErrors: FieldErrors<IGameFormValues>) => {
    const labels: string[] = [];

    Object.keys(FIELD_LABELS).forEach((path) => {
      if (!getErrorMessage(formErrors, path)) return;
      const label = FIELD_LABELS[path];
      if (!labels.includes(label)) labels.push(label);
    });

    toast.error({
      description: `Required fields are missing or invalid: ${labels.join(", ") || "check the form"}`,
    });
  };

  const handleUpload = async (
    path: string,
    uploadType: "cover" | "screenshot" | "artwork",
    file: File
  ) => {
    if (!gameId) return;

    const res = await gamesApi.uploadImage(gameId, uploadType, file);
    const formPath = path as IFormPath;

    if (uploadType === "cover") {
      setValue(formPath, res.data, { shouldDirty: true });
      return;
    }

    const current = (getValues(formPath) as string[] | undefined) || [];
    setValue(formPath, [...current, res.data], { shouldDirty: true });
  };

  const renderField = (field: IFieldDescriptor) => {
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
                  fields={field.fields || []}
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
                  title={field.label}
                  placeholder="Select platforms"
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
                <input
                  type="file"
                  accept="image/*"
                  disabled={isCreate}
                  title={
                    isCreate
                      ? "Save the game first to enable uploads"
                      : undefined
                  }
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      handleUpload(field.path, "cover", file).catch(
                        () => undefined
                      );
                  }}
                />
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
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isCreate}
                    title={
                      isCreate
                        ? "Save the game first to enable uploads"
                        : undefined
                    }
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && field.uploadType)
                        handleUpload(field.path, field.uploadType, file).catch(
                          () => undefined
                        );
                    }}
                  />
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

  if (isLoading) {
    return (
      <Box classNameContent={styles.loading}>
        <Loader />
      </Box>
    );
  }

  return (
    <Box
      className={styles.page}
      classNameContent={styles.content}
      title={isCreate ? "Create game" : `Edit: ${original.name as string}`}
      titleAction={
        <Button
          color={ButtonColor.DEFAULT}
          onClick={() => router.push("/admin")}
        >
          Back to list
        </Button>
      }
    >
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
              {section.fields.map(renderField)}
            </CollapsibleSection>
          ))}
        </div>

        <div className={styles.footer}>
          <Button
            type="submit"
            color={ButtonColor.GREEN}
            disabled={isSubmitting}
          >
            {isCreate ? "Create" : "Save"}
          </Button>
        </div>
      </form>
    </Box>
  );
};

export default GameEditPage;
