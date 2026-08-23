import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { Send, User } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Message {
  message_id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

export default function InternalMessaging() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to Socket.io server
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000', {
      withCredentials: true,
    });
    setSocket(newSocket);

    // If user belongs to a department, join that room
    if (user?.assignments?.[0]?.location?.department) {
      newSocket.emit('join_department', user.assignments[0].location.department);
    }

    newSocket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socket || !user) return;
    
    const newMessage = {
      message_id: Date.now(), // Temp ID until server saves
      sender_id: user.user_id,
      content: input,
      created_at: new Date().toISOString(),
    };

    socket.emit('send_message', newMessage);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-earth-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-earth-200 bg-polli-50 flex items-center gap-3">
        <div className="bg-polli-200 p-2 rounded-full">
          <User className="h-5 w-5 text-polli-700" />
        </div>
        <div>
          <h3 className="font-semibold text-earth-800">Department Chat</h3>
          <p className="text-xs text-earth-500">Live Communication</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-earth-50">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.user_id;
          return (
            <div key={msg.message_id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[70%] rounded-lg px-4 py-2 text-sm",
                isMe ? "bg-polli-600 text-white rounded-br-none" : "bg-white text-earth-800 border border-earth-200 rounded-bl-none shadow-sm"
              )}>
                <p>{msg.content}</p>
                <span className={cn("text-[10px] mt-1 block opacity-70", isMe ? "text-polli-100" : "text-earth-400")}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-earth-200 bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-earth-300 rounded-md focus:outline-none focus:ring-2 focus:ring-polli-500 text-sm"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-polli-600 text-white p-2 rounded-md hover:bg-polli-700 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
