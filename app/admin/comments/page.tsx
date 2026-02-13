"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Trash2, User, Mail, Calendar } from 'lucide-react';

interface Comment {
  id: string;
  postSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: string;
  createdAt: Date;
}

export default function AdminCommentsPage() {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await fetchComments();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      router.push('/');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch('/api/blog/comments/admin');
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/blog/comments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to approve comment:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/blog/comments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to reject comment:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment permanently?')) return;

    try {
      const response = await fetch(`/api/blog/comments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true;
    return comment.status === filter;
  });

  const pendingCount = comments.filter(c => c.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-foreground">Comment Moderation</h1>
              <p className="text-sm text-foreground/60 mt-1">
                {pendingCount} pending approval
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-sm border border-foreground/10 hover:border-foreground/20 rounded-lg transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters */}
        <div className="flex gap-2 mb-8">
          {(['all', 'pending', 'approved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-all capitalize ${
                filter === status
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {filteredComments.length === 0 ? (
            <div className="text-center py-12 text-foreground/60">
              No {filter !== 'all' && filter} comments
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-foreground/5 rounded-xl p-6 hover:bg-foreground/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <User size={14} />
                        <span className="font-medium">{comment.authorName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground/60">
                        <Mail size={14} />
                        <span>{comment.authorEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground/60">
                        <Calendar size={14} />
                        <span>{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-xs text-foreground/60 mb-3">
                      Post: {comment.postSlug}
                    </div>
                    <p className="text-foreground/80">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-1 rounded text-xs ${
                      comment.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                        : comment.status === 'approved'
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                      {comment.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-foreground/10">
                  {comment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(comment.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 rounded-lg transition-all text-sm"
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(comment.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg transition-all text-sm"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-foreground/10 hover:bg-foreground/20 text-foreground/60 rounded-lg transition-all text-sm ml-auto"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
