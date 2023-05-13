import { Fragment, useState, useRef, useEffect, useCallback } from 'react';
import React from 'react';
import { ChatMessage } from '@/types/chat';
import { Document } from 'langchain/document';
import useNamespaces from '@/hooks/useNamespaces';
import { useChats } from '@/hooks/useChats';
import MessageList from '@/components/main/MessageList';
import ChatForm from '@/components/main/ChatForm';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import LoadingState from '@/components/other/LoadingState';
import { Dialog, Transition } from '@headlessui/react';
import { Bars3Icon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PlusCircleIcon } from '@heroicons/react/20/solid';
import ListOfNamespaces from '@/components/sidebar/ListOfNamespaces';
import ListOfChats from '@/components/sidebar/ListOfChats';
import ProfileDropdown from '@/components/other/ProfileDropdown';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const [query, setQuery] = useState<string>('');
  const [chatId, setChatId] = useState<string>('1');
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: () => router.push('/login'),
  });
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userImage, setUserImage] = useState<string>('');
  const { namespaces, selectedNamespace, setSelectedNamespace } = useNamespaces(userEmail);
  const {
    chatList,
    selectedChatId,
    setSelectedChatId,
    createChat,
    deleteChat,
    chatNames,
    updateChatName,
  } = useChats(selectedNamespace, userEmail);
  const nameSpaceHasChats = chatList.length > 0;
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: ChatMessage[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, what would you like to know about these documents?',
        type: 'apiMessage',
      },
    ],
    history: [],
  });
  const { messages, history } = messageState;
  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/history?chatId=${selectedChatId}&userEmail=${userEmail}`,
      );
      const data = await response.json();
      const pairedMessages: [any, any][] = [];
      for (let i = 0; i < data.length; i += 2) {
        pairedMessages.push([data[i], data[i + 1]]);
      }
      setMessageState((state) => ({
        ...state,
        messages: data.map((message: any) => ({
          type: message.sender === 'user' ? 'userMessage' : 'apiMessage',
          message: message.content,
        })),
        history: pairedMessages.map(([userMessage, botMessage]: any) => [
          userMessage.content,
          botMessage?.content ||
  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/history?chatId=${selectedChatId}&userEmail=${userEmail}`,
      );
      const data = await response.json();
      const pairedMessages: [any, any][] = [];
      for (let i = 0; i < data.length; i += 2) {
        pairedMessages.push([data[i], data[i + 1]]);
      }
      setMessageState((state) => ({
        ...state,
        messages: Array.isArray(data)
          ? data.map((message: any) => ({
              type: message.sender === 'user' ? 'userMessage' : 'apiMessage',
              message: message.content,
            }))
          : [],
        history: pairedMessages.map(([userMessage, botMessage]: any) => [
          userMessage.content,
          botMessage?.content || '',
        ]),
      }));
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  }, [selectedChatId, userEmail]);

  useEffect(() => {
    console.log('selectedNamespace', selectedNamespace);
  }, [selectedNamespace]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      setUserEmail(session.user.email);
      if (session?.user?.name) {
        setUserName(session.user.name);
      }
      if (session?.user?.image) {
        setUserImage(session.user.image);
      }
    }
  }, [status, session]);

  useEffect(() => {
    if (selectedNamespace && chatList.length > 0) {
      setSelectedChatId(chatList[0]);
    }
  }, [selectedNamespace, chatList, setSelectedChatId]);

  useEffect(() => {
    if (selectedChatId) {
      fetchChatHistory();
    }
  }, [selectedChatId, fetchChatHistory]);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  useEffect(() => {
    fetchChatHistory();
  }, [chatId, fetchChatHistory]);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();
    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
          chatId,
          selectedNamespace,
          userEmail,
        }),
      });
      const data = await response.json();

      if (Array.isArray(data)) {
        const pairedMessages: [any, any][] = [];
        for (let i = 0; i < data.length; i += 2) {
          pairedMessages.push([data[i], data[i + 1]]);
        }

        setMessageState((state) => ({
          ...state,
          messages: data.map((message: any) => ({
            type: message.sender === 'user' ? 'userMessage' : 'apiMessage',
            message: message.content,
          })),
          history: pairedMessages.map(([userMessage, botMessage]: any) => [
            userMessage.content,
            botMessage?.content || '',
          ]),
        }));
      } else {
        console.error('Invalid data format:', data);
      }

      setLoading(false);

      messageList
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    } catch (error) {
      setLoading(false);
      console.error('Error fetching data:', error);
      if (error) {
        console.error('Server responded with:', error);
      }
      setError('An error occurred while fetching the data. Please try again.');
    }
  }

  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <>
      {status === 'loading' ? (
        <LoadingState />
      ) : (
        <div>
          {/* Rest of the component */}
        </div>
      )}
    </>
  );
}
