import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, RefreshCw, Calendar, CreditCard, ChevronRight, Lock, RotateCcw } from 'lucide-react';
import { chatbotService } from '../../services/chatbotService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_GREETING = {
  id: 'greeting',
  sender: 'bot',
  text: 'Xin chào bạn! 👋 Tôi là **Trợ lý AI của Phòng Khám Nha Khoa**.\n\nTôi có thể giúp bạn:\n- 👨‍⚕️ Tra cứu lịch trực của các bác sĩ trong 5 ngày tới\n- 💰 Hỏi giá các dịch vụ (nhổ răng, tẩy trắng, niềng răng...)\n- 📅 Hướng dẫn đặt lịch khám giữ chỗ trước\n\nBạn cần hỏi gì hôm nay ạ?',
  time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  suggestions: ['Bác sĩ nào trực hôm nay?', 'Bảng giá nhổ răng khôn', 'Bảng giá lấy cao răng', 'Cách đặt lịch khám'],
};

export default function ChatbotWidget({ onOpenLogin }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([DEFAULT_GREETING]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const historyLoadedRef = useRef(false);

  // Reset cờ tải lịch sử khi user thay đổi (đăng nhập / đăng xuất)
  useEffect(() => {
    historyLoadedRef.current = false;
    if (!user) {
      setMessages([DEFAULT_GREETING]);
    }
  }, [user]);

  // Chỉ tải lịch sử từ Redis 1 LẦN DUY NHẤT khi mở widget lần đầu
  useEffect(() => {
    if (isOpen && user && !historyLoadedRef.current) {
      const loadHistory = async () => {
        try {
          const res = await chatbotService.getHistory();
          const history = res.data?.result;
          if (Array.isArray(history) && history.length > 0) {
            setMessages(history.map((m, idx) => ({ ...m, id: m.id || idx })));
          }
          historyLoadedRef.current = true;
        } catch {
          // Giữ nguyên tin nhắn mặc định nếu lỗi
        }
      };
      loadHistory();
    }
  }, [isOpen, user]);

  const handleClearHistory = async () => {
    if (loading) return;
    try {
      await chatbotService.clearHistory();
    } catch {
      // Bỏ qua lỗi
    }
    setMessages([DEFAULT_GREETING]);
    historyLoadedRef.current = true;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    if (!user) {
      onOpenLogin?.();
      return;
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await chatbotService.sendMessage(text);
      const result = res.data?.result;
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: result?.reply || 'Dạ tôi đã ghi nhận câu hỏi, bạn có cần hỗ trợ thêm thông tin gì khác không ạ?',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions: result?.suggestions || [],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Lỗi gửi tin nhắn chatbot:', err);
      let errorText = 'Dạ xin lỗi bạn, hiện tại kết nối đến trợ lý AI đang gián đoạn hoặc chưa khởi động dịch vụ `chatbot-service`. Bạn vui lòng thử lại sau nhé!';
      if (err.response?.status === 401) {
        errorText = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại để tiếp tục trò chuyện cùng AI!';
        onOpenLogin?.();
      } else if (err.response?.data?.message) {
        errorText = `Lỗi từ hệ thống: ${err.response.data.message}`;
      }

      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: errorText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions: ['Thử lại', 'Cách đặt lịch khám'],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render text with basic bold support
  const renderFormattedText = (text) => {
    if (!text) return '';
    const parts = text.split('\n');
    return parts.map((line, lIdx) => {
      // Bold handling **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const subParts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          subParts.push(line.substring(lastIndex, match.index));
        }
        subParts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) {
        subParts.push(line.substring(lastIndex));
      }

      return (
        <span key={lIdx} style={{ display: 'block', minHeight: line.trim() === '' ? '8px' : 'auto' }}>
          {subParts.length > 0 ? subParts : line}
        </span>
      );
    });
  };

  return (
    <>
      {/* 1. FLOATING CHAT TRIGGER BUTTON */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '26px',
            right: '26px',
            zIndex: 9998,
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 20px 12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(13, 148, 136, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(13, 148, 136, 0.4)';
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Bot size={22} color="#ffffff" />
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#4ade80',
                border: '2px solid #0d9488',
              }}
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, letterSpacing: '0.2px' }}>Trợ lý AI Nha Khoa</div>
            <div style={{ fontSize: '0.72rem', color: '#ccfbf1' }}>Tư vấn lịch & bảng giá 24/7</div>
          </div>
        </button>
      )}

      {/* 2. CHATBOT WINDOW DIALOG */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 100px)',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(13, 148, 136, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1.5px solid #ccfbf1',
            boxSizing: 'border-box',
            animation: 'fadeInUp 0.2s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Bot size={22} color="#ffffff" />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#4ade80',
                    border: '2px solid #0d9488',
                  }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Trợ Lý AI Nha Khoa</h3>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.25)',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 10,
                    }}
                  >
                    GEMINI
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#ccfbf1', marginTop: 2 }}>
                  Tư vấn & tra cứu lịch trực 24/7
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {user && (
                <button
                  type="button"
                  title="Xóa lịch sử chat"
                  onClick={handleClearHistory}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Action Navigation bar */}
          <div
            style={{
              background: '#f0fdfa',
              borderBottom: '1px solid #ccfbf1',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ color: '#0f766e', fontWeight: 700 }}>Cần đặt hẹn khám ngay?</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/patient/booking');
              }}
              style={{
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '4px 10px',
                fontWeight: 800,
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Vào Đặt Lịch</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: '#fafafa',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    maxWidth: '86%',
                    flexDirection: m.sender === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  {/* Sender Avatar */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: m.sender === 'user' ? '#0d9488' : '#e2e8f0',
                      color: m.sender === 'user' ? '#ffffff' : '#0d9488',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {m.sender === 'user' ? <User size={15} /> : <Bot size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      background: m.sender === 'user' ? '#0d9488' : '#ffffff',
                      color: m.sender === 'user' ? '#ffffff' : '#0f172a',
                      padding: '12px 14px',
                      borderRadius: m.sender === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      fontSize: '0.86rem',
                      lineHeight: 1.5,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                      wordBreak: 'break-word',
                    }}
                  >
                    {renderFormattedText(m.text)}
                    <div
                      style={{
                        fontSize: '0.68rem',
                        marginTop: 4,
                        textAlign: 'right',
                        opacity: 0.7,
                      }}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>

                {/* Suggestions Pills (if bot message has suggestions) */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      marginTop: 8,
                      marginLeft: 36,
                      maxWidth: '85%',
                    }}
                  >
                    {m.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleSend(sug)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #ccfbf1',
                          color: '#0d9488',
                          borderRadius: 14,
                          padding: '4px 10px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0fdfa';
                          e.currentTarget.style.borderColor = '#0d9488';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#ccfbf1';
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 6 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#e2e8f0',
                    color: '#0d9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot size={16} />
                </div>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    color: '#64748b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RefreshCw size={13} className="spin-slow" />
                  <span>Trợ lý AI đang suy nghĩ câu trả lời...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          {!user ? (
            <div
              style={{
                padding: '14px 18px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                <Lock size={16} color="#0d9488" />
                <span>Đăng nhập để trò chuyện với AI</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenLogin?.()}
                style={{
                  background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
                }}
              >
                Đăng nhập
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '12px 14px',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi (lịch bác sĩ, giá khám...)..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0d9488')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || loading}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '12px',
                  background: !inputMessage.trim() || loading ? '#e2e8f0' : '#0d9488',
                  color: !inputMessage.trim() || loading ? '#94a3b8' : '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: !inputMessage.trim() || loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

