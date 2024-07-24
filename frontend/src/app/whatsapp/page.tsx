"use client";
import React, { useState } from 'react';
import axios from 'axios';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
const API_URL = '/api/whatsapp/connect';
const CONECTAR_URL = `${backendUrl}${API_URL}`;

const ConnectWhatsApp: React.FC = () => {
  const [id, setId] = useState<string>('');

  const handleConnect = async () => {
    try {
      await axios.post(CONECTAR_URL, { id });
      alert('Requisição enviada com sucesso');
    } catch (error) {
      alert('Erro ao enviar a requisição');
    }
  };

  return (
    <div className='w-full h-full flex flex-col justify-center items-center text-center text-white'>
      <h1 className="text-5xl font-bold">Conectar ao WhatsApp</h1>
      
      <div className='w-1/2 h-full flex flex-col items-center justify-center text-white p-8'>
        <div className="w-full bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="mb-4 text-left">
            <label htmlFor="id" className="block text-gray-300 font-bold mb-2">ID:</label>
            <input
              type="text"
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 border rounded text-black"
            />
          </div>
          <button
            onClick={handleConnect}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Conectar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectWhatsApp;
