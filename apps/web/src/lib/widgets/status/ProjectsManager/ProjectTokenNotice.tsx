import { FC } from "react";
import { IProjectToken } from "@mooncellar/schemas";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { TextField } from "@/src/lib/shared/ui/Fields";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./ProjectsManager.module.scss";

interface IProjectTokenNoticeProps {
  token: IProjectToken;
  onClose: () => void;
}

export const ProjectTokenNotice: FC<IProjectTokenNoticeProps> = ({
  token,
  onClose,
}) => {
  const copy = () =>
    navigator.clipboard
      .writeText(token.token)
      .then(() => toast.success({ description: "Token copied" }))
      .catch(() => toast.error({ description: "Copy the token by hand" }));

  return (
    <Box
      title={`Upload token for ${token.project.name}`}
      isTitleStart
      onClose={onClose}
    >
      <div className={styles.token}>
        <p className={styles.hint}>
          Copy it now: it is not shown again. Keep it in the project&apos;s CI
          secret or in a file outside the repository. The project uploads with{" "}
          <code className={styles.code}>
            PUT /projects/{token.project.slug}/data/&lt;block&gt;
          </code>{" "}
          and{" "}
          <code className={styles.code}>
            Authorization: Bearer &lt;token&gt;
          </code>
          .
        </p>
        <TextField
          label="Token"
          isLabelHidden
          value={token.token}
          readOnly
          onChange={() => undefined}
          action={
            <Button color={ButtonColor.DEFAULT} onClick={copy}>
              Copy
            </Button>
          }
        />
      </div>
    </Box>
  );
};
