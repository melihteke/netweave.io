# NetWeave

**Turn network topology YAML into modern, interactive diagrams — in your
browser.**

NetWeave is a static, client-side web application that takes a network
topology described in YAML (either the native **NetWeave v1** schema or a
**ContainerLab** lab file) and renders it as an editable diagram with
Cisco-style stencils, interface-aware links, protocol overlays (OSPF areas,
BGP AS groups, IS-IS levels), live YAML validation, and export to
**PNG / SVG / PDF / HTML**.

- **Live site:** <https://melihteke.github.io/netweave.io/>
- **Repo:** <https://github.com/melihteke/netweave.io>
- **Author:** [Melih Teke](https://www.linkedin.com/in/melih-teke/) — Network
  Engineer
- **How it was built:** vibe-coded with **Claude Opus 4.7** via
  [Claude Code](https://www.anthropic.com/claude-code)

---

## Table of Contents

1. [What NetWeave Does](#what-netweave-does)
2. [Screenshot](#screenshot)
3. [Features](#features)
4. [Supported Catalog](#supported-catalog)
5. [NetWeave v1 Schema](#netweave-v1-schema)
6. [ContainerLab Support](#containerlab-support)
7. [Canvas Controls](#canvas-controls)
8. [Exporting Diagrams](#exporting-diagrams)
9. [Running Locally](#running-locally)
10. [Deployment](#deployment)
11. [Project Structure](#project-structure)
12. [Roadmap](#roadmap)
13. [License](#license)

---

## What NetWeave Does

Engineers share configs as YAML every day — Ansible, ContainerLab, NetBox
intent files, internal DSLs. What they do **not** share well is the resulting
picture: most topology diagrams are Visio screenshots, manually drawn and
immediately stale.

NetWeave flips that: you bring the YAML, it gives you the diagram, live. The
topology stays text-first (easy to diff, review, PR, search) and the rendering
stays one paste away. Because the whole app runs in the browser with no
backend, topology data never leaves your machine.

## Screenshot

A campus topology (`04-campus-l2-l3-svi.yaml`) rendered in **Logical** view
with an OSPF Area 0 overlay:

![NetWeave logical view screenshot](public/examples/screenshot-logical.png)

*(If the file isn't committed yet the link will 404 — use any of the shipped
examples to see the same effect.)*

## Features

### Two input formats
- **NetWeave v1** — compact native schema (devices, interfaces, links,
  protocols).
- **ContainerLab** — drop in any `*.clab.yaml` and it renders immediately.
  Node `kind` / `image` is mapped to the right stencil, link endpoints
  (`nodeA:ifA` / `nodeB:ifB`) are parsed and attached.

### Two views
- **Physical** — every interface is shown on the device card, every link
  attaches to its actual interface handle.
- **Logical** — L2 plumbing is collapsed, only L3-relevant interfaces
  (l3 / svi / loopback / subif) remain, parallel links between two devices
  are merged with a count badge, and protocol groupings are drawn as colour
  overlays behind the devices.

### Interactive canvas
- **Edge click → Link Details panel** — shows A-side and B-side device,
  interface name, IPv4 / IPv6, kind, LACP members, description.
- **Edge type picker** — Curved, Straight, Orthogonal, Rounded-orthogonal.
- **Layout direction** — Vertical (top → bottom) or Horizontal (left → right).
- **Edge colour** — per-link-type colouring or single-colour mode with a
  colour picker.
- **Group shape picker** — Rounded rectangle / Rectangle / Circle, with
  separate colour pickers for OSPF and BGP groups.
- **Drag & pan & zoom**, mini-map, dark / light theme.

### YAML editor
- **CodeMirror 6** with YAML syntax highlighting, line numbers, fold gutter,
  bracket matching, history.
- **Debounced live validation** — every 150 ms the document is parsed and
  Zod-validated. Errors surface in a panel directly under the editor; the
  canvas shows the last good render until the YAML becomes valid again.
- **File upload** — click "Upload file" and pick a `.yaml` / `.yml` /
  `.clab.yaml` from disk.
- **URL-driven examples** — `/?example=02-spine-leaf-bgp-evpn.yaml` hydrates
  the editor. The Examples gallery uses these links.

### Exports
The toolbar's Export group produces four formats, all **client-side** —
nothing leaves the browser:

| Format | How it's made | Use for |
|--------|---------------|---------|
| **PNG** | `html-to-image.toPng()` at 2× pixel ratio | Slack, email, tickets |
| **SVG** | `html-to-image.toSvg()` | Post-editing in Illustrator / Inkscape |
| **PDF** | PNG embedded in `jsPDF`, orientation auto-picked, metadata header | Printable report |
| **HTML** | Inline SVG + devices/links tables + print CSS, single file | Self-contained deliverable |

Each export carries the topology name, requester (if present in YAML),
timestamp, and device/link count.

## Supported Catalog

| Category | Supported values |
|----------|-----------------|
| **Device types** | `l2-switch`, `l3-switch`, `router`, `firewall`, `load-balancer`, `server`, `ap`, `wlc` |
| **Interface kinds** | `l2`, `l3`, `lacp`, `trunk`, `access`, `svi`, `loopback`, `subif` |
| **Link types** | `l2`, `l3`, `lacp`, `trunk`, `access` |
| **Protocols** | **OSPF** (process, router-id, areas + interface list), **IS-IS** (NET, level), **BGP** (ASN, router-id, neighbors) |
| **Addressing** | IPv4 and IPv6 per interface |
| **Input formats** | NetWeave v1, ContainerLab |
| **Exports** | PNG, SVG, PDF, self-contained HTML |

Adding a new device type is a two-file change: drop an SVG in
`public/stencils/netweave/` and register it in `src/lib/stencils/manifest.ts`.

## NetWeave v1 Schema

Minimal example — two routers sharing an OSPF area:

```yaml
apiVersion: netweave.io/v1
kind: Topology
metadata:
  name: two-router-ospf
  description: "Minimal OSPF backbone between two routers."
  requester:
    name: "Jane Doe"
    email: "jane@corp.net"
devices:
  - hostname: r1
    type: router
    interfaces:
      - { name: Lo0,   kind: loopback, ipv4: 10.0.0.1/32 }
      - { name: Gi0/0, kind: l3,       ipv4: 192.0.2.1/30 }
    protocols:
      ospf:
        process: 1
        router_id: 10.0.0.1
        areas:
          - { id: 0, interfaces: [Lo0, Gi0/0] }
  - hostname: r2
    type: router
    interfaces:
      - { name: Lo0,   kind: loopback, ipv4: 10.0.0.2/32 }
      - { name: Gi0/0, kind: l3,       ipv4: 192.0.2.2/30 }
    protocols:
      ospf:
        process: 1
        router_id: 10.0.0.2
        areas:
          - { id: 0, interfaces: [Lo0, Gi0/0] }
links:
  - a: { device: r1, interface: Gi0/0 }
    b: { device: r2, interface: Gi0/0 }
    type: l3
```

### Field reference

| Path | Required | Notes |
|------|:-:|-------|
| `apiVersion` | ✓ | Must be `netweave.io/v1`. |
| `kind` | ✓ | Must be `Topology`. |
| `metadata.name` | ✓ | Used as the diagram title and export filename. |
| `metadata.description` | – | Short free-text summary. |
| `metadata.requester.name` / `.email` | – | Surface in PDF/HTML exports. |
| `devices[].hostname` | ✓ | Unique within the document. |
| `devices[].type` | ✓ | Picks the stencil. |
| `devices[].role` / `.site` | – | Free-form labels shown on the node. |
| `devices[].interfaces[].name` | ✓ | Used as the link endpoint key. |
| `devices[].interfaces[].kind` | ✓ | One of the interface kinds. |
| `devices[].interfaces[].ipv4` / `.ipv6` | – | CIDR strings. |
| `devices[].interfaces[].members` | – | List of member ports for `lacp` kind. |
| `devices[].interfaces[].vlan` | – | Integer VLAN ID. |
| `devices[].interfaces[].description` | – | Optional prose. |
| `devices[].protocols.ospf` | – | `{ process, router_id, areas[] }`. |
| `devices[].protocols.isis` | – | `{ net, level }`. |
| `devices[].protocols.bgp` | – | `{ asn, router_id, neighbors[] }`. |
| `links[].a` / `.b` | ✓ | `{ device, interface }`. |
| `links[].type` | – | Defaults to `l3`. |
| `links[].description` | – | Shown in the Link Details panel. |

The full reference is also rendered at **/docs/schema/** on the deployed site.

## ContainerLab Support

Drop any `*.clab.yaml` file. NetWeave detects the `topology:` root key and
parses `nodes` / `links` into the same internal graph model used for native
topologies, so all rendering, layout, and export features apply identically.

**Kind → stencil mapping** (excerpt):

| CLAB kind | NetWeave type |
|-----------|---------------|
| `nokia_srlinux`, `srl`, `arista_ceos`, `ceos`, `vr-veos` | `l3-switch` |
| `juniper_crpd`, `crpd`, `vr-xrv`, `vr-csr`, `vr-vmx` | `router` |
| `vr-vsrx`, `paloalto_panos`, `checkpoint_cloudguard` | `firewall` |
| `f5_tmos` | `load-balancer` |
| `linux`, `host` | `server` |
| `bridge`, `ovs-bridge` | `l2-switch` |

Anything unrecognised falls back to `router`. The full mapping lives in
`src/lib/yaml/parse.ts` (`CLAB_KIND_TO_TYPE`).

## Canvas Controls

The toolbar between the editor and the canvas groups all visual settings:

- **Links** — Edge path style (Curved / Straight / Orthogonal / Rounded
  orthogonal) and layout direction (Vertical / Horizontal).
- **Colour** — Edge colour by link type, or a single colour with a picker.
- **Groups** — Overlay shape (Rounded rectangle / Rectangle / Circle) and
  separate colour pickers for OSPF area and BGP AS groupings. Groups only
  render in **Logical** view.
- **Export** — PNG / SVG / PDF / HTML buttons.

Clicking an edge opens the **Link Details** panel (top-right). It shows both
endpoints with device type/role, interface name, kind, IPv4/IPv6, LACP
members, and any description. Click the canvas background (or the × button)
to dismiss.

## Exporting Diagrams

See the [Exports](#exports) row of the features table. Notes:

- All exports respect the **current view** (Physical vs Logical) and the
  **current edge / group settings**. What you see is what you get.
- The minimap, controls, and attribution are filtered out of the capture.
- PDF and PNG are rasterised at 2× pixel density so they stay crisp at print
  size. For pixel-perfect vector editing downstream, export **SVG**.
- HTML export is a single self-contained document — the inline SVG + a
  hostname table + a link table + print CSS.

## Running Locally

Requires **Node.js 22** (`.nvmrc` is committed). The project uses `npm`.

```bash
# clone and enter the repo
git clone https://github.com/melihteke/netweave.io.git
cd netweave.io

# install and run
nvm use            # or: use any Node 22 runtime
npm install
npm run dev        # http://localhost:3000

# typecheck / static build
npm run typecheck
npm run build      # static export lands in ./out
```

Set `NEXT_PUBLIC_BASE_PATH=''` in the environment if you want to run a
production build locally under `http://localhost:3000/` rather than under the
configured repo path.

## Deployment

`.github/workflows/pages.yml` on push to `main`:

1. `actions/checkout@v4`
2. `actions/setup-node@v4` with Node 22
3. `npm install --no-audit --no-fund`
4. `npm run build` with `NODE_ENV=production`
5. `touch out/.nojekyll` (prevents GitHub Pages from running Jekyll)
6. `actions/upload-pages-artifact@v3` → `actions/deploy-pages@v4`

Enable Pages with **Settings → Pages → Source = GitHub Actions** and make sure
`main` is an allowed deployment branch for the `github-pages` environment
(**Settings → Environments → github-pages → Deployment branches**).

### basePath

`next.config.mjs` sets `basePath: '/netweave.io'` in production, so the Pages
URL is `https://<owner>.github.io/netweave.io/`. If the repository is renamed,
update this value (or override at build time with
`NEXT_PUBLIC_BASE_PATH=/your-repo-name`).

## Project Structure

```
src/
  app/                    # App Router pages: /, /docs, /docs/schema,
                          # /docs/containerlab, /docs/exporting,
                          # /examples, /about
  components/
    Canvas/               # React Flow wiring, toolbar, link details panel,
                          # custom device + group-overlay nodes,
                          # custom link edge (path-type dispatch)
    Editor/               # CodeMirror 6 YAML editor
    Layout/               # Header + ThemeProvider
  lib/
    canvasSettings.ts     # Toolbar state types, labels, defaults
    yaml/                 # Zod schema, format detector, parser/normaliser
    transform/            # toGraph (physical), toLogical, groups (OSPF/BGP)
    layout/               # elk.ts (default), dagre.ts (fallback)
    stencils/             # device-type → SVG path manifest
    export/               # png/svg/pdf/html export pipeline
    examples/starter.ts   # seed YAML loaded on first visit
  styles/globals.css      # Tailwind base + CSS custom properties
public/
  stencils/netweave/      # eight stylised, MIT-licensed SVG stencils
  examples/               # seven ready-to-load example topologies
  favicon.svg
skills.md                 # repo-wide maintainer guide
src/**/skills.md          # per-directory maintainer guides
```

Per-directory `skills.md` files document the conventions and extension points
for that area — useful for future maintainers, including AI assistants.

## Roadmap

- ✅ **Phase 1** — skeleton, schema, YAML editor, base canvas, GH Pages
  deployment.
- ✅ **Phase 2** — stencils, physical/logical views, ELK layout, examples,
  docs, dark mode.
- ✅ **Phase 3 (this release)** — edge-type/color/layout pickers, OSPF/BGP
  group overlays with shape pickers, Link Details panel, PNG/SVG/PDF/HTML
  export.
- ⏳ **Phase 4** — drag-and-drop node/edge editing written back to YAML,
  image upload to the canvas, onboarding tour, keyboard shortcuts.
- ⏳ **Phase 5** — shareable URL (gzip+base64 YAML in hash), YAML diff view,
  additional vendor stencils (official Cisco pack optional — see
  `LICENSE-stencils.md`).

## Contributing

PRs welcome. Please read the relevant `skills.md` before making changes:

- Adding a device type → `public/stencils/skills.md`
- Schema / protocol changes → `src/lib/yaml/skills.md`
- Canvas / edges / overlays → `src/components/Canvas/skills.md`
- Export formats → `src/lib/export/skills.md`

## License

[MIT](./LICENSE). Stencil licensing details in
[`LICENSE-stencils.md`](./LICENSE-stencils.md).

---

*NetWeave was built as a vibe-coding experiment with
[Claude Opus 4.7](https://www.anthropic.com/claude) via Claude Code by
[Melih Teke](https://www.linkedin.com/in/melih-teke/).*
