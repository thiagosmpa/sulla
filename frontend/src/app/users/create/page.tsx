"use client";
import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const API_URL = `${BACKEND_URL}/api/users/create-user`;

const CreateUser: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [agenda, setAgenda] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateUser = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await axios.post(API_URL, {
        name,
        agenda,
        instructions
      });
      setResponse(res.data.status);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data.message || err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full h-full flex flex-col justify-center items-center text-center text-white'>
      <h1 className="text-5xl font-bold">Cadastrar Usuário</h1>
      
      <div className='w-1/2 h-full flex flex-col items-center justify-center text-white p-8'>
        <div className="w-full bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="mb-4 text-left">
            <label htmlFor="name" className="block text-gray-300 font-bold mb-2">Nome:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded text-black"
            />
          </div>
          <div className="mb-4 text-left">
            <label htmlFor="agenda" className="block text-gray-300 font-bold mb-2">Agenda:</label>
            <input
              type="text"
              id="agenda"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="w-full px-3 py-2 border rounded text-black"
            />
          </div>
          <div className="mb-4 text-left">
            <label htmlFor="instructions" className="block text-gray-300 font-bold mb-2">Instruções:</label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 border rounded text-black h-32 overflow-y-scroll"
            />
          </div>
          <button
            onClick={handleCreateUser}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar Usuário'}
          </button>
          {response && <div className="mt-4 text-green-500">{response}</div>}
          {error && <div className="mt-4 text-red-500">Erro: {error}</div>}
        </div>
      </div>
    </div>
  );
};

export default CreateUser;
