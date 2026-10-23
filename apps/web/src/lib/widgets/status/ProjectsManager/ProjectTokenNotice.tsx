import { FC } from "react";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { TextField } from "@/src/lib/shared/ui/Fields";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./ProjectsManager.module.scss";

interface IProjectTokenNoticeProps {
  slug: string;
  token: string;
}

export const ProjectTokenNotice: FC<IProjectTokenNoticeProps> = ({
  slug,
  token,
}) => {
  const copy = () =>
    navigator.clipboard
      .writeText(token)
      .then(() => toast.success({ description: "Token copied" }))
      .catch(() =>
        toast.error({ description: "Select the token and copy it by hand" })
      );

  return (
    <div className={styles.token}>
      <p className={styles.hint}>
        Copy it now: it is not shown again. The project uploads with{" "}
        <code className={styles.code}>
          PUT /projects/{slug}/data/&lt;block&gt;
        </code>{" "}
        and{" "}
        <code className={styles.code}>Authorization: Bearer &lt;token&gt;</code>
        .
      </p>
      <TextField
        label="Token"
        isLabelHidden
        value={token}
        readOnly
        onFocus={(event) => event.currentTarget.select()}
        onChange={() => undefined}
        action={
          <Button color={ButtonColor.DEFAULT} onClick={copy}>
            Copy
          </Button>
        }
      />
    </div>
  );
};
