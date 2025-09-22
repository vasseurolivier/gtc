
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Loader2, LogOut, RefreshCw } from 'lucide-react';


interface Submission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | null;
  read: boolean;
}

export default function AdminDashboardPage() {
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
            subs.push({ id: doc.id, ...doc.data() } as Submission);
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
  
  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    router.push('/admin/login');
  };
  
  const manualRefresh = () => {
    setIsLoading(true);
    // onSnapshot will handle the update, this is for user feedback
    setTimeout(() => setIsLoading(false), 500);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Contact Submissions</h1>
        <div className="flex gap-2">
            <Button variant="outline" onClick={manualRefresh} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
                No submissions yet.
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
                          {!submission.read && <Badge>New</Badge>}
                          <span className="truncate max-w-xs">{submission.subject}</span>
                          <span className="text-muted-foreground truncate max-w-xs">{submission.name}</span>
                       </div>
                       <span className="text-sm text-muted-foreground pr-4">
                          {submission.createdAt
                            ? format(new Date(submission.createdAt.seconds * 1000), 'MMM dd, yyyy - hh:mm a')
                            : 'No date'}
                        </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 bg-secondary/30">
                     <div className="space-y-4">
                          <div>
                              <div className="font-semibold">From:</div>
                              <div>{submission.name} &lt;{submission.email}&gt;</div>
                          </div>
                           <div>
                              <div className="font-semibold">Subject:</div>
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
