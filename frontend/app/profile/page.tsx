"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import { fetchUserById, updateUser, deleteUser, getImageUrl } from "@/lib/api";
import type { User } from "@/types";
import { ImageCard } from "@/components/image-card";
import { ProfileField, FormInput } from "@/components/profile-field";

export default function ProfilePage() {
  const { currentUser, clearAuth, fetchCurrentUser } = useAuthStore();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const loadUser = async () => {
      try {
        const data = await fetchUserById(currentUser.id);
        setUser(data);

        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      let payload: typeof form | FormData;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("firstName", form.firstName);
        formData.append("lastName", form.lastName);
        formData.append("email", form.email);
        formData.append("phone", form.phone);
        formData.append("avatar", avatarFile);
        payload = formData;
      } else {
        payload = form;
      }

      const updated = await updateUser(user.id, payload as typeof form);

      setUser((prev) =>
        prev
          ? {
            ...prev,
            ...updated,
          }
          : null
      );

      setIsEditing(false);
      setAvatarFile(null);
      await fetchCurrentUser();
    } catch (error) {
      console.error("Saving error:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = confirm(
      "Do you really want to delete you account ? This action cannot be undone"
    );

    if (!confirmed) return;

    try {
      await deleteUser(user.id);

      alert("Account deleted");

      clearAuth();

      window.location.href = "/login/";
    } catch (error) {
      console.error("Account deletion error:", error);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        You need to be connected.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 p-10 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row items-center gap-10">
        <div className="relative h-40 w-40 flex-shrink-0 group">
          <Image
            src={avatarPreview || getImageUrl(user.avatar) || "/avatar-placeholder.svg"}
            alt="Profile picture"
            fill
            className="rounded-full border border-zinc-200 dark:border-zinc-800 object-cover"
          />
          {isEditing && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition">
              <span className="text-xs font-semibold">Change</span>
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/jpg" 
                className="hidden" 
                onChange={handleAvatarChange} 
              />
            </label>
          )}
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-light">@{user.username}</h1>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="
                  rounded-xl
                  bg-black
                  text-white
                  px-6 py-2
                  text-sm font-semibold
                  hover:bg-zinc-800
                  transition
                "

              >
                Edit profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="rounded-lg bg-blue-500 px-6 py-1.5 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  className="rounded-lg border border-zinc-300 px-6 py-1.5 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-6 flex-wrap">
            <p className="font-medium">
              {user.firstName ?? "—"} {user.lastName ?? ""}
            </p>
            <p className="text-zinc-500 text-sm">
              Joined on {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <div className="flex flex-col md:flex-row gap-12">

          {!isEditing && (
            <div className="flex-1">
              <h2 className="text-sm font-bold uppercase text-zinc-400 mb-6 tracking-widest">
                Personal details
              </h2>

              <ProfileField label="Email" value={user.email} />
              <ProfileField label="Phone" value={user.phone} />
              <ProfileField label="First name" value={user.firstName} />
              <ProfileField label="Last name" value={user.lastName} />
            </div>
          )}

          {isEditing && (
            <div className="flex-1">
              <h2 className="text-sm font-bold uppercase text-zinc-400 mb-6 tracking-widest">
                Edit my information
              </h2>

              <FormInput label="First name" name="firstName" value={form.firstName} onChange={handleChange} />
              <FormInput label="Last name" name="lastName" value={form.lastName} onChange={handleChange} />
              <FormInput label="Email" name="email" value={form.email} onChange={handleChange} />
              <FormInput label="Phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
          )}

        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <h2 className="text-sm font-bold uppercase text-zinc-400 mb-8 tracking-widest">
          Published images
        </h2>

        {user.images && user.images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {user.images.map((image, index) => (
              <ImageCard key={image.id} image={image} index={index} />
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">
            There&apos;s nothing here.
          </p>
        )}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <button
          onClick={handleDeleteAccount}
          className="
            rounded-xl
            bg-red-500
            text-white
            px-6 py-3
            text-sm
            font-semibold
            hover:bg-red-600
            transition
          "
        >
          Delete my account
        </button>
      </div>
    </div>
  );
}
