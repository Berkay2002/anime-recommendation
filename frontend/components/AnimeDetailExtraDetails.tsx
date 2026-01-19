"use client"

import { Card, CardContent } from "@/components/ui/card"
import SectionHeader from "@/components/SectionHeader"
import { LoadingState, ErrorState, EmptyState } from "@/components/DataLoadingStates"
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
                <LoadingState count={6} type="default" />
              ) : detailsError ? (
                <ErrorState message={detailsError} title="Details unavailable" />
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
                <EmptyState
                  message="Jikan did not return any character data for this title."
                  title="No characters found"
                />
              )}
            </TabsContent>

            <TabsContent value="staff">
              {detailsLoading ? (
                <LoadingState count={6} type="default" />
              ) : detailsError ? (
                <ErrorState message={detailsError} title="Details unavailable" />
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
                <EmptyState
                  message="Jikan did not return staff data for this title."
                  title="No staff details found"
                />
              )}
            </TabsContent>

            <TabsContent value="stats">
              {detailsLoading ? (
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
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}
