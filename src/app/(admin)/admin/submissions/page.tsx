
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
import { Loader2, Trash2 } from 'lucide-react';
import { getSubmissions, Submission, updateSubmissionReadStatus, deleteSubmission } from '@/actions/submissions';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';


export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

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

  const handleDelete = async (id: string) => {
    const originalSubmissions = [...submissions];
    setSubmissions(prev => prev.filter(s => s.id !== id));

    const result = await deleteSubmission(id);

    if (result.success) {
      toast({ title: 'Success', description: 'Message deleted successfully.' });
    } else {
      setSubmissions(originalSubmissions);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete message.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
                No messages yet.
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
                            ? format(new Date(submission.createdAt), 'dd MMM yyyy - HH:mm')
                            : 'No date'}
                        </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 bg-secondary/30 relative">
                     <div className="space-y-4 pr-12">
                          <div>
                              <div className="font-semibold">From:</div>
                              <div>{submission.name} &lt;{submission.email}&gt;</div>
                          </div>
                           {submission.phone && (
                            <div>
                                <div className="font-semibold">Téléphone:</div>
                                <div>{submission.phone}</div>
                            </div>
                           )}
                           <div>
                              <div className="font-semibold">Subject:</div>
                              <div>{submission.subject}</div>
                          </div>
                           <div>
                              <div className="font-semibold">Message:</div>
                              <div className="whitespace-pre-wrap">{submission.message}</div>
                          </div>
                     </div>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-4 right-4">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this message.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(submission.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
