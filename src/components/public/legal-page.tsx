import type { ReactNode } from 'react'
import Link from 'next/link'
import { LegalToc } from '@/components/public/legal-toc'
import { LEGAL_UPDATED_AT, LEGAL_VERSION } from '@/lib/constants/site'

export type LegalSectionData = {
  id: string
  title: string
  body: ReactNode
}

type LegalPageProps = {
  title: string
  summary: string
  sections: LegalSectionData[]
  related: { href: string; label: string }
}

export function LegalPage({ title, summary, sections, related }: LegalPageProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-primary">Dokumen legal</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Berlaku sejak {LEGAL_UPDATED_AT} · Versi {LEGAL_VERSION}
        </p>
        <p className="mt-6 border-y border-border py-5 leading-relaxed text-foreground/85">
          <span className="font-medium text-foreground">Ringkasan. </span>
          {summary}
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <aside>
          <LegalToc items={sections.map(({ id, title }) => ({ id, title }))} />
        </aside>

        <div className="max-w-2xl space-y-12">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-display text-xl font-semibold tracking-tight">
                <span className="mr-3 tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed text-foreground/85 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                {section.body}
              </div>
            </section>
          ))}

          <p className="border-t border-border pt-8 text-sm text-muted-foreground">
            Dokumen terkait:{' '}
            <Link
              href={related.href}
              className="text-primary underline underline-offset-4"
            >
              {related.label}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export function LegalTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead className="bg-muted/60 text-foreground">
          <tr>
            {head.map((label) => (
              <th key={label} scope="col" className="px-4 py-2.5 font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border align-top">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={j === 0 ? 'px-4 py-3 font-medium text-foreground' : 'px-4 py-3'}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}