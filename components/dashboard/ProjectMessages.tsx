"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    name: string | null;
  } | null;
}

interface ProjectMessagesProps {
  projectId?: string;
}

export function ProjectMessages({ projectId }: ProjectMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracked in a ref so fetchMessages does not depend on `messages`, which it sets.
  const messageCountRef = useRef(0);

  const fetchMessages = useCallback(
    async (isBackground = false) => {
      if (!projectId) return;

      if (!isBackground) {
        setLoading(true);
        setError(null);
      }

      try {
        const res = await fetch(`/api/chat/${projectId}/messages`);

        if (res.status === 401) {
          throw new Error("Please log in to view project messages.");
        }
        if (res.status === 403) {
          throw new Error("You do not have access to this project chat.");
        }
        if (!res.ok) {
          throw new Error("Failed to load messages. Please try again.");
        }

        const data: Message[] = await res.json();
        const nextMessages = Array.isArray(data) ? data : [];
        messageCountRef.current = nextMessages.length;
        setMessages(nextMessages);
        setError(null);
      } catch (err) {
        console.error("Error fetching preview messages:", err);
        // If background polling fails and we already have messages, don't flash error screen
        if (!isBackground || messageCountRef.current === 0) {
          setError(
            err instanceof Error ? err.message : "Failed to load messages"
          );
        }
      } finally {
        if (!isBackground) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [projectId]
  );

  useEffect(() => {
    // Clear previous project messages on project switch
    messageCountRef.current = 0;
    setMessages([]);
    setError(null);

    if (!projectId) return;

    fetchMessages(false);

    // Poll every 8 seconds for new messages
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchMessages(true);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [projectId, fetchMessages]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchMessages(false);
  };

  const formatTime = (timestamp: string) => {
    try {
      const time = new Date(timestamp).getTime();
      if (isNaN(time)) return "";
      const diff = Math.floor((Date.now() - time) / 1000);
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return "";
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const recentMessages = messages.slice(-4);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Recent Messages</CardTitle>
          {projectId && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={loading || refreshing}
              title="Refresh messages"
              className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">You might have unread messages.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-400 py-6 text-center">Loading messages...</p>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <AlertCircle className="mx-auto mb-2 h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700 font-medium mb-3">{error}</p>
            <button
              type="button"
              onClick={() => fetchMessages(false)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors shadow-sm"
            >
              Try again
            </button>
          </div>
        ) : recentMessages.length > 0 ? (
          <div className="space-y-3">
            {recentMessages.map((msg, index) => {
              const name = msg.sender?.name || "Unknown";
              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-3 ${
                    index < recentMessages.length - 1 ? "pb-3 border-b" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm truncate">{name}</p>
                      <span className="text-xs text-gray-500 shrink-0 ml-2">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Image
              src="/chat.svg"
              alt="No messages"
              width={60}
              height={60}
              className="mx-auto mb-2"
            />
            <p className="text-sm text-gray-500">No messages yet</p>
          </div>
        )}

        {projectId && !error && (
          <div className="pt-2">
            <Link
              href={`/dashboard/chat-window/${projectId}`}
              className="text-sm text-blue-600 hover:underline"
            >
              View All Messages
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
