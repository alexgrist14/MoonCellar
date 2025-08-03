import { Dispatch, FC, SetStateAction, useState } from "react";
import styles from "./SaveFilterForm.module.scss";
import { WrapperTemplate } from "../WrapperTemplate";
import { Input } from "../Input";
import { Button } from "../Button";
import { useAuthStore } from "../../store/auth.store";
import { userAPI } from "../../api";
import { getFiltersForQuery } from "../../utils/filters";
import { toast } from "../../utils/toast";
import { modal } from "../Modal";
import { IUserFilter } from "../../types/user.type";
import { IGetGamesRequest } from "../../lib/schemas/games.schema";

export const SaveFilterForm: FC<{
  filters: IGetGamesRequest;
  setSavedFilters: Dispatch<SetStateAction<IUserFilter[] | undefined>>;
}> = ({ filters, setSavedFilters }) => {
  const { profile } = useAuthStore();
  const [name, setName] = useState("");

  const submitHandler = () =>
    !!profile &&
    userAPI
      .addFilter(profile._id, {
        name,
        filter: getFiltersForQuery(filters),
      })
      .then((res) => {
        setSavedFilters(res.data.filters);
        toast.success({ description: "Filter was successfully saved!" });
        modal.close();
      });

  return (
    <WrapperTemplate classNameContent={styles.form}>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submitHandler()}
        placeholder="Enter filter name..."
      />
      <Button color="accent" disabled={!name} onClick={() => submitHandler()}>
        Save
      </Button>
    </WrapperTemplate>
  );
};
