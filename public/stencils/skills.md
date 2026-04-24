# public/stencils — Device Icons

## Layout

- `netweave/` — original, MIT-licensed stylised SVGs that ship with the
  project. Used by default.
- `cisco-official/` — reserved path for the **Cisco official** network
  topology icons if a future maintainer chooses to bundle them. Read
  `LICENSE-stencils.md` at the repo root before adding anything here.

## Design guidelines for the `netweave/` set

- **Square**, `viewBox="0 0 96 96"`, no intrinsic width/height — the
  component sets the render size.
- **No hard-coded text colours** for anything other than the icon body;
  device hostnames are rendered by React, not by the SVG.
- Keep the visual language consistent: gradient fill, thin 2-px stroke for
  outlines, thicker 2.5–3-px strokes for internal motifs, white details on
  a coloured body. Pick a distinct hue family per device type.

## Adding a stencil

1. Draw the SVG with the guidelines above. Keep it under ~1 KB.
2. Save as `public/stencils/netweave/<kebab-name>.svg`.
3. Register it:
   - Add the key to `DeviceType` in `src/lib/yaml/schema.ts`.
   - Add the row to `STENCILS` in `src/lib/stencils/manifest.ts`.
4. (Optional) Teach the ContainerLab `kind` mapper in `src/lib/yaml/parse.ts`
   so `.clab.yaml` files pick up the new icon automatically.

## Using Cisco's official icons

Cisco publishes a network topology icon pack. It is generally allowed for
use in diagrams, but **redistribution in a software project may require
permission**. If you want to ship them:

1. Download the current pack from Cisco Brand Center.
2. Place the SVGs under `public/stencils/cisco-official/`.
3. Add an attribution block to `LICENSE-stencils.md`.
4. Update `STENCILS` in `src/lib/stencils/manifest.ts` to point at the new
   paths, or introduce a user toggle that switches between the two packs.
