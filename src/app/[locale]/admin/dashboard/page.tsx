'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from 'lucide-react';
import { getSubmissions, Submission, updateSubmissionReadStatus } from '@/actions/submissions';


export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }

    startTransition(async () => {
      try {
        const subs = await getSubmissions();
        setSubmissions(subs);
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
      } finally {
        setIsLoading(false);
      }
    });

  }, [router]);

  const handleMarkAsRead = async (id: string) => {
    const submission = submissions.find(s => s.id === id);
    if (!submission || submission.read) return;

    // Optimistic UI update
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, read: true } : s));

    try {
        await updateSubmissionReadStatus(id, true);
    } catch (error) {
        console.error("Error marking as read:", error);
        // Revert if error
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
        <h1 className="text-3xl font-bold">Tableau de Bord</h1>
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
                          {submission.createdAt
                            ? format(new Date(submission.createdAt), 'dd MMM yyyy - HH:mm')
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
