"use client";

import { FC, useState } from "react";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/navigation";
import { ICharacterResponse, ICharacterSource } from "@mooncellar/schemas";
import { useAdminCharactersQuery } from "@/src/lib/entities/character/api";
import { CharacterPortrait } from "@/src/lib/entities/character/ui/CharacterPortrait";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { Table } from "@/src/lib/shared/ui/Table";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./CharactersAdmin.module.scss";

const TAKE = 30;
const SOURCES: (ICharacterSource | undefined)[] = [
  undefined,
  "igdb",
  "vndb",
  "manual",
];

const getCharacterSource = (character: ICharacterResponse) =>
  character.vndb ? "VNDB" : character.igdb ? "IGDB" : "manual";

export const CharactersAdmin: FC = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search.trim(), 300);
  const [source, setSource] = useState<ICharacterSource>();
  const [page, setPage] = useState(1);
  const router = useRouter();

  const { data, isLoading, isFetching } = useAdminCharactersQuery({
    search: debouncedSearch || undefined,
    source,
    page,
    take: TAKE,
  });

  const characters = data?.results ?? [];
  const getEditorHref = (id: string) => `/admin/characters/${id}`;

  return (
    <div className={styles.admin}>
      <div className={styles.toolbar}>
        <Input
          value={search}
          placeholder="Search by name or alias"
          containerClassname={styles.toolbar__search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Tabs
          theme="segmented"
          ariaLabel="Source"
          mobileMenuTitle="Source"
          contents={SOURCES.map((item) => ({
            tabName: item
              ? item === "manual"
                ? "Manual"
                : item.toUpperCase()
              : "All",
            onTabClick: () => {
              setSource(item);
              setPage(1);
            },
          }))}
        />
        <Button color={ButtonColor.GREEN} href={getEditorHref("new")}>
          New character
        </Button>
      </div>

      <Table
        mobileHeadField="character"
        isLoading={isLoading}
        limit={TAKE}
        columnStyles={{
          character: { width: "320px", minWidth: "220px" },
          games: { width: "100px", minWidth: "90px" },
          portrait: { width: "110px", minWidth: "100px" },
          source: { width: "110px", minWidth: "100px" },
          updated: { width: "130px", minWidth: "120px" },
        }}
        headers={{
          character: { content: "Character" },
          games: { content: "Games" },
          portrait: { content: "Portrait" },
          source: { content: "Source" },
          updated: { content: "Updated" },
        }}
        onRowClick={(index) =>
          router.push(getEditorHref(characters[index]._id))
        }
        rows={characters.map((character) => ({
          character: {
            sortingValue: character.name,
            content: (
              <div className={styles.who}>
                <CharacterPortrait
                  character={character}
                  sizes="40px"
                  className={styles.who__portrait}
                />
                <div>
                  <b>{character.name}</b>
                  {!!character.akas?.length && (
                    <span>{character.akas.slice(0, 2).join(", ")}</span>
                  )}
                </div>
              </div>
            ),
          },
          games: {
            sortingValue: character.gameIds?.length ?? 0,
            content: String(character.gameIds?.length ?? 0),
          },
          portrait: {
            sortingValue: character.mugShot ? 1 : 0,
            content: character.mugShot ? (
              "Yes"
            ) : (
              <span className={styles.muted}>Missing</span>
            ),
          },
          source: {
            sortingValue: getCharacterSource(character),
            content: (
              <Badge tone="muted">{getCharacterSource(character)}</Badge>
            ),
          },
          updated: {
            sortingValue: character.updatedAt ?? "",
            content: (
              <span className={styles.muted}>
                {character.updatedAt
                  ? commonUtils.formatDate(character.updatedAt)
                  : "—"}
              </span>
            ),
          },
        }))}
      />

      <Pagination
        take={TAKE}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isDisabled={isFetching}
      />
    </div>
  );
};
