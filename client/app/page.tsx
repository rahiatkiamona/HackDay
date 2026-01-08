"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Delete, Clock, X, Lock, Unlock, Image, FileText, Upload, Trash2, Mail, Send } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HistoryEntry {
  expression: string;
  result: string;
}

interface VaultItem {
  id: string;
  type: 'image' | 'note';
  content: string;
  title: string;
  date: string;
}

interface Message {
  id: number;
  sender_name: string;
  sender_email: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetDisplay, setResetDisplay] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  // Spy Calculator Features
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [secretCode] = useState("1234"); // Spy mode unlock code
  const [currentSecretCode, setCurrentSecretCode] = useState<string | null>(null);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [showVault, setShowVault] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  
  // Messages State
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [messagingActive, setMessagingActive] = useState(false);
  const [recipientId, setRecipientId] = useState<string>('');
  const [inMessageMode, setInMessageMode] = useState(false);
  const [messageBuffer, setMessageBuffer] = useState<string>('');

  // Encryption mapping: A-Z=1-26, space=27, fullstop=28, comma=29, question=30
  const encryptChar = (char: string): string => {
    const upper = char.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
      return String(upper.charCodeAt(0) - 64);
    }
    if (char === ' ') return '27';
    if (char === '.') return '28';
    if (char === ',') return '29';
    if (char === '?') return '30';
    return '';
  };

  const decryptMessage = (encrypted: string): string => {
    const numbers = encrypted.split('+');
    return numbers.map(num => {
      const n = parseInt(num);
      if (n >= 1 && n <= 26) return String.fromCharCode(64 + n);
      if (n === 27) return ' ';
      if (n === 28) return '.';
      if (n === 29) return ',';
      if (n === 30) return '?';
      return '';
    }).join('');
  };

  const handleNumber = (num: string) => {
    if (resetDisplay) {
      setDisplay(num);
      setResetDisplay(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (resetDisplay) {
      setDisplay("0.");
      setResetDisplay(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperation = (op: string) => {
    // If in message mode with recipient set, treat + as a character, not an operation
    if (inMessageMode && recipientId && op === "+") {
      setDisplay(display === "0" ? op : display + op);
      return;
    }

    const currentValue = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(currentValue);
    } else if (operation) {
      const result = calculate(previousValue, currentValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }
    
    setOperation(op);
    setResetDisplay(true);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "×":
        return prev * current;
      case "÷":
        return prev / current;
      default:
        return current;
    }
  };

  // Message Functions
  const authenticateUser = async (code: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/auth/secret-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret_code: code })
      });

      if (response.ok) {
        setCurrentSecretCode(code);
        fetchMessages();
      } else {
        setDisplay("INVALID");
        setTimeout(() => setDisplay("0"), 1500);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setDisplay("ERROR");
      setTimeout(() => setDisplay("0"), 1500);
    }
  };

  const fetchMessages = async () => {
    if (!currentSecretCode) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/messages/${currentSecretCode}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    }
  };

  const sendEncryptedMessage = async (encryptedMsg: string) => {
    try {
      console.log('Sending encrypted message:', {
        recipientId,
        currentSecretCode,
        encryptedMsg
      });
      
      // Always show as sent and add to history immediately
      const historyEntry = {
        expression: `TO:${recipientId}`,
        result: 'SENT'
      };
      setHistory([historyEntry, ...history]);
      setDisplay('SENT');
      
      // Try to send to backend in background
      fetch(`http://localhost:4000/api/messages?user_id=${recipientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: `Spy ${currentSecretCode}`,
          sender_email: `spy${currentSecretCode}@secure.com`,
          subject: 'Encrypted',
          content: encryptedMsg
        })
      }).then(response => {
        console.log('Message sent to backend. Status:', response.status);
        if (response.ok) {
          console.log('Message successfully delivered');
        } else {
          response.text().then(text => {
            console.warn('Backend error:', text);
          });
        }
      }).catch(error => {
        console.error('Failed to reach backend:', error);
      });
      
      setTimeout(() => setDisplay('0'), 1500);
    } catch (error) {
      console.error('Failed to send message - Error:', error);
      setDisplay('ERROR');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  const encodeAndSendMessage = async (message: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/messages?secret_code=${recipientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: `User ${currentSecretCode}`,
          sender_email: `user${currentSecretCode}@spy.com`,
          subject: 'Secret Message',
          content: message
        })
      });

      if (response.ok) {
        const historyEntry = {
          expression: `TO:${recipientId}`,
          result: message.substring(0, 20) + (message.length > 20 ? '...' : '')
        };
        setHistory([historyEntry, ...history]);
        setDisplay('SENT');
        setTimeout(() => setDisplay('0'), 1500);
        setRecipientId('');
      } else {
        setDisplay('FAILED');
        setTimeout(() => setDisplay('0'), 1500);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setDisplay('ERROR');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  const handleEquals = async () => {
    const inputBuffer = display;

    // Check for messaging mode activation (111)
    if (inputBuffer === "111" && isUnlocked && currentSecretCode) {
      setInMessageMode(true);
      setMessageBuffer('');
      setRecipientId('');
      setDisplay("MSG MODE");
      setTimeout(() => setDisplay("TO?"), 1000);
      return;
    }

    // If in message mode
    if (inMessageMode) {
      // First, set recipient if not set
      if (!recipientId && /^\d{4}$/.test(inputBuffer)) {
        setRecipientId(inputBuffer);
        setDisplay("TO:" + inputBuffer);
        setTimeout(() => {
          setDisplay("MSG?");
          setTimeout(() => setDisplay("0"), 500);
        }, 1000);
        return;
      }

      // If recipient set and we have a message, send it
      if (recipientId && inputBuffer.length > 0) {
        await sendEncryptedMessage(inputBuffer);
        setInMessageMode(false);
        setMessageBuffer('');
        setRecipientId('');
        return;
      }
      return;
    }

    // Check current user ID command (type 67 and press =)
    if (inputBuffer === "67") {
      if (currentSecretCode) {
        setDisplay(currentSecretCode);
        setTimeout(() => setDisplay("0"), 2000);
      } else {
        setDisplay("SET ID");
        setTimeout(() => setDisplay("0"), 1500);
      }
      return;
    }

    // Check if matches spy mode unlock code (1234)
    if (inputBuffer === secretCode) {
      setIsUnlocked(true);
      setShowHistory(true);
      setMessagingActive(true);
      setDisplay("SPY MODE");
      setTimeout(() => setDisplay("0"), 1500);
      return;
    }

    // If spy mode active but no identity set, set identity with 4-digit code
    if (isUnlocked && !currentSecretCode && /^\d{4}$/.test(inputBuffer)) {
      await authenticateUser(inputBuffer);
      setDisplay("ID SET");
      setTimeout(() => setDisplay("0"), 1500);
      return;
    }

    // If messaging active, encode and send message
    if (messagingActive && currentSecretCode) {
      // Check if setting recipient (4-digit secret code)
      if (/^\d{4}$/.test(inputBuffer) && inputBuffer !== secretCode) {
        setRecipientId(inputBuffer);
        setDisplay("TO:" + inputBuffer);
        setTimeout(() => setDisplay("0"), 1500);
        return;
      }

      // If we have recipient and message text
      if (recipientId && inputBuffer.length > 0) {
        await encodeAndSendMessage(inputBuffer);
        return;
      }

      // No recipient set
      if (!recipientId) {
        setDisplay("SET TO: ID");
        setTimeout(() => setDisplay("0"), 1500);
        return;
      }
    }

    // Normal calculation (only if not in message mode)
    if (operation && previousValue !== null && !inMessageMode) {
      const currentValue = parseFloat(inputBuffer);
      const result = calculate(previousValue, currentValue, operation);
      
      const expression = `${previousValue} ${operation} ${currentValue} =`;
      setHistory([{ expression, result: String(result) }, ...history]);
      
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setResetDisplay(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setResetDisplay(false);
  };

  const handleClearEntry = () => {
    setDisplay("0");
    setResetDisplay(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handlePercent = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
    setResetDisplay(true);
  };

  const handlePlusMinus = () => {
    const value = parseFloat(display);
    setDisplay(String(-value));
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  // Spy Calculator Functions
  const handleAddNote = () => {
    if (newNote.trim() && noteTitle.trim()) {
      const item: VaultItem = {
        id: Date.now().toString(),
        type: 'note',
        content: newNote,
        title: noteTitle,
        date: new Date().toLocaleDateString()
      };
      setVaultItems([item, ...vaultItems]);
      setNewNote("");
      setNoteTitle("");
    }
  };

  const handleDeleteVaultItem = (id: string) => {
    setVaultItems(vaultItems.filter(item => item.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const item: VaultItem = {
          id: Date.now().toString(),
          type: 'image',
          content: reader.result as string,
          title: file.name,
          date: new Date().toLocaleDateString()
        };
        setVaultItems([item, ...vaultItems]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLockVault = () => {
    setIsUnlocked(false);
    setShowVault(false);
    setDisplay("0");
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await fetch(`http://localhost:4000/api/messages/${messageId}/read`, {
        method: 'PATCH'
      });
      fetchMessages();
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await fetch(`http://localhost:4000/api/messages/${messageId}`, {
        method: 'DELETE'
      });
      fetchMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] overflow-hidden">
      {/* Mobile Container */}
      <div className="relative w-[380px] h-[780px] bg-[#1a1d1a] rounded-[40px] shadow-2xl overflow-hidden flex flex-col border-8 border-[#0a0a0a]">
      {/* Vault View (Hidden Area) */}
      {isUnlocked && showVault ? (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-[#252525] to-[#2d2d2d] animate-in fade-in slide-in-from-right duration-300">
          {/* Vault Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#3b3b3b]">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-green-400" />
              <h1 className="text-white text-lg font-normal">Secret Vault</h1>
            </div>
            <Button
              onClick={handleLockVault}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Lock
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Add New Items */}
            <div className="mb-6 space-y-4">
              <div className="bg-[#3b3b3b] p-4 rounded-lg">
                <h3 className="text-white mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Add Secret Note
                </h3>
                <Input
                  placeholder="Note title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="mb-2 bg-[#2d2d2d] text-white border-[#555]"
                />
                <textarea
                  placeholder="Write your secret note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full h-24 bg-[#2d2d2d] text-white border border-[#555] rounded-md p-2 resize-none"
                />
                <Button
                  onClick={handleAddNote}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white w-full"
                >
                  Add Note
                </Button>
              </div>

              <div className="bg-[#3b3b3b] p-4 rounded-lg">
                <h3 className="text-white mb-3 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Add Secret Image
                </h3>
                <label className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-md cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Vault Items */}
            <div className="space-y-3">
              <h3 className="text-white text-lg mb-3">Your Secret Items ({vaultItems.length})</h3>
              {vaultItems.length === 0 ? (
                <div className="text-center text-[#8e8e8e] py-8">
                  No items in vault yet. Add notes or images to get started.
                </div>
              ) : (
                vaultItems.map((item) => (
                  <div key={item.id} className="bg-[#3b3b3b] p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {item.type === 'image' ? (
                          <Image className="h-4 w-4 text-blue-400" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-400" />
                        )}
                        <span className="text-white font-medium">{item.title}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteVaultItem(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-[#8e8e8e] text-xs mb-2">{item.date}</div>
                    {item.type === 'image' ? (
                      <img src={item.content} alt={item.title} className="w-full rounded-md mt-2" />
                    ) : (
                      <p className="text-white whitespace-pre-wrap">{item.content}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Info Footer */}
          <div className="p-3 border-t border-[#3b3b3b] text-center text-[#8e8e8e] text-sm">
            🔒 Secret Code: Enter "{secretCode}" and press = to access vault
          </div>
        </div>
      ) : (
        /* Calculator View */
        <>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-2 px-3 py-2">
                <div className="flex items-center gap-3">
                  <button className="text-white text-base hover:bg-[#3b3b3b] p-2 rounded transition-all duration-150">☰</button>
                  <h1 className="text-white text-base font-normal">Standard</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setShowHistory(!showHistory);
                      if (!showHistory && isUnlocked && messages.length === 0) {
                        fetchMessages();
                      }
                    }}
                    className="text-white hover:bg-[#3b3b3b] p-2 rounded transition-all duration-150 hover:rotate-12"
                    title={isUnlocked ? "History & Messages" : "History"}
                  >
                    <Clock className="h-5 w-5" />
                    {isUnlocked && messages.filter(m => !m.is_read).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {messages.filter(m => !m.is_read).length}
                      </span>
                    )}
                  </button>
                  {isUnlocked && (
                    <button
                      onClick={() => setShowVault(true)}
                      className="text-green-400 hover:bg-[#3b3b3b] p-2 rounded transition-all duration-150 animate-pulse"
                      title="Open Vault"
                    >
                      <Lock className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Display */}
              <div className="flex-1 flex flex-col items-end justify-end px-6 pb-6 min-h-[200px]">
                <div className="text-right text-[#8a9a8a] text-xl font-light mb-2">
                  {previousValue !== null && operation ? `${previousValue} ${operation} ${display}` : ''}
                </div>
                <div className="text-right text-white text-6xl font-light tracking-tight break-all leading-tight transition-all duration-150 animate-in fade-in">
                  {operation && previousValue !== null ? '=' : ''} {display}
                </div>
              </div>

              {/* Calculator Buttons */}
              <div className="grid grid-cols-4 gap-3 px-6 pb-6">
                {/* Row 1 */}
                <Button
                  onClick={handleClear}
                  className="h-20 bg-[#6eb9f7] hover:bg-[#7ec5ff] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-lg font-semibold border-none rounded-xl transition-all duration-150 shadow-lg hover:shadow-xl"
                >
                  AC
                </Button>
                <Button
                  onClick={() => {}}
                  className="h-20 bg-[#2d5f7e] hover:bg-[#3a7a9e] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  ( )
                </Button>
                <Button
                  onClick={handlePercent}
                  className="h-20 bg-[#2d5f7e] hover:bg-[#3a7a9e] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  %
                </Button>
                <Button
                  onClick={() => handleOperation("÷")}
                  className="h-20 bg-[#2d5f7e] hover:bg-[#3a7a9e] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  ÷
                </Button>

                {/* Row 2 */}
                <Button
                  onClick={() => handleNumber("7")}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  7
                </Button>
                <Button
                  onClick={() => handleNumber("8")}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  8
                </Button>
                <Button
                  onClick={() => handleNumber("9")}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  9
                </Button>
                <Button
                  onClick={() => handleOperation("×")}
                  className="h-20 bg-[#2d5f7e] hover:bg-[#3a7a9e] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  ×
                </Button>

                {/* Row 3 */}
                <Button
                  onClick={() => handleNumber("4")}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  4
                </Button>
                <Button
                  onClick={() => handleNumber("5")}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  5
                </Button>
                <Button
                  onClick={() => handleNumber("6")}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  6
                </Button>
                <Button
                  onClick={() => handleOperation("-")}
                  className="h-20 bg-[#2d5f7e] hover:bg-[#3a7a9e] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-3xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  −
                </Button>

                {/* Row 4 */}
                <Button
                  onClick={() => handleNumber("1")}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  1
                </Button>
                <Button
                  onClick={() => handleNumber("2")}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  2
                </Button>
                <Button
                  onClick={() => handleNumber("3")}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  3
                </Button>
                <Button
                  onClick={() => handleOperation("+")}
                  className="h-20 bg-[#2d5f7e] hover:bg-[#3a7a9e] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-3xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  +
                </Button>

                {/* Row 5 */}
                <Button
                  onClick={() => handleNumber("0")}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-2xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  0
                </Button>
                <Button
                  onClick={handleDecimal}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-3xl font-light border-none rounded-xl transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  .
                </Button>
                <Button
                  onClick={handleBackspace}
                  className="h-20 bg-[#2a2d33] hover:bg-[#3a3d43] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white border-none rounded-xl flex items-center justify-center transition-all duration-150 shadow-md hover:shadow-lg"
                >
                  <Delete className="h-6 w-6" />
                </Button>
                <Button
                  onClick={handleEquals}
                  className="h-20 bg-[#1e8449] hover:bg-[#239b56] active:scale-95 focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d1a] text-white text-3xl font-semibold border-none rounded-xl transition-all duration-150 shadow-lg hover:shadow-xl hover:shadow-green-500/30"
                >
                  =
                </Button>
              </div>
            </div>
          </div>

          {/* History/Messages Overlay - Visible when showHistory is true */}
          {showHistory && (
            <div className="absolute inset-0 z-50 animate-in fade-in duration-300">
              <div className="w-full h-full flex flex-col bg-[#1a1d1a]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#3b3b3b]">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowMessages(false)}
                      className={`px-3 py-2 rounded ${!showMessages ? 'bg-[#1e8449] text-white' : 'bg-[#2a2d33] text-[#8e8e8e]'}`}
                    >
                      History
                    </button>
                    {isUnlocked && (
                      <button
                        onClick={() => { 
                          setShowMessages(true); 
                          if (messages.length === 0) {
                            fetchMessages();
                          }
                        }}
                        className={`px-3 py-2 rounded ${showMessages ? 'bg-[#1e8449] text-white' : 'bg-[#2a2d33] text-[#8e8e8e]'} flex items-center gap-2`}
                      >
                        <Mail className="h-4 w-4" />
                        Messages
                        {messages.filter(m => !m.is_read).length > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {messages.filter(m => !m.is_read).length}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-white hover:bg-[#3b3b3b] p-2 rounded transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  {!showMessages ? (
                    // History View
                    history.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-[#8e8e8e] px-8">
                          <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <div className="text-lg">No history yet</div>
                          <div className="text-sm opacity-70 mt-2">Your calculations will appear here</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-white text-lg font-medium">Calculation History</h3>
                          <button
                            onClick={handleClearHistory}
                            className="text-red-400 hover:text-red-300 text-sm px-3 py-1 bg-[#2a2d33] rounded"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="space-y-2">
                          {history.map((entry, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setDisplay(entry.result);
                                setShowHistory(false);
                              }}
                              className="w-full text-right p-4 bg-[#2a2d33] hover:bg-[#3a3d43] rounded-lg transition-colors"
                            >
                              <div className="text-[#8e8e8e] text-base mb-1">{entry.expression}</div>
                              <div className="text-white text-3xl font-light">{entry.result}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  ) : (
                    // Messages View
                    <div className="flex flex-col h-full">
                      {/* Messages List */}
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-[#8e8e8e] px-8">
                            <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <div className="text-lg">No messages yet</div>
                            <div className="text-sm opacity-70 mt-2">Your secret messages will appear here</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          <div className="mb-4">
                            <h3 className="text-white text-lg font-medium">Messages</h3>
                            <p className="text-xs text-[#8e8e8e] mt-1">Send: Type ID:Message, press =</p>
                          </div>
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`p-4 rounded-lg ${message.is_read ? 'bg-[#2a2d33]' : 'bg-[#2d5f7e]'}`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="text-white font-medium text-lg flex items-center gap-2">
                                    {message.sender_name}
                                    {!message.is_read && (
                                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">New</span>
                                    )}
                                  </div>
                                  <div className="text-[#8e8e8e] text-sm">{message.sender_email}</div>
                                </div>
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                              {message.subject && message.subject !== 'Encrypted' && (
                                <div className="text-white text-base font-medium mb-2">{message.subject}</div>
                              )}
                              <div className="text-[#b0b0b0] text-base mb-3 leading-relaxed">
                                {message.subject === 'Encrypted' ? decryptMessage(message.content) : message.content}
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-[#3b3b3b]">
                                <div className="text-[#6e6e6e] text-sm">
                                  {new Date(message.created_at).toLocaleString()}
                                </div>
                                {!message.is_read && (
                                  <button
                                    onClick={() => handleMarkAsRead(message.id)}
                                    className="text-green-400 hover:text-green-300 text-sm px-3 py-1 bg-green-500/20 rounded"
                                  >
                                    Mark as read
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
