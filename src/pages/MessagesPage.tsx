import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle, Send, ArrowLeft, Pin, Archive, Smile,
  Image as ImageIcon, CornerUpLeft, Trash2, AlertCircle, Check, CheckCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useToast } from '../components/ui/Toast';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { timeAgo } from '../lib/utils';
import type { Conversation, Message } from '../types';

export function MessagesPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations with their messages to count unread
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*, buyer:profiles!buyer_id(*), seller:profiles!seller_id(*), product:products(*), messages(id, is_read, sender_id)')
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
        .order('last_message_at', { ascending: false });
      return (data ?? []) as any[] as Conversation[];
    },
    enabled: !!user,
  });

  // Fetch messages in current conversation with replies relation
  const { data: messages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true });
      return (data ?? []) as Message[];
    },
    enabled: !!conversationId && !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  // Mark messages as read
  useEffect(() => {
    if (messages && user && conversationId) {
      messages.forEach((msg) => {
        if (!msg.is_read && msg.sender_id !== user.id) {
          supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          });
        }
      });
    }
  }, [messages, user, conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Mutations
  const sendMessage = async (imageUrl: string | null = null) => {
    if ((!input.trim() && !imageUrl) || !user || !conversationId) return;
    const content = input.trim();
    setInput('');
    setReplyMessage(null);

    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: imageUrl ? 'Sent an image' : content,
      image_url: imageUrl,
      reply_to_message_id: replyMessage?.id || null,
    };

    await supabase.from('messages').insert(messageData);
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !conversationId) return;
    setUploadingImage(true);

    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/chat-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
        sendMessage(publicUrl);
        toast('Image sent successfully', 'success');
      }
    } catch {
      toast('Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const togglePin = async (convo: Conversation) => {
    const isBuyer = convo.buyer_id === user?.id;
    const updates = isBuyer
      ? { is_pinned_buyer: !convo.is_pinned_buyer }
      : { is_pinned_seller: !convo.is_pinned_seller };

    await supabase.from('conversations').update(updates).eq('id', convo.id);
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    toast(Object.values(updates)[0] ? 'Conversation pinned' : 'Conversation unpinned', 'success');
  };

  const toggleArchive = async (convo: Conversation) => {
    const isBuyer = convo.buyer_id === user?.id;
    const updates = isBuyer
      ? { is_archived_buyer: !convo.is_archived_buyer }
      : { is_archived_seller: !convo.is_archived_seller };

    await supabase.from('conversations').update(updates).eq('id', convo.id);
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    toast(Object.values(updates)[0] ? 'Conversation archived' : 'Conversation unarchived', 'success');
    if (Object.values(updates)[0] && convo.id === conversationId) {
      navigate('/messages');
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (confirm('Delete this message for everyone?')) {
      await supabase.from('messages').update({ content: 'This message was deleted', is_deleted: true }).eq('id', msgId);
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    }
  };

  const reportMessage = async (msgId: string) => {
    const reason = prompt('Enter reason for reporting this message:');
    if (reason && reason.trim()) {
      await supabase.from('messages').update({ is_reported: true, report_reason: reason }).eq('id', msgId);
      toast('Message reported to administrators', 'success');
    }
  };

  // Filter conversations
  const filteredConvos = conversations?.filter((c) => {
    const isBuyer = c.buyer_id === user?.id;
    const isArchived = isBuyer ? c.is_archived_buyer : c.is_archived_seller;
    return showArchived ? isArchived : !isArchived;
  }) ?? [];

  // Sort: Pinned conversations first
  const sortedConvos = [...filteredConvos].sort((a, b) => {
    const pinA = a.buyer_id === user?.id ? a.is_pinned_buyer : a.is_pinned_seller;
    const pinB = b.buyer_id === user?.id ? b.is_pinned_buyer : b.is_pinned_seller;
    if (pinA && !pinB) return -1;
    if (!pinA && pinB) return 1;
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });

  const activeConvo = conversations?.find((c) => c.id === conversationId);
  const otherUser = activeConvo?.buyer_id === user?.id ? activeConvo?.seller : activeConvo?.buyer;

  const emojis = ['😊', '👍', '❤️', '😂', '😮', '👏', '🤝', '🔥', '💵'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-black text-neutral-900">{t('messages.title')}</h1>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
        >
          <Archive size={14} />
          {showArchived ? 'Show Active Chats' : 'Show Archived Chats'}
        </button>
      </div>

      <div className="flex h-[calc(100vh-12rem)] bg-white rounded-3xl shadow-card overflow-hidden border border-neutral-100">
        {/* Conversations Sidebar */}
        <div className={`${conversationId ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-neutral-100 overflow-y-auto`}>
          {sortedConvos.length > 0 ? (
            sortedConvos.map((convo) => {
              const other = convo.buyer_id === user?.id ? convo.seller : convo.buyer;
              const isPinned = convo.buyer_id === user?.id ? convo.is_pinned_buyer : convo.is_pinned_seller;
              const unread = convo.messages?.filter((m: any) => !m.is_read && m.sender_id !== user?.id).length ?? 0;

              return (
                <div
                  key={convo.id}
                  className={`flex items-center justify-between p-3 border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors ${convo.id === conversationId ? 'bg-primary-50/40' : ''}`}
                >
                  <Link to={`/messages/${convo.id}`} className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar src={other?.avatar_url} name={other?.full_name} size={40} />
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-primary-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <p className="text-xs font-bold text-neutral-900 truncate">{other?.full_name}</p>
                        <span className="text-[10px] text-neutral-400 shrink-0">{timeAgo(convo.last_message_at)}</span>
                      </div>
                      {convo.product && <p className="text-3xs text-neutral-500 truncate mt-0.5">{convo.product.title}</p>}
                    </div>
                  </Link>

                  {/* Actions (Pin/Archive) */}
                  <div className="flex items-center gap-0.5 ml-2 no-shrink">
                    <button onClick={() => togglePin(convo)} className={`p-1.5 rounded-lg hover:bg-neutral-100 ${isPinned ? 'text-primary-500' : 'text-neutral-300'}`} title="Pin chat">
                      <Pin size={12} className={isPinned ? 'fill-primary-500' : ''} />
                    </button>
                    <button onClick={() => toggleArchive(convo)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-300 hover:text-neutral-500" title="Archive chat">
                      <Archive size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState icon={<MessageCircle size={40} />} title={t('messages.empty')} description={t('messages.emptyDesc')} />
          )}
        </div>

        {/* Messaging Box Area */}
        <div className={`${conversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-neutral-50/50`}>
          {conversationId && activeConvo ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-white">
                <div className="flex items-center gap-3">
                  <Link to="/messages" className="md:hidden text-neutral-500"><ArrowLeft size={18} /></Link>
                  <Avatar src={otherUser?.avatar_url} name={otherUser?.full_name} size={36} />
                  <div>
                    <p className="font-bold text-xs text-neutral-900">{otherUser?.full_name}</p>
                    {activeConvo.product && (
                      <Link to={`/products/${activeConvo.product_id}`} className="text-3xs text-primary-600 hover:underline">
                        Item: {activeConvo.product.title}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat timeline */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages?.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  const replyTo = msg.reply_to_message_id
                    ? messages.find((m) => m.id === msg.reply_to_message_id)
                    : null;

                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`group max-w-[75%] space-y-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                        {/* Replied quote block */}
                        {replyTo && (
                          <div className={`text-[10px] p-2 bg-neutral-100 rounded-xl border border-neutral-200 opacity-80 max-w-xs ${isOwn ? 'mr-1' : 'ml-1'}`}>
                            <p className="font-semibold text-neutral-500">Replying to:</p>
                            <p className="truncate italic">{replyTo.content}</p>
                          </div>
                        )}

                        <div className="flex items-end gap-1.5">
                          {isOwn && (
                            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                              <button onClick={() => setReplyMessage(msg)} className="p-1 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 rounded-lg" title="Reply"><CornerUpLeft size={12} /></button>
                              {!msg.is_deleted && (
                                <button onClick={() => deleteMessage(msg.id)} className="p-1 hover:bg-neutral-200 text-neutral-400 hover:text-error-500 rounded-lg" title="Delete"><Trash2 size={12} /></button>
                              )}
                            </div>
                          )}

                          <div className={`rounded-2xl px-3.5 py-2 text-xs relative ${
                            isOwn
                              ? 'bg-primary-500 text-white rounded-br-sm'
                              : 'bg-white text-neutral-700 shadow-sm border border-neutral-100 rounded-bl-sm'
                          }`}>
                            {msg.image_url ? (
                              <img src={msg.image_url} alt="Sent image" className="max-w-[200px] rounded-lg max-h-[160px] object-cover bg-neutral-100" />
                            ) : (
                              <p className={msg.is_deleted ? 'italic text-neutral-400' : ''}>{msg.content}</p>
                            )}

                            {/* Small timestamp and status */}
                            <div className={`flex items-center gap-1 justify-end text-[9px] mt-1 ${isOwn ? 'text-white/60' : 'text-neutral-400'}`}>
                              <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isOwn && (
                                <span>
                                  {msg.is_read ? <CheckCheck size={10} className="text-white" /> : <Check size={10} />}
                                </span>
                              )}
                            </div>
                          </div>

                          {!isOwn && (
                            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                              <button onClick={() => setReplyMessage(msg)} className="p-1 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 rounded-lg" title="Reply"><CornerUpLeft size={12} /></button>
                              <button onClick={() => reportMessage(msg.id)} className="p-1 hover:bg-neutral-200 text-neutral-400 hover:text-error-500 rounded-lg" title="Report message"><AlertCircle size={12} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply active indicators */}
              {replyMessage && (
                <div className="bg-white border-t border-neutral-100 p-2 px-4 flex justify-between items-center text-2xs animate-slide-up">
                  <p className="text-neutral-500 truncate">Replying to: <span className="font-semibold text-neutral-700 italic">"{replyMessage.content}"</span></p>
                  <button onClick={() => setReplyMessage(null)} className="text-error-500 font-bold hover:underline">Cancel</button>
                </div>
              )}

              {/* Input block */}
              <div className="p-3 border-t border-neutral-100 bg-white space-y-2">
                {/* Emoji panel */}
                {showEmojis && (
                  <div className="flex gap-2 p-1.5 bg-neutral-50 rounded-xl max-w-fit border border-neutral-100 animate-scale-in">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setInput((prev) => prev + emoji);
                          setShowEmojis(false);
                        }}
                        className="text-sm hover:scale-120 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="p-2.5 rounded-xl hover:bg-neutral-100 text-neutral-500 transition-colors"
                    title="Send image"
                  >
                    <ImageIcon size={18} />
                  </button>

                  <button
                    onClick={() => setShowEmojis(!showEmojis)}
                    className="p-2.5 rounded-xl hover:bg-neutral-100 text-neutral-500 transition-colors"
                    title="Emoji picker"
                  >
                    <Smile size={18} />
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={t('messages.typeMessage')}
                    className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim()}
                    className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-2 text-neutral-300" />
                <p className="text-xs">Select a conversation thread to review negotiation messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
