# Todo App

A markdown-backed todo app with projects, scheduling, and settings.

## Development

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

Without `DATA_DIR`, data files are stored in the project root:

- `todos.md` — tasks and projects
- `config.yaml` — app settings

## Data directory (`DATA_DIR`)

Set `DATA_DIR` to store data outside the application directory. This is the recommended setup for containers and production deployments.

```bash
export DATA_DIR=/path/to/your/data
npm run dev:server
```

The server creates the directory if needed and stores:

- `todos.md`
- `config.yaml`

## Docker

Build and run with a persistent data volume:

```bash
docker compose up --build
```

Open http://localhost:3001

**Note:** The Docker build uses the public [npm registry](https://registry.npmjs.org), not a private `.npmrc` mirror. If your `package-lock.json` was created behind a corporate registry, the Dockerfile rewrites those URLs automatically.

Data is stored in `./data` on the host:

```
./data/
  todos.md
  config.yaml
```

To use a different host folder, change the volume mount in `docker-compose.yml`:

```yaml
volumes:
  - /your/host/path:/data
```

The container sets `DATA_DIR=/data` by default.
