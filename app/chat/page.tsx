"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle,
  Search,
  Send,
  Plus,
  ArrowLeft,
  X,
  User,
  CheckCheck,
  Check,
  Loader2,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

interface Partner {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  status: string;
}

interface ChatRoom {
  id: string;
  lastMessage: string;
  updatedAt: string;
  createdAt: string;
  unreadCount: number;
  partner: Partner;
}

interface MessageItem {
  id: string;
  roomId: string;
  senderId: string;
  isMe: boolean;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface SearchUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  status: string;
}

function formatChatTime(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (diffInDays === 0) {
    return timeStr;
  } else if (diffInDays === 1) {
    return "เมื่อวาน";
  } else if (diffInDays < 7) {
    const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    return days[date.getDay()];
  }
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

function formatMessageGroupDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "วันนี้";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "เมื่อวานนี้";
  }
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserIdParam = searchParams.get("userId");
  const targetUsernameParam = searchParams.get("user");

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // New Chat Modal state
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeRoom = rooms.find((r) => r.id === selectedRoomId);

  // Isolate scrolling to the chat box only (never scroll the main browser window)
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, []);

  // 1. Fetch Rooms List (with smart state diffing to prevent unnecessary re-renders)
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/rooms", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login?redirect=/chat");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const incomingRooms: ChatRoom[] = data.rooms || [];
        setRooms((prev) => {
          if (
            prev.length === incomingRooms.length &&
            JSON.stringify(prev) === JSON.stringify(incomingRooms)
          ) {
            return prev;
          }
          return incomingRooms;
        });
      }
    } catch (err) {
      console.error("Error fetching chat rooms:", err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [router]);

  // 2. Fetch Messages for Active Room (with smart state diffing)
  const fetchMessages = useCallback(
    async (roomId: string, silent = false, autoScroll = false) => {
      if (!silent) setIsLoadingMessages(true);
      try {
        const res = await fetch(`/api/chat/messages?roomId=${roomId}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const incomingMessages: MessageItem[] = data.messages || [];

          setMessages((prev) => {
            if (
              prev.length === incomingMessages.length &&
              JSON.stringify(prev) === JSON.stringify(incomingMessages)
            ) {
              return prev;
            }
            return incomingMessages;
          });

          // Clear unread count for this room locally
          setRooms((prev) =>
            prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
          );

          if (autoScroll) {
            setTimeout(() => scrollToBottom(false), 50);
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        if (!silent) setIsLoadingMessages(false);
      }
    },
    [scrollToBottom]
  );

  // Handle URL Query Params (e.g. /chat?userId=... or /chat?user=...)
  useEffect(() => {
    const handleUrlTarget = async () => {
      if (targetUserIdParam || targetUsernameParam) {
        try {
          const res = await fetch("/api/chat/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetUserId: targetUserIdParam || undefined,
              targetUsername: targetUsernameParam || undefined,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            await fetchRooms();
            if (data.roomId) {
              setSelectedRoomId(data.roomId);
            }
          }
        } catch (err) {
          console.error("Error opening target chat from URL:", err);
        }
      }
    };

    handleUrlTarget();
  }, [targetUserIdParam, targetUsernameParam, fetchRooms]);

  // Initial Load
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // When selected room changes, fetch messages and scroll down once
  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages(selectedRoomId, false, true);
      inputRef.current?.focus();
    } else {
      setMessages([]);
    }
  }, [selectedRoomId, fetchMessages]);

  // 3. Supabase Realtime Setup (gentle sync without excessive polling)
  useEffect(() => {
    const supabase = createBrowserClient();

    // Listen to changes on message and chatroom
    const channel = supabase
      .channel("realtime-chat-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message" },
        (payload: any) => {
          const newMsg = payload.new;
          if (selectedRoomId && newMsg.chat_room_id === selectedRoomId) {
            fetchMessages(selectedRoomId, true, true);
          }
          fetchRooms();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chatroom" },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    // Gentle background poll (every 15s) only when tab is visible
    const handleVisibilityCheck = () => {
      if (document.visibilityState === "visible") {
        fetchRooms();
        if (selectedRoomId) {
          fetchMessages(selectedRoomId, true, false);
        }
      }
    };

    const interval = setInterval(handleVisibilityCheck, 15000);
    window.addEventListener("focus", handleVisibilityCheck);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibilityCheck);
    };
  }, [selectedRoomId, fetchRooms, fetchMessages]);

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedRoomId || !inputText.trim() || isSending) return;

    const content = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: MessageItem = {
      id: tempId,
      roomId: selectedRoomId,
      senderId: "me",
      isMe: true,
      type: "text",
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 20);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoomId,
          content,
          type: "text",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
        fetchRooms();
        setTimeout(() => scrollToBottom(true), 20);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert("ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Search Users for New Chat Modal
  useEffect(() => {
    if (!isNewChatModalOpen) return;

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await fetch(
          `/api/chat/users?q=${encodeURIComponent(userQuery)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [userQuery, isNewChatModalOpen]);

  // Start chat with user from modal
  const handleStartChatWithUser = async (targetUser: SearchUser) => {
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetUser.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsNewChatModalOpen(false);
        setUserQuery("");
        await fetchRooms();
        if (data.roomId) {
          setSelectedRoomId(data.roomId);
        }
      }
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  // Filter rooms by search term
  const filteredRooms = rooms.filter((r) =>
    r.partner.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] max-w-7xl overflow-hidden bg-slate-50 p-2 sm:p-4 lg:p-6">
      {/* Container Box */}
      <div className="flex h-full w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Conversation List */}
        {/* ========================================================================= */}
        <div
          className={`flex h-full w-full flex-col border-r border-slate-200 bg-white transition-all duration-300 md:w-80 lg:w-96 ${
            selectedRoomId ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1b3554] text-white shadow-sm">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h1 className="text-lg font-bold text-[#000f22]">
                  กล่องข้อความ
                </h1>
              </div>

              {/* ปุ่มเริ่มแชทใหม่ */}
              <button
                onClick={() => {
                  setIsNewChatModalOpen(true);
                  setUserQuery("");
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#c0e6fd]/30 px-3 py-1.5 text-xs font-semibold text-[#1b3554] transition hover:bg-[#c0e6fd]/60 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>แชทใหม่</span>
              </button>
            </div>

            {/* ช่องค้นหาบทสนทนา */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ใช้..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#3f6593] focus:bg-white focus:ring-2 focus:ring-[#c0e6fd]/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingRooms ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-[#3f6593]" />
                <span className="text-xs">กำลังโหลดการสนทนา...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  {searchTerm ? "ไม่พบการสนทนาที่ค้นหา" : "ยังไม่มีประวัติการพูดคุย"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  กดปุ่ม "+ แชทใหม่" ด้านบนเพื่อเริ่มพูดคุยกับผู้ใช้งานอื่น
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                const partnerInitial = room.partner.username
                  ? room.partner.username[0].toUpperCase()
                  : "U";

                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`flex w-full items-center gap-3.5 p-3.5 text-left transition ${
                      isSelected
                        ? "bg-[#c0e6fd]/25 border-l-4 border-[#1b3554]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-sm font-bold text-white shadow-sm ring-2 ring-white">
                        {room.partner.avatarUrl ? (
                          <img
                            src={room.partner.avatarUrl}
                            alt={room.partner.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{partnerInitial}</span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-semibold text-slate-900">
                          {room.partner.username}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatChatTime(room.updatedAt)}
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-slate-500">
                          {room.lastMessage || (
                            <span className="italic text-slate-400">
                              เริ่มการสนทนา
                            </span>
                          )}
                        </p>

                        {/* Unread badge */}
                        {room.unreadCount > 0 && (
                          <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-sm">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Active Chat Feed */}
        {/* ========================================================================= */}
        <div
          className={`flex h-full flex-1 flex-col bg-slate-50/50 ${
            !selectedRoomId ? "hidden md:flex" : "flex"
          }`}
        >
          {activeRoom ? (
            <>
              {/* Chat Header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-6">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedRoomId(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  {/* Partner Avatar (Clickable to Profile) */}
                  <Link
                    href={`/user/${activeRoom.partner.id}?from=chat`}
                    title="ดูโปรไฟล์ผู้ใช้งาน"
                    className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-sm font-bold text-white shadow-sm ring-2 ring-transparent transition hover:ring-[#3f6593]"
                  >
                    {activeRoom.partner.avatarUrl ? (
                      <img
                        src={activeRoom.partner.avatarUrl}
                        alt={activeRoom.partner.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>
                        {activeRoom.partner.username
                          ? activeRoom.partner.username[0].toUpperCase()
                          : "U"}
                      </span>
                    )}
                  </Link>

                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/user/${activeRoom.partner.id}?from=chat`}
                        className="font-bold text-slate-900 transition hover:text-[#1b3554] hover:underline"
                      >
                        {activeRoom.partner.username}
                      </Link>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {activeRoom.partner.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-600">
                      ● บัญชีใช้งาน
                    </span>
                  </div>
                </div>

                {/* View Profile Action Button */}
                <Link
                  href={`/user/${activeRoom.partner.id}?from=chat`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#3f6593] hover:bg-sky-50 hover:text-[#1b3554] active:scale-95"
                >
                  <User className="h-3.5 w-3.5 text-[#3f6593]" />
                  <span>ดูโปรไฟล์</span>
                </Link>
              </div>

              {/* Message Feed Container (Self-contained scroll) */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 lg:p-6"
              >
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <Loader2 className="h-7 w-7 animate-spin text-[#3f6593]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#3f6593] shadow-sm ring-1 ring-slate-200/70">
                      <MessageCircle className="h-7 w-7" />
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-slate-800">
                      เริ่มการสนทนากับ {activeRoom.partner.username}
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-slate-500">
                      พิมพ์ข้อความด้านล่างเพื่อสอบถามรายละเอียด การนัดรับ หรือข้อมูลอุปกรณ์ก่อนการเช่า
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const prevMsg = messages[index - 1];
                    const isNewDate =
                      !prevMsg ||
                      new Date(msg.createdAt).toDateString() !==
                        new Date(prevMsg.createdAt).toDateString();

                    return (
                      <div key={msg.id} className="space-y-3">
                        {isNewDate && (
                          <div className="flex justify-center">
                            <span className="rounded-full bg-slate-200/70 px-3 py-1 text-[11px] font-medium text-slate-600">
                              {formatMessageGroupDate(msg.createdAt)}
                            </span>
                          </div>
                        )}

                        <div
                          className={`flex items-end gap-2 ${
                            msg.isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!msg.isMe && (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-300 text-[10px] font-bold text-slate-700">
                              {activeRoom.partner.avatarUrl ? (
                                <img
                                  src={activeRoom.partner.avatarUrl}
                                  alt={activeRoom.partner.username}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span>
                                  {activeRoom.partner.username[0]?.toUpperCase() ||
                                    "U"}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="max-w-[75%] space-y-1">
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words ${
                                msg.isMe
                                  ? "bg-gradient-to-r from-[#1b3554] to-[#3f6593] text-white rounded-br-none"
                                  : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-none"
                              }`}
                            >
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {msg.content}
                              </p>
                            </div>

                            <div
                              className={`flex items-center gap-1 text-[10px] text-slate-400 ${
                                msg.isMe ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span>{formatChatTime(msg.createdAt)}</span>
                              {msg.isMe &&
                                (msg.isRead ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                                ) : (
                                  <Check className="h-3 w-3 text-slate-400" />
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="พิมพ์ข้อความที่ต้องการสอบถาม..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="h-11 flex-1 rounded-full border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#3f6593] focus:bg-white focus:ring-4 focus:ring-[#c0e6fd]/40"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#1b3554] to-[#3f6593] text-white shadow-md shadow-[#1b3554]/20 transition hover:from-[#000f22] hover:to-[#1b3554] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 -translate-x-0.5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State when no room is selected */
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                <MessageCircle className="h-10 w-10 text-[#3f6593]" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-800">
                ยินดีต้อนรับสู่ระบบแชท ChaoChao
              </h2>
              <p className="mt-1.5 max-w-md text-sm text-slate-500">
                เลือกคู่สนทนาจากรายการทางซ้าย หรือเริ่มแชทใหม่เพื่อสอบถามข้อมูลอุปกรณ์ สภาพของ และการนัดหมายก่อนเริ่มเช่า
              </p>
              <button
                onClick={() => {
                  setIsNewChatModalOpen(true);
                  setUserQuery("");
                }}
                className="mt-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3554] to-[#3f6593] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1b3554]/20 transition hover:from-[#000f22] hover:to-[#1b3554]"
              >
                <Plus className="h-4 w-4" />
                <span>เริ่มแชทใหม่</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Start New Chat by Searching Username */}
      {/* ========================================================================= */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c0e6fd]/30 text-[#1b3554]">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-[#000f22]">
                  เริ่มบทสนทนาใหม่
                </h3>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search Input */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="พิมพ์ชื่อผู้ใช้ที่ต้องการค้นหา..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                autoFocus
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#3f6593] focus:bg-white focus:ring-2 focus:ring-[#c0e6fd]/50"
              />
            </div>

            {/* Modal Search Results */}
            <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-slate-100">
              {isSearchingUsers ? (
                <div className="flex h-32 items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin text-[#3f6593]" />
                  <span className="text-xs">กำลังค้นหาผู้ใช้...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-center text-slate-400">
                  <User className="h-8 w-8 text-slate-300" />
                  <span className="mt-2 text-xs">
                    {userQuery ? `ไม่พบผู้ใช้ชื่อ "${userQuery}"` : "พิมพ์ชื่อผู้ใช้เพื่อค้นหา"}
                  </span>
                </div>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleStartChatWithUser(user)}
                    className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-sky-50 rounded-xl"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#1b3554] to-[#3f6593] text-xs font-bold text-white shadow-sm">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{user.username[0]?.toUpperCase() || "U"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {user.username}
                      </p>
                      <span className="text-[11px] text-slate-500">
                        {user.role}
                      </span>
                    </div>
                    <span className="rounded-lg bg-[#c0e6fd]/30 px-2.5 py-1 text-xs font-medium text-[#1b3554]">
                      แชท
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-80px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3f6593]" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
