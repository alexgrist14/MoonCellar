import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../Button";
import {
  CollapsibleSection,
  DateField,
  deriveReleaseDateFields,
  EnumField,
  EnumListField,
  IObjectFieldDescriptor,
  ImagePickerField,
  NumberField,
  NumberListField,
  ObjectListField,
  StringListField,
  TextareaField,
  TextField,
  ToggleField,
  UploadButton,
} from ".";

const GENRES = [
  "Adventure",
  "Platform",
  "Role-playing (RPG)",
  "Shooter",
  "Puzzle",
];

const Column = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "var(--gap-x4)",
      maxWidth: 520,
    }}
  >
    {children}
  </div>
);

const BasicFieldsDemo = ({
  isDisabled,
  isWithErrors,
}: {
  isDisabled?: boolean;
  isWithErrors?: boolean;
}) => {
  const [name, setName] = useState("Chrono Trigger");
  const [rating, setRating] = useState<number | null>(isWithErrors ? -3 : 92);
  const [summary, setSummary] = useState(
    "A group of adventurers travel through time to prevent a global catastrophe."
  );
  const [releaseDate, setReleaseDate] = useState<number | undefined>(795225600);
  const [isAdult, setIsAdult] = useState(false);
  const [type, setType] = useState<string | undefined>("Main game");

  return (
    <Column>
      <TextField
        label="Name"
        value={isWithErrors ? "" : name}
        onChange={setName}
        disabled={isDisabled}
        error={isWithErrors ? "Name is required" : undefined}
      />
      <NumberField
        label="Rating"
        value={rating}
        onChange={setRating}
        disabled={isDisabled}
        error={isWithErrors ? "Rating must be between 0 and 100" : undefined}
      />
      <TextareaField
        label="Summary"
        value={summary}
        onChange={setSummary}
        disabled={isDisabled}
      />
      <DateField
        label="First release"
        value={releaseDate}
        onChange={setReleaseDate}
        disabled={isDisabled}
        error={isWithErrors ? "Release date is in the future" : undefined}
      />
      <ToggleField
        label="Adult content"
        value={isAdult}
        onChange={setIsAdult}
        disabled={isDisabled}
      />
      <EnumField
        label="Type"
        value={type}
        options={["Main game", "DLC", "Expansion", "Remake", "Remaster"]}
        onChange={setType}
        disabled={isDisabled}
        error={isWithErrors ? "Type is required" : undefined}
      />
    </Column>
  );
};

const ListFieldsDemo = () => {
  const [names, setNames] = useState(["Kurono Toriga", "クロノ・トリガー"]);
  const [ids, setIds] = useState([1234, 5678]);
  const [genres, setGenres] = useState(["Role-playing (RPG)"]);

  return (
    <Column>
      <StringListField
        label="Alternative names"
        value={names}
        onChange={setNames}
      />
      <NumberListField label="IGDB ids" value={ids} onChange={setIds} />
      <EnumListField
        label="Genres"
        value={genres}
        options={GENRES}
        onChange={setGenres}
      />
    </Column>
  );
};

const RELEASE_FIELDS: IObjectFieldDescriptor[] = [
  {
    key: "platform",
    label: "Platform",
    kind: "text",
    options: ["SNES", "PlayStation", "Nintendo DS"],
  },
  { key: "region", label: "Region", kind: "text" },
  { key: "date", label: "Date", kind: "date", derive: deriveReleaseDateFields },
  { key: "isDigital", label: "Digital", kind: "boolean" },
];

const ObjectListDemo = () => {
  const [releases, setReleases] = useState<Record<string, unknown>[]>([
    { platform: "SNES", region: "Japan", date: 795225600, isDigital: false },
    {
      platform: "Nintendo DS",
      region: "Europe",
      date: 1233878400,
      isDigital: false,
    },
  ]);

  return (
    <ObjectListField
      label="Release dates"
      value={releases}
      onChange={setReleases}
      fields={RELEASE_FIELDS}
    />
  );
};

