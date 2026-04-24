import { Header } from '@/components/Layout/Header';

export default function AboutPage() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 overflow-auto px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">About NetWeave</h1>
        <p className="mt-2 text-sm muted">
          NetWeave turns a network topology described in YAML into an interactive diagram, in the
          browser, with zero backend. You can share a YAML file the way engineers share code —
          and the reader gets a first-class visual rendering rather than a screenshot.
        </p>

        <h2 className="mt-6 text-lg font-semibold">Why YAML?</h2>
        <p className="mt-1 text-sm muted">
          YAML is the language of network automation: Ansible, ContainerLab, network configuration
          intent files. NetWeave meets engineers where they already are. If you already run a
          ContainerLab lab file, you can paste it unchanged.
        </p>

        <h2 className="mt-6 text-lg font-semibold">Why static?</h2>
        <p className="mt-1 text-sm muted">
          Diagrams are often built from sensitive topology data. NetWeave never sends your YAML
          anywhere — it's a single static site that runs entirely in your browser. No account, no
          tracking, no backend.
        </p>

        <h2 className="mt-6 text-lg font-semibold">Credits</h2>
        <p className="mt-1 text-sm muted">
          Built with <a className="accent underline" href="https://nextjs.org">Next.js</a>,{' '}
          <a className="accent underline" href="https://reactflow.dev">React Flow</a>,{' '}
          <a className="accent underline" href="https://codemirror.net">CodeMirror 6</a>,{' '}
          <a className="accent underline" href="https://tailwindcss.com">Tailwind CSS</a> and{' '}
          <a className="accent underline" href="https://github.com/kieler/elkjs">ELK</a>.
        </p>
      </main>
    </div>
  );
}
