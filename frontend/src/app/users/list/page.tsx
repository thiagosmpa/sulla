"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const LIST_URL = `${BACKEND_URL}/api/users/list-user`;
const UPDATE_URL = `${BACKEND_URL}/api/users/update-user`;
const DELETE_URL = `${BACKEND_URL}/api/users/delete-user`;

type User = {
  userId: string;
  name: string;
  email: string;
  agenda: string;
  instructions: string;
};

fetch(LIST_URL)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));


const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedInstructions, setSelectedInstructions] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [loadingUpdate, setLoadingUpdate] = useState<boolean>(false);
  const [loadingDelete, setLoadingDelete] = useState<boolean>(false);

useEffect(() => {
  axios.get(LIST_URL)
    .then(response => {
      console.log("Dados recebidos:", response.data);
      setUsuarios(response.data.data.users);
      setLoading(false);
    })
    .catch(error => {
      console.error("Erro ao carregar dados:", error);
      setError(error.message);
      setLoading(false);
    });
}, []);


  const handleOpenPopup = (instructions: string) => {
    setSelectedInstructions(instructions);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedInstructions(null);
  };

  const handlePopupClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClosePopup();
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
  };

  const handleUpdate = async () => {
    if (editUser) {
      setLoadingUpdate(true);
      try {
        const response = await axios.post(UPDATE_URL, editUser);
        const updatedUser = response.data.data.user;
        setUsuarios((prev) =>
          prev.map((user) => (user.userId === updatedUser.userId ? updatedUser : user))
        );
        setEditUser(null);
      } catch (error) {
        console.error('Error updating user:', error);
      } finally {
        setLoadingUpdate(false);
      }
    }
  };

  const handleRemove = async (userId: string) => {
    setLoadingDelete(true);
    try {
      await axios.post(DELETE_URL, { userId });
      setUsuarios((prev) => prev.filter((user) => user.userId !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoadingDelete(false);
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
      <h1 className="text-5xl font-bold">Lista de Usuários</h1>
      <div className='h-full flex flex-col items-center justify-center text-white p-8'>
        
        <div className="overflow-x-auto overflow-y-auto w-full">
          <table className="min-w-full table-auto bg-gray-800 rounded-lg">
            <thead>
              <tr>
                <th className="py-3 px-4 bg-gray-700 text-left">ID</th>
                <th className="py-3 px-4 bg-gray-700 text-left">Nome</th>
                <th className="py-3 px-4 bg-gray-700 text-left">Agenda</th>
                <th className="py-3 px-4 bg-gray-700 text-left">Instruções</th>
                <th className="py-3 px-4 bg-gray-700 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.userId} className="border-t border-gray-700">
                  <td className="py-3 px-4">{usuario.userId}</td>
                  <td className="py-3 px-4">{usuario.name}</td>
                  <td className="py-3 px-4">{usuario.agenda}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleOpenPopup(usuario.instructions)}
                      className="text-blue-500 hover:underline"
                    >
                      Ver Instruções
                    </button>
                  </td>
                  <td className="py-3 px-4 space-x-2">
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="text-yellow-500 hover:underline mr-4"
                    >
                      {loadingUpdate && editUser?.userId === usuario.userId ? 'Atualizando...' : 'Editar'}
                    </button>
                    <button
                      onClick={() => handleRemove(usuario.userId)}
                      className="text-red-500 hover:underline"
                    >
                      {loadingDelete ? 'Removendo...' : 'Remover'}
                    </button>
                  </td>
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
            <div className="text-start bg-gray-800 p-4 rounded shadow-lg max-w-2xl w-full h-3/4 overflow-y-scroll transparent-scrollbar">
              <h2 className="text-xl text-center font-bold mb-4 text-white">Instruções</h2>
              <p className="mb-4 text-white">{selectedInstructions}</p>
            </div>
          </div>
        )}

        {editUser && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
            <div className="bg-gray-800 p-4 rounded shadow-lg max-w-md w-full h-1/2">
              <h2 className="text-xl font-bold mb-4 text-white">Editar Usuário</h2>
              <label htmlFor="name" className="block text-white font-bold mb-2">Nome:</label>
              <input
                type="text"
                id="name"
                value={editUser.name}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                className="mb-2 p-2 w-full text-black"
              />
              <label htmlFor="agenda" className="block text-white font-bold mb-2">Agenda:</label>
              <input
                type="text"
                id="agenda"
                value={editUser.agenda}
                onChange={(e) => setEditUser({ ...editUser, agenda: e.target.value })}
                className="mb-2 p-2 w-full text-black"
              />
              <label htmlFor="instructions" className="block text-white font-bold mb-2">Instruções:</label>
              <textarea
                id="instructions"
                value={editUser.instructions}
                onChange={(e) => setEditUser({ ...editUser, instructions: e.target.value })}
                className="mb-2 p-2 w-full text-black h-1/2 overflow-y-scroll transparent-scrollbar"
              />
              <button
                onClick={handleUpdate}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                disabled={loadingUpdate}
              >
                {loadingUpdate ? 'Atualizando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setEditUser(null)}
                className="ml-2 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;