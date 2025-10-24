import { Separator } from "./ui/separator"

interface SectionHeaderProps {
  title: string
  description?: string
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description }) => {
  return (
    <div className="space-y-2 px-4 pt-5 sm:px-6 sm:pt-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Separator className="bg-primary/60" />
    </div>
  )
}

export default SectionHeader
