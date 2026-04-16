import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventTypes, createEventType, updateEventType, deleteEventType } from '@/services/api';
import { EventType, CustomQuestion } from '@/types';
import { AdminLayout } from '@/components/AdminLayout';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Copy, Pencil, Trash2, Clock, MoreHorizontal, Search, ExternalLink, Link as LinkIcon, Files } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const defaultFormData = {
  title: '',
  slug: '',
  description: '',
  duration: 30,
  isHidden: false,
  scheduleId: null, // <--- This is the magic word!
  customQuestions: [] as CustomQuestion[],
};

export default function EventTypesPage() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const username = user?.username || 'user';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [searchQuery, setSearchQuery] = useState('');

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
    mutationFn: ({ id, isHidden }: { id: string; isHidden: boolean }) => updateEventType(id, { isHidden }),
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
      isHidden: event.isHidden,
      scheduleId: event.scheduleId,
      customQuestions: event.customQuestions,
    });
    setDialogOpen(true);
  };

  const handleDuplicate = (event: EventType) => {
    const { id, ...eventData } = event;
    const duplicatedData = {
      ...eventData,
      title: `${event.title} (Copy)`,
      slug: `${event.slug}-copy`,
      isHidden: true, // Default duplicated events to hidden
    };
    createMutation.mutate(duplicatedData);
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
    navigator.clipboard.writeText(`${window.location.origin}/${username}/${slug}`);
    toast.success('Link copied to clipboard');
  };

  const autoSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const filteredEvents = eventTypes.filter(e =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
      <AdminLayout>
        <div className="max-w-5xl mx-auto py-6">
          <div className="mb-8">
            <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Event Types</h1>
            <p className="text-sm text-gray-500 mt-1">Configure different events for people to book on your calendar.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:max-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="pl-9 h-9 rounded-[10px] border-gray-200 text-sm shadow-sm focus-visible:ring-black"
              />
            </div>
            <Button
                onClick={openCreate}
                className="h-9 rounded-[10px] bg-black hover:bg-black/90 text-white px-4 font-medium shadow-sm transition-all"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New
            </Button>
          </div>

          {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-md border border-gray-200" />
                ))}
              </div>
          ) : filteredEvents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-md border border-gray-200 shadow-sm">
                <Clock className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No event types found</h3>
                <p className="text-sm text-gray-500 mb-4">Create your first event type to start accepting bookings.</p>
                <Button onClick={openCreate} variant="outline" className="h-9 rounded-[10px] font-medium border-gray-200">
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>
          ) : (
              <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {filteredEvents.map((event) => (
                      <li key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 hover:bg-gray-50/50 transition-colors gap-4 group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <a href={`/event-types/${event.slug}`} className="font-semibold text-sm text-gray-900 truncate hover:underline">
                              {event.title}
                            </a>
                            <span className="hidden sm:inline text-sm text-gray-500 font-normal">
                        /{username}/{event.slug}
                      </span>
                            {event.isHidden && (
                                <span className="text-sm text-gray-400 ml-2">Hidden</span>
                            )}
                          </div>

                          <div className="mt-2">
                            <div className="inline-flex items-center justify-center rounded-[4px] gap-x-1.5 bg-gray-100 text-gray-700 py-1 px-1.5 text-xs font-medium leading-none">
                              <Clock className="h-3 w-3 stroke-[2.5px]" />
                              {event.duration}m
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:ml-4">
                          {event.isHidden && (
                              <span className="sm:hidden text-sm text-gray-400">Hidden</span>
                          )}

                          <div className="self-center flex h-auto w-fit flex-row items-center">
                            <Switch
                                checked={!event.isHidden}
                                onCheckedChange={(checked) => toggleMutation.mutate({ id: event.id, isHidden: !checked })}
                                className="data-[state=checked]:bg-black shadow-sm h-6 w-11"
                            />
                          </div>

                          <div className="flex items-center border border-gray-200 rounded-[8px] bg-white shadow-sm overflow-hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-none border-r border-gray-200 hover:bg-gray-50 text-gray-700 focus-visible:ring-0"
                                onClick={() => window.open(`/${username}/${event.slug}`, '_blank')}
                                title="Preview"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-none border-r border-gray-200 hover:bg-gray-50 text-gray-700 focus-visible:ring-0"
                                onClick={() => copyLink(event.slug)}
                                title="Copy link"
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none hover:bg-gray-50 text-gray-700 focus-visible:ring-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-[8px] p-1 border-gray-200 shadow-md">
                                <DropdownMenuItem onClick={() => openEdit(event)} className="cursor-pointer text-sm font-medium text-gray-700 focus:bg-gray-100 rounded-md">
                                  <Pencil className="h-4 w-4 mr-2 text-gray-500" /> Edit
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => handleDuplicate(event)} className="cursor-pointer text-sm font-medium text-gray-700 focus:bg-gray-100 rounded-md mt-1">
                                  <Files className="h-4 w-4 mr-2 text-gray-500" /> Duplicate
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                <DropdownMenuItem
                                    className="cursor-pointer text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700 rounded-md"
                                    onClick={() => setDeleteId(event.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </li>
                  ))}
                </ul>
              </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-[12px]">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingEvent ? 'Edit Event Type' : 'New Event Type'}</DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Update your event type settings.' : 'Create a new event type for people to book.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-gray-700 font-medium">Title</Label>
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
                    className="mt-1 rounded-[8px] border-gray-200 focus-visible:ring-black"
                />
              </div>

              {/* Seamless Cal.com URL Input */}
              <div>
                <Label className="text-gray-700 font-medium">URL Slug</Label>
                <div className="flex items-center mt-1 focus-within:ring-2 focus-within:ring-black rounded-[8px] border border-gray-200 overflow-hidden transition-shadow">
                  <span className="bg-gray-50 px-3 py-2.5 text-sm text-gray-500 border-r border-gray-200 select-none whitespace-nowrap">
                    {window.location.host}/{username}/
                  </span>
                  <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => {
                        const formattedSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                        setFormData(f => ({ ...f, slug: formattedSlug }));
                      }}
                      placeholder="quick-chat"
                      className="flex-1 px-3 py-2.5 text-sm outline-none border-none text-gray-900 focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-700 font-medium">Description</Label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    placeholder="A brief description of this meeting..."
                    rows={3}
                    className="mt-1 rounded-[8px] border-gray-200 focus-visible:ring-black resize-none"
                />
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Duration</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {DURATION_OPTIONS.map(d => (
                      <Button
                          key={d}
                          type="button"
                          variant={formData.duration === d ? 'default' : 'outline'}
                          size="sm"
                          className={`rounded-[8px] ${formData.duration === d ? 'bg-black text-white' : 'border-gray-200'}`}
                          onClick={() => setFormData(f => ({ ...f, duration: d }))}
                      >
                        {d}m
                      </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-[8px] border-gray-200">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="rounded-[8px] bg-black text-white hover:bg-black/90">
                {editingEvent ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="rounded-[12px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete event type?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this event type and remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-[8px]">Cancel</AlertDialogCancel>
              <AlertDialogAction
                  className="rounded-[8px] bg-red-600 text-white hover:bg-red-700"
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