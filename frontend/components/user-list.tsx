"use client";

import {useState, useEffect, useMemo } from "react";
import { fetchUsers, getImageUrl } from "@/lib/api";
import type { User } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function UserList({
    title,
    functionToGetUsers,
    param
}:{
    title: string,
    functionToGetUsers?:(userParam: string)=> Promise<User[]>,
    param?: string
}){
    const { currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUsers = async () => {
        try {
            const data = (functionToGetUsers && param) ? await functionToGetUsers(param) : await fetchUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
        };

        loadUsers();
    }, [functionToGetUsers, param]);

    const orderedUsers = useMemo(() => {
        if (!currentUser) return users;

        const self = users.find((u) => u.id === currentUser.id);
        const others = users.filter((u) => u.id !== currentUser.id);

        return self ? [self, ...others] : users;
    }, [users, currentUser]);

    if (loading) {
        return <div className="p-10">Users are loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-10 space-y-8">
        <h1 className="text-3xl font-semibold">{title}</h1>

        {orderedUsers.length === 0 ? (
            <p className="text-zinc-500">No Results.</p>
        ) : (
            <div className="space-y-4">
            {orderedUsers.map((user) => {
                const isYou = user.id === currentUser?.id;

                return (
                <Link
                    key={user.id}
                    href={`/user?id=${user.id}`}
                    className="flex items-center justify-between gap-4 p-4 border border-border rounded-lg hover:bg-navy transition"
                >
                    <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                        {user.avatar && <AvatarImage src={getImageUrl(user.avatar)} />}
                        <AvatarFallback className="bg-navy-light text-sm text-accent-blue">
                        {user.username?.charAt(0)?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                    </Avatar>

                    <div>
                        <p className="font-semibold">@{user.username}</p>
                        <p className="text-sm text-zinc-500">
                        {user.firstName} {user.lastName}
                        </p>
                    </div>
                    </div>

                    {isYou && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent-blue/20 text-accent-blue">
                        You
                    </span>
                    )}
                </Link>
                );
            })}
            </div>
        )}
        </div>
    );}