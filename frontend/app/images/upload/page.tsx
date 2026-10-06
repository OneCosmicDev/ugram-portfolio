"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { UploadCloud } from "lucide-react";
import { createImage } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Search } from "lucide-react";
import { searchUsers, searchHashtags } from "@/lib/api";

function normalizeTokens(value: string, prefix: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => (token.startsWith(prefix) ? token : `${prefix}${token}`));
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

function getFilterCSS(filter: string) {
  switch (filter) {
    case "grayscale":
      return "grayscale(1)";
    case "sepia":
      return "sepia(1)";
    case "blur":
      return "blur(2px)";
    case "bright":
      return "brightness(1.3)";
    case "contrast":
      return "contrast(1.3)";
    default:
      return "none";
  }
}

function canvasToFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], filename, {
        type: "image/jpeg",
      });

      resolve(file);
    }, "image/jpeg", 0.9);
  });
}

export default function UploadImagePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mentionSuggestions, setMentionSuggestions] = useState<{ id: string; username: string }[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = useState("");
  
  const debouncedMentionSearch = useDebounce(mentionSearchTerm, 300);

  const [hashtagSuggestions, setHashtagSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [hashtagSearchTerm, setHashtagSearchTerm] = useState("");
  
  const debouncedHashtagSearch = useDebounce(hashtagSearchTerm, 300);

  const [filter, setFilter] = useState("none");
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(5);
  const [showCamera, setShowCamera] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (debouncedMentionSearch.length > 0) {
      searchUsers(debouncedMentionSearch)
        .then((users) => {
          setMentionSuggestions(users);
          setShowMentionSuggestions(true);
        })
        .catch((err) => console.error("Error searching users:", err));
    }
  }, [debouncedMentionSearch]);

  useEffect(() => {
    if (debouncedHashtagSearch.length > 0) {
      searchHashtags(debouncedHashtagSearch)
        .then((hashtags) => {
          setHashtagSuggestions(hashtags);
          setShowHashtagSuggestions(true);
        })
        .catch((err) => console.error("Error searching hashtags:", err));
    }
  }, [debouncedHashtagSearch]);

  useEffect(() => {
    if (!file || !previewUrl) return;

    const img = new window.Image();
    img.src = previewUrl;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = getFilterCSS(filter);
      ctx.drawImage(img, 0, 0);

      ctx.filter = "none";
    };
  }, [file, previewUrl, filter]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctxRef.current = ctx;

    const { x, y } = getCanvasPos(canvas, e);

    ctx.beginPath();
    ctx.moveTo(x, y);

    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const { x, y } = getCanvasPos(canvas, e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = brushColor;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = ctxRef.current;
    if (ctx) ctx.closePath();
    setIsDrawing(false);
  };

  function getCanvasPos(canvas: HTMLCanvasElement, e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      streamRef.current = stream;
      setShowCamera(true);
    } catch (err) {
      console.error(err);
      setError("Cannot access webcam.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0);

    const fileFromCamera = await canvasToFile(canvas, "webcam.jpg");
    setFile(fileFromCamera);

    stopCamera();
    setShowCamera(false);

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!showCamera) return;

    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showCamera]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/[\s\n]+/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith("@") && currentWord.length > 1) {
      setMentionSearchTerm(currentWord.substring(1));
      setHashtagSearchTerm("");
      setShowHashtagSuggestions(false);
    } else if (currentWord.startsWith("#") && currentWord.length > 1) {
      setHashtagSearchTerm(currentWord.substring(1));
      setMentionSearchTerm("");
      setShowMentionSuggestions(false);
    } else {
      setMentionSearchTerm("");
      setShowMentionSuggestions(false);
      setHashtagSearchTerm("");
      setShowHashtagSuggestions(false);
    }
  };

  const handleSelectMention = (username: string) => {
    const textarea = document.getElementById("description-input") as HTMLTextAreaElement;
    const cursorPosition = textarea?.selectionStart || 0;
    const textBeforeCursor = description.substring(0, cursorPosition);
    const textAfterCursor = description.substring(cursorPosition);
    
    const wordsBefore = textBeforeCursor.split(/[\s\n]+/);
    wordsBefore.pop();
    
    const newTextBefore = wordsBefore.join(" ") + (wordsBefore.length > 0 ? " " : "") + `@${username} `;
    
    setDescription(newTextBefore + textAfterCursor);
    setMentionSearchTerm("");
    setShowMentionSuggestions(false);
    
    setTimeout(() => {
        if(textarea) {
            textarea.focus();
            textarea.setSelectionRange(newTextBefore.length, newTextBefore.length);
        }
    }, 0);
  };

  const handleSelectHashtag = (name: string) => {
    const textarea = document.getElementById("description-input") as HTMLTextAreaElement;
    const cursorPosition = textarea?.selectionStart || 0;
    const textBeforeCursor = description.substring(0, cursorPosition);
    const textAfterCursor = description.substring(cursorPosition);
    
    const wordsBefore = textBeforeCursor.split(/[\s\n]+/);
    wordsBefore.pop();
    
    const newTextBefore = wordsBefore.join(" ") + (wordsBefore.length > 0 ? " " : "") + `#${name} `;
    
    setDescription(newTextBefore + textAfterCursor);
    setHashtagSearchTerm("");
    setShowHashtagSuggestions(false);
    
    setTimeout(() => {
        if(textarea) {
            textarea.focus();
            textarea.setSelectionRange(newTextBefore.length, newTextBefore.length);
        }
    }, 0);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!currentUser) {
      setError("Please select a user.");
      return;
    }

    const finalDescription = description.trim();
    const formData = new FormData();
    const canvas = canvasRef.current;

    if (!canvas) {
      setError("Canvas not ready.");
      return;
    }

    const finalFile = await canvasToFile(canvas, "image.jpg");

    formData.append("newImage", finalFile);
    formData.append("userId", currentUser.id);
    if (finalDescription) {
      formData.append("description", finalDescription);
    }

    try {
      setIsSubmitting(true);
      await createImage(formData);
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      router.push("/feed/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Publishing error."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card className="border-border bg-navy">
        <CardHeader>
          <CardTitle className="text-silver">Publish an image</CardTitle>
          <CardDescription className="text-silver-muted">
            Upload an image and add a description with hashtags and mentions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-silver">
                Image
              </label>

              <div className="flex flex-col gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm text-silver-muted file:mr-4 file:rounded-lg file:border-0 file:bg-navy-light file:px-4 file:py-2 file:text-sm file:font-semibold file:text-silver hover:file:bg-navy"
                />

                <div className="overflow-hidden rounded-xl border border-border">
                  <canvas
                    ref={canvasRef}
                    className="h-full w-full object-cover"
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" onClick={startCamera}>
                  Start camera
                </Button>

                {showCamera && (
                  <Button type="button" variant="destructive" onClick={stopCamera}>
                    Stop camera
                  </Button>
                )}

                {showCamera && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                    <div className="rounded-lg bg-navy p-4 space-y-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-[500px] rounded"
                      />

                      <div className="flex justify-end gap-2">
                        <Button type="button" onClick={capturePhoto}>
                          Take photo
                        </Button>
                        <Button type="button" variant="ghost" onClick={stopCamera}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-silver">
                Filter
              </label>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-navy-dark px-4 py-2 text-sm text-silver"
              >
                <option value="none">None</option>
                <option value="grayscale">Grayscale</option>
                <option value="sepia">Sepia</option>
                <option value="blur">Blur</option>
                <option value="bright">Bright</option>
                <option value="contrast">Contrast</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-silver">
                Brush color
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded border border-border bg-navy"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-silver">
                Brush size: {brushSize}px
              </label>

              <input
                type="range"
                min={1}
                max={50}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-silver">
                Description
              </label>
              <textarea
                id="description-input"
                value={description}
                onChange={handleDescriptionChange}
                className="h-28 w-full rounded-lg border border-border bg-navy-dark px-4 py-3 text-sm text-silver outline-none transition focus:border-accent-blue"
                placeholder="Describe your image... type @ to mention someone or # for hashtags."
              />
              
              {showMentionSuggestions && mentionSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-navy-dark border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {mentionSuggestions.map((user) => (
                          <div
                              key={user.id}
                              className="px-4 py-2 cursor-pointer hover:bg-navy text-sm text-silver flex items-center gap-2"
                              onClick={() => handleSelectMention(user.username)}
                          >
                              <Search className="w-4 h-4 text-silver-muted" />
                              {user.username}
                          </div>
                      ))}
                  </div>
              )}
              
              {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-navy-dark border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {hashtagSuggestions.map((hashtag) => (
                          <div
                              key={hashtag.id}
                              className="px-4 py-2 cursor-pointer hover:bg-navy text-sm text-silver flex items-center gap-2"
                              onClick={() => handleSelectHashtag(hashtag.name)}
                          >
                              <Search className="w-4 h-4 text-silver-muted" />
                              #{hashtag.name}
                          </div>
                      ))}
                  </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <UploadCloud className="mr-2 h-4 w-4" />
                {isSubmitting ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
