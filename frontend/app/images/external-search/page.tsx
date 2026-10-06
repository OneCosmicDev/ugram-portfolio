"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Download, CheckCircle, Loader2 } from "lucide-react";
import { searchExternalPhotos, importExternalPhoto } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { UnsplashPhoto } from "@/types";

export default function ExternalSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["unsplash", searchTerm, page],
    queryFn: () => searchExternalPhotos(searchTerm, page),
    enabled: !!searchTerm,
    staleTime: 300_000,
  });

  const importMutation = useMutation({
    mutationFn: (photo: UnsplashPhoto) =>
      importExternalPhoto(photo.urls.regular, photo.description),
    onSuccess: (_data, photo) => {
      setImportedIds((prev) => new Set([...prev, photo.id]));
    },
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchTerm(query.trim());
    setPage(1);
    setImportedIds(new Set());
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-silver">Search Unsplash Photos</h1>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: mountain, sunset, city…"
          className="flex-1 rounded-xl bg-navy-light px-4 py-2 text-sm text-silver outline-none placeholder:text-silver-muted focus:ring-1 focus:ring-accent-blue"
        />
        <Button type="submit" disabled={!query.trim()}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </form>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
        </div>
      )}

      {data && (
        <>
          <p className="mb-4 text-sm text-silver-muted">
            {data.total.toLocaleString()} results for "{searchTerm}"
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {data.photos.map((photo) => {
              const isImported = importedIds.has(photo.id);
              const isImporting =
                importMutation.isPending &&
                (importMutation.variables as UnsplashPhoto)?.id === photo.id;

              return (
                <div
                  key={photo.id}
                  className="group relative overflow-hidden rounded-xl bg-navy-light"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={photo.urls.small}
                      alt={photo.description || "Unsplash photo"}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="mb-1 truncate text-xs text-white">
                      {photo.author.name}
                    </p>
                    <Button
                      size="sm"
                      disabled={isImported || isImporting}
                      onClick={() => importMutation.mutate(photo)}
                      className="w-full text-xs h-7"
                    >
                      {isImporting ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : isImported ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <Download className="mr-1 h-3 w-3" />
                      )}
                      {isImported ? "Imported" : isImporting ? "Importing…" : "Import"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-silver-muted">
                Page {page} / {data.totalPages}
              </span>
              <Button
                variant="ghost"
                disabled={page >= data.totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
