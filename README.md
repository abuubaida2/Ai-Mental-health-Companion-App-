# AI Mental Health Companion

Comprehensive companion app for mental health analysis, providing text and audio sentiment/emotion analysis, a backend API, and a cross-platform mobile client.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
  - [Backend](#backend)
  - [Machine Learning / Models](#machine-learning--models)
  - [Mobile App (Expo / React Native)](#mobile-app-expo--react-native)
- [Running the System](#running-the-system)
  - [Start Backend](#start-backend)
  - [Run ML Scripts](#run-ml-scripts)
  - [Run Mobile App](#run-mobile-app)
- [Testing & Smoke Tests](#testing--smoke-tests)
- [Development Workflow](#development-workflow)
- [Data, Privacy & Safety](#data-privacy--safety)
- [Contributing](#contributing)
- [License & Authors](#license--authors)
- [Troubleshooting](#troubleshooting)

## Project Overview

This repository contains an AI-powered mental health companion app comprised of:
- a Python FastAPI (or similar) backend in `backend/` that exposes analysis endpoints,
- ML model training & inference code in `ml/` and `backend/models/`, and
- a cross-platform mobile client in `mobile/` built with Expo/React Native.

The app analyzes text and audio to detect emotions and sentiment and returns scores and metadata that the mobile client uses to present feedback, history, and guidance.

## Features

- Text emotion classification and sentiment scoring
- Audio feature extraction and emotion recognition
- Multimodal model support (text + audio)
- Simple REST API for inference
- Mobile UI with recording, history and results
- Training scripts and evaluation utilities for experimentation

## Architecture

High-level components:

- Backend API: [backend/app/main.py](backend/app/main.py) — serves model inference endpoints and storage utilities.
- Models: [backend/models/](backend/models/) and `ml/` — training, evaluation, loader utilities.
- Mobile client: [mobile/](mobile/) — Expo app that records audio, sends requests to the backend, and displays results.
- Persistence: lightweight local storage utility at [backend/utils/storage.py](backend/utils/storage.py) used for session/history.

Flow (local dev): mobile client records audio or collects text → POST to backend inference endpoint → backend runs models in `backend/models/*` or calls model server → response returned to mobile UI and persisted in storage.

## Repository Layout

- `backend/` — server code and model wrappers
  - `backend/app/main.py` — entrypoint for the backend API
  - `backend/models/` — model code (`audio_model.py`, `text_model.py`, `multimodal.py`, `loader.py`)
  - `backend/utils/storage.py` — simple storage helpers
- `ml/` — training, preprocessing and evaluation scripts
- `mobile/` — Expo/React Native app and screens
- `requirements.txt` — Python dependencies

## Prerequisites

- Python 3.9+ (3.10 or later recommended)
- Node.js + npm (for Expo mobile client)
- expo-cli (if running mobile app locally with Expo)

## Local Setup

1. Create and activate a Python virtual environment:

```bash
python -m venv .venv
source .venv/Scripts/activate   # on Windows PowerShell: .\\.venv\\Scripts\\Activate.ps1
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Mobile setup (optional):

```bash
npm install -g expo-cli   # optional globally
cd mobile
npm install
```

## Backend

Start the API (development):

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Notes:
- The server entrypoint is `backend/app/main.py`.
- Update configuration (ports, model paths) inside `backend/app/main.py` or a config file if present.

## Machine Learning / Models

- Data prep, training and evaluation scripts are located in `ml/` (e.g. `train_text.py`, `train_audio.py`).
- Model code and inference logic live in `backend/models/` — inspect `loader.py` for how models are loaded.

Quick training example (CPU/GPU dependent):

```bash
cd ml
python train_text.py --config configs/text_config.yaml
```

Replace the command above with the appropriate script and flags used in your project.

## Mobile App (Expo / React Native)

To run the mobile client locally:

```bash
cd mobile
expo start
```

Open the app on a device using Expo Go or an emulator.

The mobile screens are under `mobile/screens/` and services under `mobile/services/AnalysisService.js` which handles API calls to the backend.

## Running the System End-to-End

1. Start the backend API (`uvicorn` command above).
2. Start the mobile app via `expo start`.
3. From the mobile UI, record audio or enter text and send it to the backend.

## Testing & Smoke Tests

- There is a quick smoke test script: `ml/smoke_test_backend.py` — run it to check basic endpoints and model responses.

```bash
python ml/smoke_test_backend.py
```

## Development Workflow

- Use feature branches named `feat/<short-desc>` or `fix/<short-desc>`.
- Run unit tests locally (if present) and linting before opening PRs.
- Keep `requirements.txt` updated when adding Python packages.

## Data, Privacy & Safety

This project handles sensitive content (mental health text/audio). Follow these guidelines:

- Do not collect or store personally identifiable information (PII) unless explicitly required and consented.
- Store and transmit data securely (HTTPS for API calls, encrypted storage for persisted sensitive data).
- Add clear user warnings and consent flows in the mobile UI before recording or saving data.
- Maintain a privacy policy if this app is distributed.

Ethical considerations:
- Models can be wrong — ensure UI shows confidence scores and encourages seeking professional help for severe cases.
- Avoid deterministic or prescriptive language in feedback; present results as suggestions.

## Contributing

1. Fork the repository and create a feature branch.
2. Run tests and linters locally.
3. Open a pull request with a clear description and testing steps.

## License & Authors

Include a license file (e.g., `LICENSE`) if you intend to open-source this project. If none is present, add one that matches your intentions (MIT, Apache-2.0, etc.).

**Maintainer / Author:**
- abuubaida2 — contact via GitHub profile.

## Troubleshooting

- Git push/auth: If push prompts for browser auth, complete OAuth flow in the browser. For personal access tokens, configure Git credentials.
- Model errors: check model path configuration in `backend/models/loader.py` and ensure model artifacts exist in `backend/models/` or `models/`.
- Mobile client CORS: ensure the backend allows requests from the device/emulator (check host binding and firewall rules).

## Next Steps & Recommendations

- Add a `LICENSE` file and a short `CONTRIBUTING.md`.
- Add CI (GitHub Actions) to run tests and linting on PRs.
- Add automated model validation and size checks before deployment.

---

If you want, I can:
- commit this README and push it to `origin/main`,
- add a `CONTRIBUTING.md` and `LICENSE`, or
- scaffold a basic GitHub Actions CI pipeline.
