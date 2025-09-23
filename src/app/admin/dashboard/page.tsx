
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getSubmissions, Submission } from '@/actions/submissions';
import { format, subDays } from 'date-fns';
import { Loader2, Inbox, MailOpen } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface DailySubmission {
  date: string;
  count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated');
    if (isAuthenticated !== 'true') {
      router.push('/admin/login');
      return;
    }

    async function fetchData() {
      try {
        const subs = await getSubmissions();
        setSubmissions(subs);
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const totalSubmissions = submissions.length;
  const unreadSubmissions = submissions.filter(s => !s.read).length;

  const getChartData = (): DailySubmission[] => {
    const last7Days = Array(7).fill(0).map((_, i) => subDays(new Date(), i)).reverse();
    const dailyCounts: { [key: string]: number } = {};

    last7Days.forEach(day => {
      const formattedDate = format(day, 'MMM dd');
      dailyCounts[formattedDate] = 0;
    });

    submissions.forEach(submission => {
      const submissionDate = format(new Date(submission.createdAt), 'MMM dd');
      if (dailyCounts.hasOwnProperty(submissionDate)) {
        dailyCounts[submissionDate]++;
      }
    });

    return Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));
  };
  
  const chartData = getChartData();
  const recentSubmissions = submissions.slice(0, 5);


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">All time received messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MailOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadSubmissions}</div>
            <p className="text-xs text-muted-foreground">{((unreadSubmissions / totalSubmissions) * 100 || 0).toFixed(1)}% of total messages</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Messages received in the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border))' 
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>The last 5 messages received.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSubmissions.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      <Link href="/admin/submissions" className="hover:underline flex items-center gap-2">
                         {!sub.read && <Badge className="h-5">New</Badge>} {sub.subject}
                      </Link>
                    </TableCell>
                    <TableCell>{sub.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{format(new Date(sub.createdAt), 'dd MMM')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {submissions.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    No messages yet.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
