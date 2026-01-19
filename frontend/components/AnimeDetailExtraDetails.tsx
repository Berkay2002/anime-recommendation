"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import SectionHeader from "@/components/SectionHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface JikanCharacter {
  name: string
  role: string
  voiceActors: string[]
}

interface JikanStaff {
  name: string
  positions: string[]
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
}

const detailsSkeleton = (
  <div className='space-y-3'>
    {Array.from({ length: 6 }).map((_, index) => (
      <Skeleton
        key={`detail-skeleton-${index}`}
        className='h-8 w-full'
      />
    ))}
  </div>
)

export default function AnimeDetailExtraDetails({
  details,
  detailsLoading,
  detailsError,
}: AnimeDetailExtraDetailsProps) {
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
            </TabsList>

            <TabsContent value="characters">
              {detailsLoading ? (
                detailsSkeleton
              ) : detailsError ? (
                <Alert variant="destructive">
                  <AlertTitle>Details unavailable</AlertTitle>
                  <AlertDescription>{detailsError}</AlertDescription>
                </Alert>
              ) : details?.characters?.length ? (
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
                      {details.characters.slice(0, 12).map((character) => (
                        <TableRow
                          key={`${character.name}-${character.role}`}
                        >
                          <TableCell className="font-medium text-foreground">
                            {character.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {character.role}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {character.voiceActors.length
                              ? character.voiceActors.join(", ")
                              : "TBA"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No characters found</AlertTitle>
                  <AlertDescription>
                    Jikan did not return any character data for this title.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="staff">
              {detailsLoading ? (
                detailsSkeleton
              ) : detailsError ? (
                <Alert variant="destructive">
                  <AlertTitle>Details unavailable</AlertTitle>
                  <AlertDescription>{detailsError}</AlertDescription>
                </Alert>
              ) : details?.staff?.length ? (
                <div className="rounded-2xl border border-border/60 bg-background/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff member</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.staff.slice(0, 12).map((member) => (
                        <TableRow
                          key={`${member.name}-${member.positions.join("-")}`}
                        >
                          <TableCell className="font-medium text-foreground">
                            {member.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {member.positions.length
                              ? member.positions.join(", ")
                              : "TBA"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No staff details found</AlertTitle>
                  <AlertDescription>
                    Jikan did not return staff data for this title.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="stats">
              {detailsLoading ? (
                detailsSkeleton
              ) : detailsError ? (
                <Alert variant="destructive">
                  <AlertTitle>Details unavailable</AlertTitle>
                  <AlertDescription>{detailsError}</AlertDescription>
                </Alert>
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
                <Alert>
                  <AlertTitle>No statistics available</AlertTitle>
                  <AlertDescription>
                    Jikan did not return stats for this title.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}
