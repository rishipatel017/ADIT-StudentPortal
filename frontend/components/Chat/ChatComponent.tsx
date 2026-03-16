import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Select, Card } from '../../components/UI';
import { useSemesters, useDivisions } from '../../hooks/useAcademicData';

interface ChatMessage {
  id: number;
  message: string;
  senderId: number;
  senderRole: string;
  createdAt: string;
  sender: {
    id: number;
    email: string;
    student?: { name: string };
    faculty?: { name: string };
    admin?: { name: string };
  };
}

interface ChatProps {
  context: 'STUDENT' | 'FACULTY' | 'ADMIN';
  defaultDepartmentId?: number;
  defaultSemesterId?: number;
  defaultDivisionId?: number;
}

export const ChatComponent: React.FC<ChatProps> = ({ 
  context, 
  defaultDepartmentId, 
  defaultSemesterId, 
  defaultDivisionId 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    departmentId: defaultDepartmentId || '',
    semesterId: defaultSemesterId || '',
    divisionId: defaultDivisionId || '',
    skip: 0,
    limit: 50
  });
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load academic data for filters
  const [departments, setDepartments] = useState<any[]>([]);
  const { options: semesterOptions } = useSemesters();
  const { options: divisionOptions } = useDivisions(filters.semesterId ? Number(filters.semesterId) : undefined);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/admin/departments');
        setDepartments(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    if (context === 'ADMIN') fetchDepartments();
  }, [context]);

  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));

  const fetchMessages = async (append = false) => {
    try {
      const response = await api.get('/chat/messages', { params: filters });
      const newMessages = response.data;
      
      if (newMessages.length < filters.limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (append) {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
      } else {
        setMessages(newMessages.reverse());
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [filters]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      await api.post('/chat/send', {
        message: newMessage,
        departmentId: filters.departmentId ? Number(filters.departmentId) : undefined,
        semesterId: filters.semesterId ? Number(filters.semesterId) : undefined,
        divisionId: filters.divisionId ? Number(filters.divisionId) : undefined,
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderName = (msg: ChatMessage) => {
    return msg.sender?.student?.name || msg.sender?.faculty?.name || msg.sender?.admin?.name || msg.sender?.email || 'Unknown User';
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <Card.Header className="flex justify-between items-center bg-gray-50 flex-wrap gap-4 py-3">
        <h3 className="text-lg font-medium text-gray-900">Department Chat</h3>
        {context !== 'STUDENT' && (
          <div className="flex gap-2 items-center">
            {context === 'ADMIN' && (
              <Select 
                placeholder="Dept" 
                value={filters.departmentId} 
                onChange={(e) => setFilters(prev => ({...prev, departmentId: e.target.value}))}
                options={departmentOptions}
                className="w-32 text-xs"
              />
            )}
            <Select 
              placeholder="Sem" 
              value={filters.semesterId} 
              onChange={(e) => setFilters(prev => ({...prev, semesterId: e.target.value}))}
              options={semesterOptions}
              className="w-24 text-xs"
            />
            <Select 
              placeholder="Div" 
              value={filters.divisionId} 
              onChange={(e) => setFilters(prev => ({...prev, divisionId: e.target.value, semesterId: filters.semesterId}))}
              options={divisionOptions}
              disabled={!filters.semesterId}
              className="w-24 text-xs"
            />
            <Button                variant="secondary" 
              size="sm" 
              onClick={() => {
                setFilters({ departmentId: '', semesterId: '', divisionId: '', skip: 0, limit: 50 });
                setHasMore(true);
              }}
              className="px-2 py-1 h-auto text-xs"
            >
              Clear
            </Button>
          </div>
        )}
      </Card.Header>
      
      <Card.Body className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
        {hasMore && messages.length >= filters.limit && (
          <div className="text-center">
            <button 
              onClick={() => {
                setFilters(prev => ({ ...prev, skip: prev.skip + prev.limit }));
                fetchMessages(true);
              }}
              className="text-xs text-purple-600 hover:underline"
            >
              Load more messages
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-auto">No messages in this chat yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                {!isMe && (
                  <span className="text-xs text-gray-500 ml-1 mb-1">
                    {getSenderName(msg)} • {msg.senderRole}
                  </span>
                )}
                <div 
                  className={`px-4 py-2 rounded-2xl ${
                    isMe 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <span className={`text-[10px] mt-1 block ${isMe ? 'text-purple-200 text-right' : 'text-gray-400'}`}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Card.Body>

      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" variant="primary" disabled={!newMessage.trim() || loading}>
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </Card>
  );
};
