import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type InfoSection = {
  title: string
  body: string[]
  primary?: boolean
}

const sections: InfoSection[] = [
  {
    title: "About This Project",
    body: [
      "This Anime Recommendation System is a university project designed to help fans discover their next favorite series.",
      "Using a static dataset of popular anime, we apply similarity-driven recommendation algorithms to surface titles that match your interests.",
    ],
    primary: true,
  },
  {
    title: "Dataset",
    body: [
      "The Top Anime Dataset 2024 powers the experience with rich metadata such as scores, genres, studios, and ratings.",
      "All recommendations are generated from this curated dataset to keep the experience focused and reliable.",
    ],
  },
  {
    title: "Compliance",
    body: [
      "We respect user privacy and do not collect personal data.",
      "Interactions are handled responsibly and align with GDPR-friendly practices.",
    ],
  },
]

export default function InfoPage() {
  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex w-full items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:w-auto"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to home
      </Link>

      <div className="space-y-8 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        {sections.map((section) => {
          const Heading = section.primary ? "h1" : "h2"

          return (
            <section key={section.title} className="space-y-3">
              <Heading
                className={
                  section.primary
                    ? "text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
                    : "text-2xl font-semibold tracking-tight text-foreground"
                }
              >
                {section.title}
              </Heading>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-relaxed text-muted-foreground sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}
