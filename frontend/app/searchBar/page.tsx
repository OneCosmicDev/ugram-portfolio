"use client";

import { Suspense, useState, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { searchUsers, searchImagesByHashtag, searchImagesByDescription } from "@/lib/api";
import type { Image } from "@/types";
import { Button } from "@/components/ui/button";
import { UserList } from "@/components/user-list";
import { Feed } from "@/components/feed";

const TYPE_TO_INDEX: Record<string, number> = {
    users: 0,
    hashtag: 1,
    description: 2,
};

function UsersFound({ wordRecherched }: { wordRecherched: string }) {
    if (wordRecherched.length > 0) {
        return (
            <UserList title="Users Found" functionToGetUsers={searchUsers} param={wordRecherched} />
        );
    } else {
        return (
            <UserList title="All Users" />
        );
    }
}

function ImagesFound({
    reserchFunction,
    wordRecherched,
    queryType
}: {
    reserchFunction: (p: string) => Promise<Image[]>,
    wordRecherched: string,
    queryType: string
}) {
    if (wordRecherched.length > 0) {
        return (
            <Feed functionToGetImages={reserchFunction} param={wordRecherched} queryType={queryType} />
        )
    } else {
        return (
            <Feed />
        )
    }
}

function Results({
    indexReserch,
    wordRecherched
}: {
    indexReserch: number,
    wordRecherched: string
}) {
    if (indexReserch == 0) {
        return (
            <div>
                <UsersFound wordRecherched={wordRecherched} />
            </div>
        );
    } if (indexReserch == 1) {
        return (
            <div>
                <ImagesFound wordRecherched={wordRecherched} reserchFunction={searchImagesByHashtag} queryType="hashtag" />
            </div>
        );
    } else {
        return (
            <div>
                <ImagesFound wordRecherched={wordRecherched} reserchFunction={searchImagesByDescription} queryType="description" />
            </div>
        );
    }
}

function SearchPageContent() {
    const placeholderValues = ["Search a user", "Search by hashtag", "Search by description"]
    const searchParams = useSearchParams();
    const initialType = searchParams.get("type");
    const initialQ = searchParams.get("q") ?? "";
    const [reserchTypeIndex, setReserchTypeIndex] = useState(
        initialType && TYPE_TO_INDEX[initialType] !== undefined ? TYPE_TO_INDEX[initialType] : 0
    );
    const [resercheWord, setReserchWord] = useState(initialQ);
    const buttonClassName = "mx-1 my-2"

    async function reserch(e: ChangeEvent<HTMLInputElement>) {
        setReserchWord(e.target.value);
    }

    function buttonSelected(index: number): number {
        setReserchTypeIndex(index);
        return 0;
    }

    return (
        <div>
            <input
                type="search" name="reserch"
                value={resercheWord} placeholder={placeholderValues[reserchTypeIndex]}
                onChange={reserch}
                className="w-full rounded-lg border border-border bg-navy-dark px-4 py-3 text-sm text-silver outline-none transition focus:border-accent-blue"
            />
            <div>
                <Button onClick={() => buttonSelected(0)}
                    className={buttonClassName}
                >
                    Users
                </Button>
                <Button onClick={() => buttonSelected(1)}
                    className={buttonClassName}
                >
                    Hashtag
                </Button>
                <Button onClick={() => buttonSelected(2)}
                    className={buttonClassName}
                >
                    Description
                </Button>
            </div>
            <Results
                indexReserch={reserchTypeIndex}
                wordRecherched={resercheWord}
            />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-10">Loading...</div>}>
            <SearchPageContent />
        </Suspense>
    );
}
