import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { MultiSelect } from '@/components/ui/multi-select';
import type { DataFrameRow } from '@/components/upload-form';

interface ChatPerspectiveViewProps {
  messages: DataFrameRow[];
  users: string[];
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

const ChatPerspectiveView: React.FC<ChatPerspectiveViewProps> = ({ messages, users }) => {
  // Multi-select state: all users selected by default
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(users);
  // Perspective: default to first in selectedParticipants
  const [selectedUser, setSelectedUser] = useState(users[0] || '');

  // Filtered users for perspective dropdown
  const filteredUsers = users.filter(u => selectedParticipants.includes(u));
  // Filter messages to only those from selected participants
  const filteredMessages = messages.filter(m => selectedParticipants.includes(m.user));

  // MultiSelect options
  const participantOptions = users.map(u => ({ label: u, value: u }));

  // Keep perspective user in sync with selected participants
  React.useEffect(() => {
    if (!selectedParticipants.includes(selectedUser)) {
      setSelectedUser(selectedParticipants[0] || '');
    }
  }, [selectedParticipants, selectedUser]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <span>View with perspective of:</span>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {filteredUsers.map(user => (
                <SelectItem key={user} value={user}>{user}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* MultiSelect for participants */}
          <span className="ml-4">Show participants:</span>
          <div className="min-w-[180px] w-full max-w-xs md:max-w-sm flex flex-wrap items-center">
            <MultiSelect
              options={participantOptions}
              value={selectedParticipants}
              onValueChange={setSelectedParticipants}
              placeholder="Select participants"
              className="w-full break-words"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto bg-background rounded-lg p-2 border border-muted/30">
          {filteredMessages.map((msg, idx) => {
            const isSelf = msg.user === selectedUser;
            return (
              <div
                key={idx}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                {/* Sender name */}
                <span
                  className={`mb-1 text-xs font-semibold ${isSelf ? 'text-green-500' : msg.user === selectedUser ? 'text-green-500' : 'text-orange-500'}`}
                  style={{ letterSpacing: 0.2 }}
                >
                  {msg.user}
                </span>
                <div
                  className={`relative px-4 py-2 rounded-2xl shadow-sm max-w-[70%] break-words text-sm font-normal ${isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
                  style={{ borderBottomRightRadius: isSelf ? 4 : 16, borderBottomLeftRadius: isSelf ? 16 : 4 }}
                >
                  <span>{msg.message}</span>
                  <span className="block text-xs text-right mt-1 opacity-70" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(msg.date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatPerspectiveView; 