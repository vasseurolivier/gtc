
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Loader2 } from 'lucide-react';


interface Submission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Timestamp | null;
  read: boolean;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }

    const q = query(collection(db, "contactSubmissions"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const subs: Submission[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            subs.push({
              id: doc.id,
              name: data.name || '',
              email: data.email || '',
              subject: data.subject || '',
              message: data.message || '',
              createdAt: data.createdAt || null,
              read: data.read || false,
            } as Submission);
        });
        setSubmissions(subs);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching submissions:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleMarkAsRead = async (id: string) => {
    const submission = submissions.find(s => s.id === id);
    if (!submission || submission.read) return;

    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, read: true } : s));

    try {
        const submissionRef = doc(db, 'contactSubmissions', id);
        await updateDoc(submissionRef, { read: true });
    } catch (error) {
        console.error("Error marking as read:", error);
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, read: false } : s));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Messages de Contact</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
                Aucun message pour le moment.
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {submissions.map((submission) => (
                <AccordionItem value={submission.id} key={submission.id}>
                  <AccordionTrigger 
                    className={`py-4 px-6 hover:no-underline ${!submission.read ? 'font-bold' : ''}`}
                    onClick={() => handleMarkAsRead(submission.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                       <div className="flex items-center gap-4">
                          {!submission.read && <Badge>Nouveau</Badge>}
                          <span className="truncate max-w-xs">{submission.subject}</span>
                          <span className="text-muted-foreground truncate max-w-xs">{submission.name}</span>
                       </div>
                       <span className="text-sm text-muted-foreground pr-4">
                          {submission.createdAt && submission.createdAt.toDate
                            ? format(submission.createdAt.toDate(), 'dd MMM yyyy - HH:mm')
                            : 'Pas de date'}
                        </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 bg-secondary/30">
                     <div className="space-y-4">
                          <div>
                              <div className="font-semibold">De:</div>
                              <div>{submission.name} &lt;{submission.email}&gt;</div>
                          </div>
                           <div>
                              <div className="font-semibold">Sujet:</div>
                              <div>{submission.subject}</div>
                          </div>
                           <div>
                              <div className="font-semibold">Message:</div>
                              <div className="whitespace-pre-wrap">{submission.message}</div>
                          </div>
                     </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
