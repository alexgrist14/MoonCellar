# GitLab

A self-hosted GitLab CE at **https://gitlab.mooncellar.space** for private projects that cannot
live on a public forge. It is the `gitlab` service of `infra/docker-compose.prod.yml`, deployed
with the rest of the infra on a push to `main` that touches `infra/`.

## How it is wired

- **Web**: the container serves plain HTTP on `127.0.0.1:8929`; the host nginx terminates TLS
  for `gitlab.mooncellar.space` (`infra/nginx/mooncellar.conf`) and proxies to it. The
  certificate is the shared `mooncellar.space` one: the deploy step adds every `server_name`
  of the nginx config to it with certbot, so a new subdomain needs only its DNS record.
- **Git over SSH**: port **2222** on the host (the host's own sshd keeps 22). Clone URLs look
  like `ssh://git@gitlab.mooncellar.space:2222/<group>/<project>.git`. The port must be open in
  the host firewall.
- **Data**: named Docker volumes `gitlab_config` (`/etc/gitlab`, including the secrets file),
  `gitlab_logs` and `gitlab_data` (`/var/opt/gitlab`: repositories, database, uploads). They
  survive `docker compose up -d` and image upgrades; `docker compose down -v` deletes them.
- **No new secrets**: everything is set in `GITLAB_OMNIBUS_CONFIG` in the compose file, so
  `HOST_ENV_INFRA` does not change.
- **Memory**: GitLab runs in GitLab's memory-constrained mode (single Puma process, 10 Sidekiq
  threads, its own Prometheus off, registry, Pages and KAS off) and is capped at
  `mem_limit: 4g`, so a spike stays inside the container instead of pushing MongoDB and the
  apps out. The host needs about 4 GB free for it.
- **CI**: no runner runs on the production host — builds would compete with the apps for CPU.
  Runners are registered from the machines that build (see below).

## First start

The first `up -d` takes several minutes while GitLab initialises its database. Then:

1. Read the generated root password on the host — it is deleted after 24 hours, and must never
   be pasted into chats or issues:

   ```sh
   docker exec gitlab cat /etc/gitlab/initial_root_password
   ```

2. Sign in as `root` at https://gitlab.mooncellar.space, change the password, and disable open
   sign-up (Admin → Settings → General → Sign-up restrictions) so only invited people get
   accounts.
3. Create user accounts, then the projects as **private**.

## Runners

Register a runner on the build machine (not the production host):

```sh
gitlab-runner register --url https://gitlab.mooncellar.space --token <runner token>
```

The runner token comes from the project's Settings → CI/CD → Runners → *New project runner*.

## Upgrades and backups

- Upgrade by bumping the pinned image tag in the compose file. Follow GitLab's upgrade path:
  never skip a required stop between major versions.
- Back up with `docker exec gitlab gitlab-backup create`; the archive lands in
  `/var/opt/gitlab/backups` inside `gitlab_data`. The secrets file `/etc/gitlab/gitlab-secrets.json`
  (in `gitlab_config`) is not part of that archive and must be kept next to it — without it a
  restored backup cannot decrypt CI variables or two-factor settings.
