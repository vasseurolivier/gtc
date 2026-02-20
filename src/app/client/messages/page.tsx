'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, MessageSquare, User, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { sendChatMessage } from '@/actions/messages';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ClientMessagesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'clients', user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'clients', user.uid, 'messages'), orderBy('createdAt', 'asc'));
  }, [db, user]);
  const { data: messages, isLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || isSending) return;

    setIsSending(true);
    const result = await sendChatMessage(user.uid, {
      senderId: user.uid,
      senderName: `${profile?.firstName} ${profile?.lastName}`,
      text: inputText.trim(),
      isAdmin: false
    });

    if (result.success) {
      setInputText('');
    } else {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'envoyer le message." });
    }
    setIsSending(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-zinc-900">Support & Messages</h1>
        <p className="text-zinc-500 mt-2">Discutez directement avec nos agents en Chine pour vos projets.</p>
      </div>

      <Card className="border-none shadow-xl bg-white overflow-hidden flex flex-col h-[70vh]">
        <CardHeader className="bg-zinc-50 border-b border-zinc-100 flex flex-row items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Fil de discussion</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Réponse sous 24h ouvrées</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-y-auto p-6 space-y-6" ref={scrollRef}>
          {isLoading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : messages && messages.length > 0 ? (
            messages.map((msg: any) => (
              <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.isAdmin ? "mr-auto items-start" : "ml-auto items-end")}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-black uppercase text-zinc-400">{msg.isAdmin ? "Agent GTC" : "Vous"}</span>
                  <span className="text-[9px] text-zinc-300">{msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm', { locale: fr }) : ''}</span>
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.isAdmin 
                    ? "bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200" 
                    : "bg-primary text-white rounded-tr-none shadow-primary/20"
                )}>
                  {msg.text}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <MessageSquare className="h-16 w-16" />
              <p className="font-bold">Aucun message pour le moment.<br />Posez votre première question ci-dessous.</p>
            </div>
          )}
        </CardContent>

        <div className="p-4 bg-zinc-50 border-t border-zinc-100">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea 
              placeholder="Tapez votre message ici..." 
              className="bg-white border-zinc-200 rounded-xl resize-none h-14" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button type="submit" disabled={!inputText.trim() || isSending} className="h-14 w-14 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              {isSending ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4 items-center">
          <div className="h-10 w-10 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0"><ShieldCheck className="h-5 w-5" /></div>
          <p className="text-xs text-blue-700 font-medium">Vos échanges sont cryptés et accessibles uniquement par nos agents qualifiés.</p>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-4 items-center">
          <div className="h-10 w-10 bg-orange-500 text-white rounded-full flex items-center justify-center shrink-0"><User className="h-5 w-5" /></div>
          <p className="text-xs text-orange-700 font-medium">Un agent dédié est assigné à votre compte pour garantir une continuité dans le suivi.</p>
        </div>
      </div>
    </div>
  );
}
