# Browser preview

Live entry: https://owanden.github.io/demos/office-hours-queue/

This is an interface demonstration with synthetic tab-local state, not a hosted queue service. It reuses App, student/TA dialogs and the normal styling. A separate Vite entry aliases API imports to preview/api.ts at build time. No backend or provider is contacted. Simulated roles do not demonstrate authentication; use the full-stack local demo and backend checks for that boundary.

## Build and inspect

From the repository root, after frozen dependency installation:

```sh
pnpm --filter oh-kiosk-frontend test:browser-preview
pnpm --filter oh-kiosk-frontend build:browser-preview
python -m http.server 8877 --bind 127.0.0.1 --directory frontend/dist-preview
```

Open http://127.0.0.1:8877/. The static output uses relative asset paths so it can be hosted below a directory on the existing portfolio Pages site.

1. Start with two sample students and one TA in Administrator view. Serve the first student.
2. Switch to Guest. Management controls disappear; add a fixed synthetic student through Add New Student. Phone/topic fields are read-only and notification consent is disabled.
3. Switch back to Administrator; add or remove a sample TA. TA name is also fixed. No names, phone numbers, topics or credentials need to be entered.
4. Reset preview or reload to restore the starting state. Another tab starts independently. No preview session or queue state is written to local storage.

The separate entry starts directly in a synthetic room, never displaying a sign-in form. The original app entry keeps its existing login and authenticated API client. Browser-preview props are not selected by a URL or server request. The build's module check fails if the real src/api.ts or Axios appears in preview chunks. HTML uses connect-src 'none' and form-action 'none'; linked static assets remain local to the page, and source/documentation links navigate normally.

The sample adapter is intentionally not a copy of backend semantics: it does not perform hashing, token verification, room authorization, notification delivery, distributed coordination or durability. Existing backend tests exercise the actual API separately. The preview is for inspecting interface interactions without setup, not evidence for those guarantees, load capacity or production use.

The portfolio repository records the source commit and hashes of the copied build in demos/office-hours-queue/source.json. Regenerate from the recorded source when updating the artifact; publish only the static HTML, CSS, JavaScript and provenance file, never environment files or private workspace material.
