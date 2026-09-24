"use client";

import { FC, useState } from "react";
import { useDebounce } from "use-debounce";
import { ICharacterResponse, ICharacterSource } from "@mooncellar/schemas";
import { useAdminCharactersQuery } from "@/src/lib/entities/character/api";
import { CharacterPortrait } from "@/src/lib/entities/character/ui/CharacterPortrait";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { CharacterEditor } from "./CharacterEditor";
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
  const [selected, setSelected] = useState<ICharacterResponse | "new">();

  const { data, isLoading, isFetching } = useAdminCharactersQuery({
    search: debouncedSearch || undefined,
    source,
    page,
    take: TAKE,
  });

  const characters = data?.results ?? [];
  const selectedId = selected === "new" ? undefined : selected?._id;

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
          contents={SOURCES.map((item) => ({
            tabName: item ? (item === "manual" ? "Manual" : item.toUpperCase()) : "All",
            onTabClick: () => {
              setSource(item);
              setPage(1);
            },
          }))}
        />
        <Button color={ButtonColor.ACCENT} onClick={() => setSelected("new")}>
          New character
        </Button>
      </div>

      {!!selected && (
        <CharacterEditor
          key={selectedId ?? "new"}
          character={selected === "new" ? undefined : selected}
          onSaved={setSelected}
          onClose={() => setSelected(undefined)}
        />
      )}

      {isLoading ? (
        <div className={styles.loading}>
          <Loader />
        </div>
      ) : (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Character</th>
                <th>Games</th>
                <th>Portrait</th>
                <th>Source</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((character) => (
                <tr
                  key={character._id}
                  aria-selected={character._id === selectedId}
                  tabIndex={0}
                  onClick={() => setSelected(character)}
                  onKeyDown={(event) =>
                    event.key === "Enter" && setSelected(character)
                  }
                >
                  <td>
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
                  </td>
                  <td>{character.gameIds?.length ?? 0}</td>
                  <td className={character.mugShot ? undefined : styles.muted}>
                    {character.mugShot ? "Yes" : "Missing"}
                  </td>
                  <td>
                    <span className={styles.source}>
                      {getCharacterSource(character)}
                    </span>
                  </td>
                  <td className={styles.muted}>
                    {character.updatedAt
                      ? commonUtils.formatDate(character.updatedAt)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!characters.length && (
            <p className={styles.muted}>No characters match.</p>
          )}
        </div>
      )}

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
