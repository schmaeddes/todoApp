# Todo App

A markdown-backed todo app with projects, scheduling, and settings.

## Desktop app (Electron)

### Run

```bash
npm install
npm run dev      # development (Vite + hot reload)
npm run start    # production (from dist/)
```

On restricted Linux during development (sandbox / shared-memory errors):

```bash
npm run dev:linux
npm run start:linux   # production build from dist/
```

Packaged Linux AppImages use a launcher wrapper with `ELECTRON_NO_SANDBOX=1` so they start from the file manager or terminal without extra flags. Rebuild with `npm run build:linux` after pulling changes.

### Package executable

```bash
npm run build          # current OS
npm run build:linux    # Linux AppImage
npm run build:win      # Windows portable .exe
npm run build:mac      # macOS .dmg
```

Packaged Linux output in `release/`:

- `todo-app-1.0.0.AppImage` — main build (patched for Linux sandbox restrictions)
- `run-todo-app.sh` — fallback launcher if double-click still fails: `./run-todo-app.sh`

Rebuild with `npm run build:linux` after pulling changes. Do not use old `Todo App-*.AppImage` files.

**Windows from Linux:** `npm run build:win` works without Wine (build only — you don't run the `.exe` on Linux). The portable `.exe` is produced in `release/`. File-icon metadata is skipped on cross-builds; for a custom `.exe` icon, run `npm run build:win` on Windows instead.

App icon: white inbox on the default app blue (`build/icon.svg` → run `npm run build:icons` to regenerate).

### Data

Default data location:

- **Linux:** `~/.config/todo-app/data/`
- **macOS:** `~/Library/Application Support/todo-app/data/`
- **Windows:** `%APPDATA%/todo-app/data/`

Files: `todos.md`, `config.yaml`

Override with `DATA_DIR`:

```bash
# Linux / macOS
DATA_DIR=/path/to/your/data npm run dev

# Windows (cmd)
set DATA_DIR=C:\path\to\your\data && npm run dev
```

## Web app (browser)

```bash
npm run dev:web    # frontend :5173 + API :3001
npm run start:web  # production API server
```

Without `DATA_DIR`, data files are stored in the project root (`todos.md`, `config.yaml`).

```bash
export DATA_DIR=/path/to/your/data
npm run dev:web
```
