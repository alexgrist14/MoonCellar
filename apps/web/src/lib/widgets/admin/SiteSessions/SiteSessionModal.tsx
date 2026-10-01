import { FC, useState } from "react";
import { ISiteSession } from "@mooncellar/schemas";
import {
  useDeleteSiteSessionMutation,
  useSaveSiteSessionMutation,
  useTestSiteSessionMutation,
} from "@/src/lib/entities/site-session/api";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { TextField, TextareaField } from "@/src/lib/shared/ui/Fields";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { modal } from "@/src/lib/shared/ui/Modal";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./SiteSessions.module.scss";

const DELETE_MODAL_ID = "delete-site-session";

interface ISiteSessionModalProps {
  session?: ISiteSession;
  onClose: () => void;
}

export const SiteSessionModal: FC<ISiteSessionModalProps> = ({
  session,
  onClose,
}) => {
  const [domain, setDomain] = useState(session?.domain ?? "");
  const [cookie, setCookie] = useState("");
  const [userAgent, setUserAgent] = useState(session?.userAgent ?? "");
  const [referer, setReferer] = useState(session?.referer ?? "");

  const { mutate: save, isPending: isSaving } = useSaveSiteSessionMutation();
  const { mutateAsync: remove, isPending: isDeleting } =
    useDeleteSiteSessionMutation();
  const {
    mutate: test,
    data: testResult,
    isPending: isTesting,
  } = useTestSiteSessionMutation();

  const handleSave = () =>
    save(
      {
        id: session?._id,
        dto: {
          domain,
          ...(cookie.trim() && { cookie: cookie.trim() }),
          userAgent: userAgent.trim() || null,
          referer: referer.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success({ description: `${domain} saved` });
          onClose();
        },
      }
    );

  const handleDelete = (target: ISiteSession) =>
    modal.open(
      <ConfirmModal
        title="Delete site"
        message={`Delete the stored session for ${target.domain}?`}
        onCancel={() => modal.close(DELETE_MODAL_ID)}
        onConfirm={async () => {
          await remove(target._id);
          modal.close(DELETE_MODAL_ID);
          toast.success({ description: `${target.domain} deleted` });
          onClose();
        }}
      />,
      { id: DELETE_MODAL_ID }
    );

  return (
    <Box
      title={session ? session.domain : "Add site"}
      isTitleStart
      onClose={onClose}
      isWithScrollBar
      wrapperStyle={{ width: "var(--site-sessions-modal-width)" }}
      contentStyle={{ padding: "var(--padding-x5)" }}
    >
      <div className={styles.form}>
        <p className={styles.hint}>
          Drafts, portrait search and image copies send these headers to this
          domain and its subdomains, never to other sites. Requests made for
          user requests never use them.
        </p>
        <TextField
          label="Domain (e.g. f95zone.to)"
          value={domain}
          onChange={setDomain}
        />
        <TextareaField
          label={
            session?.hasCookie
              ? "Cookie (stored; leave empty to keep it)"
              : "Cookie (the Cookie request header, a cookie extension export or cookies.txt)"
          }
          value={cookie}
          onChange={setCookie}
        />
        <TextField
          label="User-Agent (optional, the browser the cookie came from)"
          value={userAgent}
          onChange={setUserAgent}
        />
        <TextField
          label="Referer (optional)"
          value={referer}
          onChange={setReferer}
        />
        {testResult && (
          <p className={testResult.ok ? styles.hint : styles.error}>
            {testResult.ok ? "Opened: " : "Failed: "}
            {testResult.message}
          </p>
        )}
        <div className={styles.actions}>
          {session && (
            <>
              <Button
                color={ButtonColor.RED}
                disabled={isDeleting}
                onClick={() => handleDelete(session)}
              >
                Delete
              </Button>
              <Button
                color={ButtonColor.DEFAULT}
                disabled={isTesting}
                onClick={() => test(session._id)}
              >
                {isTesting ? "Testing…" : "Test"}
              </Button>
            </>
          )}
          <Button
            color={ButtonColor.ACCENT}
            disabled={isSaving || !domain.trim()}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </Box>
  );
};