const ImagePickerDemo = ({ isEmpty }: { isEmpty?: boolean }) => {
  const [value, setValue] = useState<string | null>(null);

  return (
    <ImagePickerField
      label="Background"
      value={value}
      onChange={setValue}
      autoCaption="The first screenshot is used"
      options={
        isEmpty
          ? []
          : [
              { url: "/images/moon.jpg", caption: "Screenshot 1" },
              { url: "/images/moon2.jpg", caption: "Screenshot 2" },
              { url: "/images/moon3.jpg", caption: "Artwork" },
            ]
      }
    />
  );
};

const RegisteredDemo = () => {
  const {
    register,
    formState: { errors, isValid },
  } = useForm<{ time?: number; notes: string }>({
    mode: "onChange",
    defaultValues: { notes: "" },
  });

  return (
    <Column>
      <TextField
        label="Game time (hours)"
        inputMode="decimal"
        placeholder="0"
        {...register("time", {
          setValueAs: (value) =>
            value === "" || value == null ? undefined : Number(value),
          validate: (value) =>
            value === undefined || value >= 0 || "Time cannot be negative",
        })}
        error={errors.time}
      />
      <TextareaField
        label="Notes"
        placeholder="Anything to remember"
        {...register("notes", {
          maxLength: { value: 40, message: "Too long" },
        })}
        error={errors.notes}
      />
      <p style={{ color: "var(--color-text-muted)" }}>
        Form is {isValid ? "valid" : "invalid"}
      </p>
    </Column>
  );
};

const UploadResettableDemo = () => {
  const [file, setFile] = useState<File>();

  return (
    <Column>
      <UploadButton
        label="Choose background"
        onFile={setFile}
        fileName={file ? `New: ${file.name}` : null}
        isFullWidth
      />
      <Button type="button" onClick={() => setFile(undefined)}>
        Save
      </Button>
    </Column>
  );
};

const ToggleWithHintDemo = () => {
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRanked, setIsRanked] = useState(true);

  return (
    <Column>
      <ToggleField
        label="Private list"
        hint="Only you can open it."
        value={isPrivate}
        onChange={setIsPrivate}
      />
      <ToggleField
        label="Ranked list"
        hint="Show each game's position, like in a top 10."
        labelPosition="end"
        value={isRanked}
        onChange={setIsRanked}
      />
    </Column>
  );
};

const meta = {
  title: "Shared/Fields",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const TextFields: Story = { render: () => <BasicFieldsDemo /> };

export const WithErrors: Story = {
  render: () => <BasicFieldsDemo isWithErrors />,
};

export const Disabled: Story = { render: () => <BasicFieldsDemo isDisabled /> };

export const ListFields: Story = { render: () => <ListFieldsDemo /> };

export const ObjectList: Story = { render: () => <ObjectListDemo /> };

export const ImagePicker: Story = { render: () => <ImagePickerDemo /> };

export const ImagePickerEmpty: Story = {
  render: () => <ImagePickerDemo isEmpty />,
};

export const Collapsible: Story = {
  render: () => (
    <Column>
      <CollapsibleSection
        title="Companies"
        note="Developers and publishers as listed on IGDB."
        isDefaultOpen
      >
        <TextField label="Developer" value="Square" onChange={() => {}} />
      </CollapsibleSection>
      <CollapsibleSection title="Links" hasError>
        <TextField
          label="Official site"
          value="not a url"
          onChange={() => {}}
          error="Must be a valid URL"
        />
      </CollapsibleSection>
      <CollapsibleSection title="Media">
        <TextField label="Trailer" value="" onChange={() => {}} />
      </CollapsibleSection>
    </Column>
  ),
};

export const CollapsibleStatic: Story = {
  render: () => (
    <Column>
      <CollapsibleSection
        title="Release"
        note="Dates come from IGDB unless edited here."
        isStatic
      >
        <TextField label="Release name" value="" onChange={() => {}} />
      </CollapsibleSection>
    </Column>
  ),
};

export const Upload: Story = {
  render: () => <UploadButton onFile={() => {}} tooltip="PNG or JPG" />,
};

export const UploadResettable: Story = {
  render: () => <UploadResettableDemo />,
};

export const Registered: Story = { render: () => <RegisteredDemo /> };

export const ToggleWithHint: Story = { render: () => <ToggleWithHintDemo /> };
