import { Header } from '@/components/Layout/Header';

export default function ContainerLabDoc() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 overflow-auto px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">ContainerLab support</h1>
        <p className="mt-2 text-sm muted">
          Drop any <code>*.clab.yaml</code> in the editor. NetWeave detects the{' '}
          <code>topology:</code> root key and parses <code>nodes</code> / <code>links</code> into
          the same internal graph model used for native topologies, so all rendering, layout and
          export features apply identically.
        </p>

        <h2 className="mt-6 text-lg font-semibold">Kind → stencil mapping</h2>
        <p className="mt-1 text-sm muted">
          NetWeave uses the ContainerLab <code>kind</code> (and, as a fallback, the image string)
          to pick a stencil. The current mapping:
        </p>
        <ul className="mt-2 grid grid-cols-1 gap-0.5 text-xs font-mono sm:grid-cols-2">
          <li>nokia_srlinux / srl → l3-switch</li>
          <li>arista_ceos / ceos → l3-switch</li>
          <li>vr-veos → l3-switch</li>
          <li>juniper_crpd / crpd → router</li>
          <li>vr-xrv / vr-csr / vr-vmx → router</li>
          <li>vr-vsrx → firewall</li>
          <li>paloalto_panos → firewall</li>
          <li>checkpoint_cloudguard → firewall</li>
          <li>f5_tmos → load-balancer</li>
          <li>linux / host → server</li>
          <li>bridge / ovs-bridge → l2-switch</li>
        </ul>
        <p className="mt-2 text-sm muted">
          Anything unrecognised falls back to <code>router</code>. PRs welcome for additional
          kinds — the mapping lives in <code>src/lib/yaml/parse.ts</code>.
        </p>

        <h2 className="mt-6 text-lg font-semibold">Link parsing</h2>
        <p className="mt-1 text-sm muted">
          ContainerLab links have the form <code>{'["nodeA:ifA", "nodeB:ifB"]'}</code>. NetWeave
          splits on <code>:</code>, seeds the referenced interfaces on each node (so the canvas
          has somewhere to attach handles), and labels the edge with the interface names.
        </p>

        <h2 className="mt-6 text-lg font-semibold">What is not used</h2>
        <p className="mt-1 text-sm muted">
          <code>topology.kinds</code> and <code>topology.defaults</code> are parsed but not
          rendered — they don't affect the diagram. Management IPs (<code>mgmt_ipv4</code>,{' '}
          <code>mgmt_ipv6</code>) are surfaced on the node as a <code>mgmt0</code> interface so
          you can see them at a glance.
        </p>
      </main>
    </div>
  );
}
