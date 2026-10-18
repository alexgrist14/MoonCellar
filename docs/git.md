# Git server

Private repositories that cannot live on a public forge are plain Git over SSH on the production
host — no web UI, no CI, almost no memory. It replaced the self-hosted GitLab (2026-10-18). It is
set up by hand on the host, not by `infra/`.

## How it is wired

- **Access**: user `git` with home `/srv/git` and login shell `git-shell`, so a key can only run
  Git. Clone URLs look like `git@mooncellar.space:<repo>.git` (the host's own sshd, port 22).
- **Keys**: `/srv/git/.ssh/authorized_keys`, one line per key with the `restrict` prefix (no
  port forwarding, no terminal): `restrict ssh-ed25519 AAAA… <name>-<n>`. Adding or removing a
  person is editing this file (`sudo -e /srv/git/.ssh/authorized_keys`).
- **Repositories**: bare, under `/srv/git` — today `medecomp.git`. Every
  ref update is logged (`core.logAllRefUpdates always`), so an overwritten ref can be restored
  from the reflog.
- **Hooks**: `medecomp.git/hooks/medecomp-hook` (linked as `pre-receive` and `post-receive`)
  runs `tools/server_hook.py` taken from the repository's own `main`, so the rules change with
  normal work. It needs `python3` (3.11 on Debian 12) and `flock` on the host. `pre-receive`
  protects `main`; `post-receive` writes a status page to `/srv/git/status/medecomp.md`.
  Emergency switch: `sudo touch /srv/git/hooks-off` disables the hooks, removing the file
  enables them again.

## Backups

Everything is in `/srv/git` (repositories, hooks, keys, status pages): copying that folder is the
whole backup.
