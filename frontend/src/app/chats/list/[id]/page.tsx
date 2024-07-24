"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const LIST_URL = `${BACKEND_URL}/api/users/get-chats`;

type Chat = {
  chatId: string;
  history: string;
  updatedAt: string;
  userId: string;
};

type ChatMessage = {
  role: string;
  content: string;
};

const ChatList: React.FC = () => {
  const params = useParams();
  const id = params.id as string;

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    axios.post(LIST_URL, { userId: id })
      .then(response => {
        setChats(response.data.data.chats);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, [id]);

  const handleOpenPopup = (history: string) => {
    setSelectedHistory(history);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedHistory(null);
  };

  const handlePopupClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClosePopup();
    }
  };

  const formatHistory = (history: string) => {
    try {
      const parsedHistory: ChatMessage[] = JSON.parse(history.replace(/'/g, '"'));
      return (
        <div>
          {parsedHistory.map((message, index) => (
            <div key={index} className="mb-2">
              <p className='font-bold'>{message.role === 'assistant' ? 'Bot' : 'Usuário'}:</p>
              <p className='mb-6'>{message.content}</p>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <div>{history}</div>;
    }
  };

  if (loading) {
    return <div className="w-full h-full flex flex-col justify-center items-center text-center bg-black text-white">
      <h1 className="text-5xl font-bold">Carregando dados...</h1>
    </div>;
  }

  if (error) {
    return <div className="w-full h-full flex flex-col justify-center items-center text-center bg-black text-white">
      <h1 className="text-5xl font-bold">Erro ao carregar dados</h1>
      <p className="text-xl">{error}</p>
    </div>;
  }

  return (
    <div className='w-full h-full flex flex-col justify-center items-center text-center text-white'>
      <h1 className="text-5xl font-bold">Chats do Usuário</h1>
      <div className='h-full flex flex-col items-center justify-center text-white p-8'>
        
        <div className="overflow-x-auto overflow-y-auto w-full">
          <table className="min-w-full table-auto bg-gray-800 rounded-lg">
            <thead>
              <tr>
                <th className="py-3 px-4 bg-gray-700 text-left">Chat ID</th>
                <th className="py-3 px-4 bg-gray-700 text-left">Histórico</th>
                <th className="py-3 px-4 bg-gray-700 text-left">Atualizado Em</th>
                <th className="py-3 px-4 bg-gray-700 text-left">User ID</th>
              </tr>
            </thead>
            <tbody>
              {chats.map((chat) => (
                <tr key={chat.chatId} className="border-t border-gray-700">
                  <td className="py-3 px-4">{chat.chatId}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleOpenPopup(chat.history)}
                      className="text-blue-500 hover:underline"
                    >
                      Ver Histórico
                    </button>
                  </td>
                  <td className="py-3 px-4">{new Date(chat.updatedAt).toLocaleString()}</td>
                  <td className="py-3 px-4">{chat.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showPopup && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center"
            onClick={handlePopupClick}
          >
            <div className="bg-gray-800 p-4 rounded shadow-lg max-w-2xl w-full h-3/4 overflow-y-scroll transparent-scrollbar">
              <h2 className="text-xl font-bold mb-4 text-white">Histórico do Chat</h2>
              <div className="text-start text-white whitespace-pre-wrap">
                {selectedHistory && formatHistory(selectedHistory)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
