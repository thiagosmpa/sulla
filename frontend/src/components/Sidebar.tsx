import React from 'react';
import Link from 'next/link';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col justify-center p-4 h-screen">
      <nav className='flex flex-col justify-between h-full'>
        <ul>
        <li className="mb-4">
          <Link legacyBehavior href="/">
              <a className="p-2 bg-blue-500 hover:bg-blue-600 rounded block text-center">Home</a>
            </Link>
          </li>
        </ul>
        <ul className="flex flex-col justify-center flex-grow">
          <li className="mb-4">
          <Link legacyBehavior href="/users/create">
              <a className="p-2 bg-blue-500 hover:bg-blue-600 rounded block text-center">Cadastrar Usuário</a>
            </Link>
          </li>
          <li className="mb-4">
          <Link legacyBehavior href="/users/list">
              <a className="p-2 bg-blue-500 hover:bg-blue-600 rounded block text-center">Listar Usuários</a>
            </Link>
          </li>
          <li className="mb-4">
          <Link legacyBehavior href="/chats/">
              <a className="p-2 bg-blue-500 hover:bg-blue-600 rounded block text-center">Listar Chats</a>
            </Link>
          </li>
          <li>
            <Link legacyBehavior href="/whatsapp">
              <a className="p-2 bg-blue-500 hover:bg-blue-600 rounded block text-center">Conectar WhatsApp</a>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
