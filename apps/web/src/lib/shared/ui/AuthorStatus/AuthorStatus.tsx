import { FC } from "react";
import { IPlaythrough } from "@mooncellar/schemas";
import { StatusBadge, StatusDetails } from "../StatusBadge";

interface IAuthorStatusProps {
  category: IPlaythrough["category"];
  time?: number;
  isMastered?: boolean;
}

export const AuthorStatus: FC<IAuthorStatusProps> = ({
  category,
  time,
  isMastered,
}) => (
  <>
    <StatusBadge status={category} />
    {isMastered && <StatusBadge status="mastered" />}
    <StatusDetails items={[!!time && `${time} h`]} />
  </>
);
