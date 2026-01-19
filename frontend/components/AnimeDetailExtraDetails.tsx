"use client"

import { Card, CardContent } from "@/components/ui/card"
import SectionHeader from "@/components/SectionHeader"
import { LoadingState, ErrorState, EmptyState } from "@/components/DataLoadingStates"
import AnimeDetailReviews from "@/components/AnimeDetailReviews"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface JikanCharacter {
  name: string
  role: string
  voiceActors: { name: string; language: string }[]
  imageUrl?: string | null
}

interface JikanStaff {
  name: string
  positions: string[]
  imageUrl?: string | null
}

interface JikanStatistic {
  label: string
  value: number
}

interface JikanDetails {
  characters: JikanCharacter[]
  staff: JikanStaff[]
  statistics: JikanStatistic[]
}

interface AnimeDetailExtraDetailsProps {
  details: JikanDetails | null
  detailsLoading: boolean
  detailsError: string | null
  reviews: string[]
  reviewsLoading: boolean
}

export default function AnimeDetailExtraDetails({
  details,
  detailsLoading,
  detailsError,
  reviews,
  reviewsLoading,
}: AnimeDetailExtraDetailsProps) {
  const showDetailsLoading = detailsLoading || (!details && !detailsError)
  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  const formatVoiceActors = (voiceActors: JikanCharacter["voiceActors"]) => {
    if (!voiceActors.length) return "TBA"
    return voiceActors.map((actor) => `${actor.language}: ${actor.name}`).join(", ")
  }

  return (
    <section className="space-y-4" id="details">
      <SectionHeader
        title="Extra details"
        description="Characters, staff, and community stats pulled from Jikan (MAL)."
      />
      <Card className="border border-border/60 bg-card/80 shadow-sm">
        <CardContent className="px-4 py-5 sm:px-6">
          <Tabs defaultValue="characters" className="gap-4">
            <TabsList className="flex flex-wrap gap-2">
              <TabsTrigger value="characters">Characters</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews
                {reviews.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 px-2 py-0 text-[11px]"
                  >
                    {reviews.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="characters">
              {showDetailsLoading ? (
                <LoadingState count={6} type="default" />
              ) : detailsError ? (
                <ErrorState message={detailsError} title="Details unavailable" />
              ) : details?.characters?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {details.characters.slice(0, 12).map((character) => (
                    <Card
                      key={`${character.name}-${character.role}`}
                      className="border border-border/60 bg-background/50"
                    >
                      <CardContent className="flex h-full flex-col gap-4 p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted sm:h-24 sm:w-24">
                            {character.imageUrl ? (
                              <img
                                src={character.imageUrl}
                                alt={character.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-base font-semibold text-foreground/70">
                                {getInitials(character.name)}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-foreground">
                              {character.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {character.role}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatVoiceActors(character.voiceActors)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  message="Jikan did not return any character data for this title."
                  title="No characters found"
                />
              )}
            </TabsContent>

            <TabsContent value="staff">
              {showDetailsLoading ? (
                <LoadingState count={6} type="default" />
              ) : detailsError ? (
                <ErrorState message={detailsError} title="Details unavailable" />
              ) : details?.staff?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {details.staff.slice(0, 12).map((member) => (
                    <Card
                      key={`${member.name}-${member.positions.join("-")}`}
                      className="border border-border/60 bg-background/50"
                    >
                      <CardContent className="flex h-full flex-col gap-4 p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted sm:h-24 sm:w-24">
                            {member.imageUrl ? (
                              <img
                                src={member.imageUrl}
                                alt={member.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-base font-semibold text-foreground/70">
                                {getInitials(member.name)}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-foreground">
                              {member.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.positions.length
                                ? member.positions.join(", ")
                                : "TBA"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  message="Jikan did not return staff data for this title."
                  title="No staff details found"
                />
              )}
            </TabsContent>

            <TabsContent value="stats">
              {showDetailsLoading ? (
                <LoadingState count={6} type="default" />
              ) : detailsError ? (
                <ErrorState message={detailsError} title="Details unavailable" />
              ) : details?.statistics?.length ? (
                <div className="rounded-2xl border border-border/60 bg-background/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.statistics.map((stat) => (
                        <TableRow key={stat.label}>
                          <TableCell className="font-medium text-foreground">
                            {stat.label}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {stat.value.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState
                  message="Jikan did not return stats for this title."
                  title="No statistics available"
                />
              )}
            </TabsContent>

            <TabsContent value="reviews">
              <div className="rounded-2xl border border-border/60 bg-background/50 p-4 sm:p-6">
                <AnimeDetailReviews
                  reviews={reviews}
                  isLoading={reviewsLoading}
                  reviewsPerPage={2}
                  variant="tab"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}

export function CharacterListTable({ characters }: { characters: JikanCharacter[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Character</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Voice actors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {characters.slice(0, 12).map((character) => (
            <TableRow key={`${character.name}-${character.role}`}>
              <TableCell className="font-medium text-foreground">
                {character.name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {character.role}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {character.voiceActors.length
                  ? character.voiceActors
                      .map((actor) => `${actor.language}: ${actor.name}`)
                      .join(", ")
                  : "TBA"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
