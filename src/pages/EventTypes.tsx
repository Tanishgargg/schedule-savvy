import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventTypes, createEventType, updateEventType, deleteEventType } from '@/services/api';
import { EventType, CustomQuestion } from '@/types';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Copy, Pencil, Trash2, ExternalLink, Clock, MoreVertical } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const COLOR_OPTIONS = ['#4f46e5', '#0891b2', '#dc2626', '#ea580c', '#16a34a', '#9333ea', '#0d9488', '#be185d'];

const defaultFormData = {
  title: '',
  slug: '',
  description: '',
  duration: 30,
  color: '#4f46e5',
  isActive: true,
  bufferTimeBefore: 0,
  bufferTimeAfter: 0,
  customQuestions: [] as CustomQuestion[],
};

export default function EventTypesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: eventTypes = [], isLoading } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: getEventTypes,
  });

  const createMutation = useMutation({
    mutationFn: createEventType,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['eventTypes'] }); toast.success('Event type created'); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventType> }) => updateEventType(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['eventTypes'] }); toast.success('Event type updated'); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEventType,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['eventTypes'] }); toast.success('Event type deleted'); setDeleteId(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateEventType(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['eventTypes'] }),
  });

  const openCreate = () => {
    setEditingEvent(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const openEdit = (event: EventType) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      slug: event.slug,
      description: event.description,
      duration: event.duration,
      color: event.color,
      isActive: event.isActive,
      bufferTimeBefore: event.bufferTimeBefore,
      bufferTimeAfter: event.bufferTimeAfter,
      customQuestions: event.customQuestions,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.slug) {
      toast.error('Title and URL slug are required');
      return;
    }
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/john-doe/${slug}`);
    toast.success('Link copied to clipboard');
  };

  const autoSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Event Types</h1>
            <p className="text-muted-foreground mt-1">Create events to share for people to book on your calendar.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Event Type
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : eventTypes.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No event types yet</h3>
            <p className="text-muted-foreground mb-4">Create your first event type to start accepting bookings.</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Event Type
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-lg border divide-y">
            {eventTypes.map((event) => (
              <div key={event.id} className="flex items-center p-4 gap-4 hover:bg-muted/50 transition-colors">
                <div className="w-1 h-12 rounded-full" style={{ backgroundColor: event.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                    {!event.isActive && (
                      <Badge variant="secondary" className="text-xs">Disabled</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.duration}m
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      /john-doe/{event.slug}
                    </span>
                  </div>
                </div>
                <Switch
                  checked={event.isActive}
                  onCheckedChange={(checked) => toggleMutation.mutate({ id: event.id, isActive: checked })}
                />
                <Button variant="ghost" size="icon" onClick={() => copyLink(event.slug)} title="Copy link">
                  <Copy className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(event)}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(event.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event Type' : 'New Event Type'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update your event type settings.' : 'Create a new event type for people to book.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setFormData(f => ({
                    ...f,
                    title,
                    slug: editingEvent ? f.slug : autoSlug(title),
                  }));
                }}
                placeholder="e.g. Quick Chat"
              />
            </div>
            <div>
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/john-doe/</span>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(f => ({ ...f, slug: e.target.value }))}
                  placeholder="quick-chat"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="A brief description of this meeting..."
                rows={3}
              />
            </div>
            <div>
              <Label>Duration</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DURATION_OPTIONS.map(d => (
                  <Button
                    key={d}
                    type="button"
                    variant={formData.duration === d ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData(f => ({ ...f, duration: d }))}
                  >
                    {d}m
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 transition-all ${formData.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setFormData(f => ({ ...f, color: c }))}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Buffer before (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.bufferTimeBefore}
                  onChange={(e) => setFormData(f => ({ ...f, bufferTimeBefore: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Buffer after (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.bufferTimeAfter}
                  onChange={(e) => setFormData(f => ({ ...f, bufferTimeAfter: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingEvent ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event type?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this event type and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
