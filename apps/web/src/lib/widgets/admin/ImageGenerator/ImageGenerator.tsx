import { FC, useState } from "react";
import Image from "next/image";
import cn from "classnames";
import {
  IImageElement,
  IImageProvider,
  IMAGE_MODELS,
  IMAGE_PROMPT_MAX_LENGTH,
  IMAGE_PROVIDERS,
} from "@mooncellar/schemas";
import {
  useDeleteGeneratedImageMutation,
  useGenerateImageMutation,
  useGeneratedImagesQuery,
  useSaveGeneratedImageMutation,
} from "@/src/lib/entities/generated-image/api";
import {
  IGeneratedImageEntry,
  useGeneratedImagesStore,
} from "@/src/lib/entities/generated-image/model";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { modal } from "@/src/lib/shared/ui/Modal";
import { Table } from "@/src/lib/shared/ui/Table";
import { Textarea } from "@/src/lib/shared/ui/Textarea";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import {
  compressDataUrl,
  downloadImage,
  pickKeyColor,
  removeKeyColor,
} from "@/src/lib/shared/utils/image.utils";
import { toSlug } from "@/src/lib/shared/utils/slug.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { ElementsModal } from "./ElementsModal";
import { RowActions } from "./RowActions";
import styles from "./ImageGenerator.module.scss";

const PROVIDER_LABELS: Record<IImageProvider, string> = {
  openai: "OpenAI",
  recraft: "Recraft",
};

type IBusyState = "generating" | "saving" | "deleting";

type IPendingEntry = Pick<
  IGeneratedImageEntry,
  "id" | "prompt" | "provider" | "model" | "parentId" | "elementName"
>;

type IRow = IPendingEntry & Partial<IGeneratedImageEntry>;

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

