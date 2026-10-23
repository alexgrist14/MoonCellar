import { FC, useMemo } from "react";
import { IArticleArchive, IGetArticlesQuery } from "@mooncellar/schemas";
import { formatArchiveMonth } from "@/src/lib/entities/article/model";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { pushNewsQuery } from "@/src/lib/features/news/model/news-query.utils";

interface INewsArchiveSelectProps {
  archive: IArticleArchive;
  params: IGetArticlesQuery;
  className?: string;
}

interface IArchiveOption {
  label: string;
  year?: number;
  month?: number;
}

export const NewsArchiveSelect: FC<INewsArchiveSelectProps> = ({
  archive,
  params,
  className,
}) => {
  const options = useMemo<IArchiveOption[]>(
    () => [
      { label: "All time" },
      ...archive.years.flatMap((entry) => [
        { label: String(entry.year), year: entry.year },
        ...entry.months.map(({ month }) => ({
          label: `${formatArchiveMonth(month)} ${entry.year}`,
          year: entry.year,
          month,
        })),
      ]),
    ],
    [archive]
  );

  const current = options.find(
    (option) => option.year === params.year && option.month === params.month
  );

  return (
    <Dropdown
      className={className}
      title="Archive"
      isThroughPortal
      isWithSearch={false}
      list={options.map((option) => option.label)}
      overwriteValue={current?.label ?? options[0].label}
      getIndex={(index) => {
        const option = options[index] ?? options[0];

        pushNewsQuery({
          ...params,
          year: option.year,
          month: option.month,
          page: 1,
        });
      }}
    />
  );
};
