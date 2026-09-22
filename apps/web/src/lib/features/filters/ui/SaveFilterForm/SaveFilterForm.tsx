import { FC, useState } from "react";
import styles from "./SaveFilterForm.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Input } from "@/src/lib/shared/ui/Input";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useAddUserFilterMutation } from "@/src/lib/entities/user/api/user.mutations";
import { getFiltersForQuery } from "@/src/lib/shared/utils/filters.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { modal } from "@/src/lib/shared/ui/Modal";
import { IGetGamesRequest } from "@mooncellar/schemas";

export const SaveFilterForm: FC<{
  filters: IGetGamesRequest;
}> = ({ filters }) => {
  const { profile } = useAuthStore();
  const [name, setName] = useState("");
  const { mutate: addFilter, isPending } = useAddUserFilterMutation();

  const submitHandler = () =>
    !!profile &&
    addFilter(
      {
        userId: profile._id,
        filter: { name, filter: getFiltersForQuery(filters) },
      },
      {
        onSuccess: () => {
          toast.success({ description: "Filter was successfully saved!" });
          modal.close();
        },
      }
    );

  return (
    <Box classNameContent={styles.form}>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submitHandler()}
        placeholder="Enter filter name..."
      />
      <Button
        color={ButtonColor.ACCENT}
        disabled={!name || isPending}
        onClick={() => submitHandler()}
      >
        Save
      </Button>
    </Box>
  );
};