export const ImageGenerator: FC = () => {
  const [provider, setProvider] = useState<IImageProvider>("openai");
  const [model, setModel] = useState(IMAGE_MODELS.openai[0]);
  const [prompt, setPrompt] = useState("");
  const [isSplit, setIsSplit] = useState(false);
  const [pending, setPending] = useState<IPendingEntry[]>([]);
  const [busy, setBusy] = useState<Record<string, IBusyState>>({});

  const { entries, addEntry, updateEntry, removeEntry } =
    useGeneratedImagesStore();
  const { data: savedImages = [] } = useGeneratedImagesQuery();
  const { mutateAsync: generateImage } = useGenerateImageMutation();
  const { mutateAsync: saveImage } = useSaveGeneratedImageMutation();
  const { mutateAsync: deleteImage } = useDeleteGeneratedImageMutation();

  const setRowBusy = (id: string, state?: IBusyState) =>
    setBusy(({ [id]: _previous, ...rest }) =>
      state ? { ...rest, [id]: state } : rest
    );

  const openElements = (entry: IGeneratedImageEntry) => {
    const modalId = `generated-image-elements-${entry.id}`;

    modal.open(
      <ElementsModal
        entry={entry}
        onGenerate={(elements) => generateElements(entry, elements)}
        onClose={() => modal.close(modalId)}
      />,
      { id: modalId }
    );
  };

  const generate = async (
    request: IPendingEntry,
    {
      targetId,
      referenceDataUrl,
      isSplitAfter,
    }: {
      targetId?: string;
      referenceDataUrl?: string;
      isSplitAfter?: boolean;
    } = {}
  ) => {
    if (targetId) {
      setRowBusy(targetId, "generating");
    } else {
      setPending((current) =>
        request.parentId ? [...current, request] : [request, ...current]
      );
    }

    try {
      const keyColor = referenceDataUrl
        ? await pickKeyColor(referenceDataUrl)
        : undefined;
      const { dataUrl } = await generateImage({
        provider: request.provider,
        model: request.model,
        prompt: request.prompt,
        referenceDataUrl,
        keyColor,
      });
      const image = {
        prompt: request.prompt,
        dataUrl: await compressDataUrl(
          keyColor ? await removeKeyColor(dataUrl, keyColor) : dataUrl
        ),
        createdAt: new Date().toISOString(),
      };

      if (targetId) {
        updateEntry(targetId, { ...image, savedId: undefined, url: undefined });
      } else {
        const entry = { ...request, ...image };

        addEntry(entry);

        if (isSplitAfter) openElements(entry);
      }
    } catch {
    } finally {
      if (targetId) {
        setRowBusy(targetId);
      } else {
        setPending((current) =>
          current.filter((entry) => entry.id !== request.id)
        );
      }
    }
  };

  const generateElements = (
    parent: IGeneratedImageEntry,
    elements: IImageElement[]
  ) =>
    elements.forEach((element) =>
      generate(
        {
          id: createId(),
          prompt: element.prompt,
          provider: parent.provider,
          model: parent.model,
          parentId: parent.id,
          elementName: element.name,
        },
        { referenceDataUrl: parent.dataUrl }
      )
    );

  const handleGenerate = () => {
    const text = prompt.trim();

    if (!text) return;

    generate(
      { id: createId(), prompt: text, provider, model },
      { isSplitAfter: isSplit }
    );
  };

  const handleSaveSet = async (parent: IGeneratedImageEntry) => {
    const set = [parent, ...entries.filter((e) => e.parentId === parent.id)];

    for (const entry of set) {
      if (!entry.savedId) await handleSave(entry);
    }
  };

  const handleSave = async (entry: IGeneratedImageEntry) => {
    setRowBusy(entry.id, "saving");

    try {
      const saved = await saveImage({
        provider: entry.provider,
        model: entry.model,
        prompt: entry.prompt,
        dataUrl: entry.dataUrl,
      });

      updateEntry(entry.id, { savedId: saved._id, url: saved.url });
      toast.success({ description: "The image was uploaded to S3" });
    } catch {
    } finally {
      setRowBusy(entry.id);
    }
  };

  const handleDelete = (entry: IGeneratedImageEntry) => {
    const modalId = `delete-generated-image-${entry.id}`;
    const set = [entry, ...entries.filter((e) => e.parentId === entry.id)];
    const savedIds = set.flatMap((item) =>
      item.savedId ? [item.savedId] : []
    );
    const elementsCount = set.length - 1;

    modal.open(
      <ConfirmModal
        title={elementsCount ? "Delete image set" : "Delete image"}
        message={
          <p>
            {elementsCount
              ? `Delete this image and its ${elementsCount} ${elementsCount === 1 ? "element" : "elements"}?`
              : "Delete this image from the list?"}
          </p>
        }
        warning={
          savedIds.length
            ? "Uploaded copies are also deleted from S3 and the database."
            : "The generated images are lost for good."
        }
        onConfirm={async () => {
          modal.close(modalId);

          if (!savedIds.length) {
            removeEntry(entry.id);
            return;
          }

          setRowBusy(entry.id, "deleting");

          try {
            for (const id of savedIds) await deleteImage(id);
            removeEntry(entry.id);
          } catch {
          } finally {
            setRowBusy(entry.id);
          }
        }}
        onCancel={() => modal.close(modalId)}
      />,
      { id: modalId }
    );
  };

  const openFullImage = (entry: IGeneratedImageEntry) => {
    const modalId = `generated-image-${entry.id}`;

    modal.open(
      <button
        type="button"
        className={styles.full}
        aria-label="Close the image"
        onClick={() => modal.close(modalId)}
      >
        <Image
          src={entry.url ?? entry.dataUrl}
          alt={entry.prompt}
          width={1536}
          height={1536}
          unoptimized
        />
      </button>,
      { id: modalId }
    );
  };

  const localSavedIds = new Set(entries.map((entry) => entry.savedId));
  const remoteEntries: IGeneratedImageEntry[] = savedImages
    .filter((image) => !localSavedIds.has(image._id))
    .map((image) => ({
      id: image._id,
      prompt: image.prompt,
      provider: image.provider,
      model: image.model,
      dataUrl: image.url,
      createdAt: image.createdAt,
      savedId: image._id,
      url: image.url,
    }));
  const remoteIds = new Set(remoteEntries.map((entry) => entry.id));
  const allRows: IRow[] = [...pending, ...entries, ...remoteEntries];
  const rows = allRows
    .filter((row) => !row.parentId)
    .flatMap((row) => [
      row,
      ...allRows.filter((child) => child.parentId === row.id),
    ]);

  return (
    <div className={styles.generator}>
      <div className={styles.form}>
        <div className={styles.form__selects}>
          <Dropdown
            list={IMAGE_PROVIDERS.map((item) => PROVIDER_LABELS[item])}
            initialValue={PROVIDER_LABELS[provider]}
            title="Provider"
            getIndex={(index) => {
              const next = IMAGE_PROVIDERS[index];

              if (!next) return;

              setProvider(next);
              setModel(IMAGE_MODELS[next][0]);
            }}
          />
          <Dropdown
            key={provider}
            list={IMAGE_MODELS[provider]}
            initialValue={model}
            title="Model"
            getValue={(value) => value && setModel(value)}
          />
        </div>
        <Textarea
          value={prompt}
          rows={4}
          placeholder="Describe the image"
          onChange={(event) =>
            setPrompt(event.target.value.slice(0, IMAGE_PROMPT_MAX_LENGTH))
          }
        />
        <div className={styles.form__footer}>
          <label className={styles.form__split}>
            <Checkbox
              checked={isSplit}
              onChange={() => setIsSplit((current) => !current)}
            />
            <span>Split into elements after generating</span>
          </label>
          <Button
            color={ButtonColor.ACCENT}
            disabled={!prompt.trim()}
            onClick={handleGenerate}
          >
            Generate
          </Button>
        </div>
      </div>

      {!rows.length ? (
        <EmptyState
          title="Generated images appear here."
          description="Unsaved images are kept in this browser; uploaded ones are listed for every admin."
        />
      ) : (
        <Table
          mobileHeadField="prompt"
          columnStyles={{
            preview: { width: "176px" },
            prompt: { width: "280px", minWidth: "200px" },
            createdAt: { width: "140px", minWidth: "120px" },
            link: { width: "180px", minWidth: "140px" },
            actions: { width: "140px", minWidth: "130px" },
          }}
          headers={{
            preview: { content: "Preview", isNotResizable: true },
            prompt: { content: "Prompt" },
            createdAt: { content: "Created" },
            link: { content: "S3 link" },
            actions: { content: "Actions", isNotResizable: true },
          }}
          rows={rows.map((row) => {
            const entry = row.dataUrl ? (row as IGeneratedImageEntry) : null;
            const state = entry ? busy[entry.id] : "generating";
            const parent = row.parentId
              ? entries.find((item) => item.id === row.parentId)
              : undefined;
            const children = entries.filter((item) => item.parentId === row.id);
            const hasUnsavedSet =
              !!children.length &&
              [entry, ...children].some((item) => item && !item.savedId);

            return {
              preview: {
                content: entry ? (
                  <button
                    type="button"
                    className={styles.preview}
                    aria-label="Open the full image"
                    disabled={state === "generating"}
                    onClick={() => openFullImage(entry)}
                  >
                    <Image
                      src={entry.dataUrl}
                      alt={entry.prompt}
                      width={160}
                      height={90}
                      unoptimized
                    />
                    {state === "generating" && (
                      <span className={styles.preview__loader}>
                        <Loader />
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.preview}
                    aria-label="Generating the image"
                    disabled
                  >
                    <span className={styles.preview__loader}>
                      <Loader />
                    </span>
                  </button>
                ),
              },
              prompt: {
                content: (
                  <span
                    className={cn(styles.prompt, {
                      [styles.prompt_element]: !!row.parentId,
                    })}
                  >
                    {row.elementName && (
                      <span className={styles.prompt__element}>
                        {row.elementName}
                      </span>
                    )}
                    <span className={styles.prompt__text}>{row.prompt}</span>
                    <span className={styles.prompt__model}>
                      {PROVIDER_LABELS[row.provider]} · {row.model}
                    </span>
                  </span>
                ),
              },
              createdAt: {
                content: entry
                  ? commonUtils.getHumanDate(entry.createdAt)
                  : "Generating…",
                sortingValue: entry?.createdAt ?? "",
              },
              link: {
                content: entry?.url ? (
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.link}
                  >
                    {entry.url}
                  </a>
                ) : (
                  "—"
                ),
              },
              actions: {
                content: entry ? (
                  <RowActions
                    prompt={entry.prompt}
                    busyState={state}
                    isSaved={!!entry.savedId}
                    isElement={!!entry.parentId}
                    isRemote={remoteIds.has(entry.id)}
                    hasUnsavedSet={hasUnsavedSet}
                    onUploadSet={() => handleSaveSet(entry)}
                    onUpload={() => handleSave(entry)}
                    onRegenerate={(text) =>
                      generate(
                        {
                          id: entry.id,
                          prompt: text,
                          provider: entry.provider,
                          model: entry.model,
                        },
                        {
                          targetId: entry.id,
                          referenceDataUrl: parent?.dataUrl,
                        }
                      )
                    }
                    onElements={() => openElements(entry)}
                    onDownload={() =>
                      downloadImage(
                        entry.dataUrl,
                        toSlug(entry.elementName ?? entry.prompt).slice(
                          0,
                          60
                        ) || "image"
                      )
                    }
                    onDelete={() => handleDelete(entry)}
                  />
                ) : null,
              },
            };
          })}
        />
      )}
    </div>
  );
};
