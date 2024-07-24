"use client";
import React, { useState } from 'react';
import Link from 'next/link';

const ChatForm: React.FC = () => {
  const [userId, setUserId] = useState('');

  return (
    <div className='w-full h-full flex flex-col justify-center items-center text-center text-white'>
      <h1 className="text-5xl font-bold">Listar Mensagens</h1>
      
      <div className='w-1/2 h-full flex flex-col items-center justify-center text-white p-8'>
        <div className="w-full bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="mb-4 text-left">
            <label htmlFor="userId" className="block text-gray-300 font-bold mb-2">User ID:</label>
            <input
              type="text"
              id="userId"
              name="userId"
              placeholder="Enter User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded text-black"
            />
          </div>
          <Link legacyBehavior href={`/chats/list/${userId}`}>
            <a 
              className="w-full p-2 bg-blue-500 text-white font-bold rounded block text-center"
            >
              Submit
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ChatForm;
