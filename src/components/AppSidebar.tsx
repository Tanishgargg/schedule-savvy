import { useState } from "react";
import { Calendar, Clock, Link as LinkIcon, Settings, ExternalLink, ChevronDown, Plus, Check } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, createUser } from "@/services/api";
import { User } from "@/types";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser"; // Updated import path

export function AppSidebar() {
  const location = useLocation();
  const { data: currentUser } = useUser(); // Hook to fetch current user
  const queryClient = useQueryClient();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', username: '', email: '' });

  const navigation = [
    { name: "Event types", href: "/", icon: LinkIcon },
    { name: "Bookings", href: "/bookings", icon: Calendar },
    { name: "Availability", href: "/availability", icon: Clock },
  ];

  // Fetch all users for the dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: getAllUsers,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success("User created successfully!");
      setIsAddUserOpen(false);
      setNewUserData({ name: '', username: '', email: '' });
      switchUser(newUser.id);
    }
  });

  const switchUser = (userId: string) => {
    localStorage.setItem('cal_active_user_id', userId);
    window.location.reload();
  };

  const handleCreateUser = () => {
    if (!newUserData.name || !newUserData.username) return toast.error("Missing fields");
    createMutation.mutate({ ...newUserData, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  };

  return (
      <Sidebar
          className="border-r border-gray-200 [&>[data-sidebar=sidebar]]:bg-[#F6F7F9] text-[#3C3E44]"
      >

        {/* TOP: User Profile Block with Dropdown */}
        <SidebarHeader className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex w-full items-center justify-between rounded-md px-2 py-1.5 hover:bg-black/5 cursor-pointer transition-colors outline-none">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Avatar className="h-5 w-5 rounded-full border border-gray-200">
                    <AvatarImage src={`https://avatar.vercel.sh/${currentUser?.username}.svg`} alt={currentUser?.name || "User"} />
                    <AvatarFallback className="bg-green-500 text-[10px] text-white">
                      {currentUser?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium leading-none text-black truncate w-24">
                    {currentUser?.name || "Loading..."}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              {users.map((user: User) => (
                  <DropdownMenuItem
                      key={user.id}
                      onClick={() => switchUser(user.id)}
                      className="cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate">{user.name}</span>
                    {currentUser?.id === user.id && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                  className="cursor-pointer text-gray-600 font-medium"
                  onClick={() => setIsAddUserOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Add another user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>

        {/* MIDDLE: Core Navigation */}
        <SidebarContent className="px-3 pt-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href || (item.href === "/" && location.pathname === "/event-types");

                  return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                            asChild
                            className={`px-2 py-1.5 my-0.5 rounded-md transition-colors h-8 flex items-center gap-2 ${
                                isActive
                                    ? "bg-[#E5E7EB] text-black font-medium hover:bg-[#E5E7EB] hover:text-black"
                                    : "text-[#3C3E44] hover:bg-black/5 hover:text-black font-medium"
                            }`}
                        >
                          <Link to={item.href} className="w-full">
                            <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-black" : "text-gray-500"}`} />
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* BOTTOM: Secondary Actions & Settings */}
        <SidebarFooter className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  className="px-2 py-1.5 mt-2 rounded-md transition-colors h-8 text-[#3C3E44] hover:bg-black/5 hover:text-black font-medium w-full flex items-center gap-2"
              >
                {/* Dynamically link to the current user's public profile */}
                <a href={`/${currentUser?.username || 'user'}`} target="_blank" rel="noreferrer" className="w-full flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 shrink-0 text-gray-500" />
                  <span className="text-sm">View public page</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  className={`px-2 py-1.5 mt-0.5 rounded-md transition-colors h-8 w-full flex items-center gap-2 ${
                      location.pathname === "/settings"
                          ? "bg-[#E5E7EB] text-black font-medium hover:bg-[#E5E7EB] hover:text-black"
                          : "text-[#3C3E44] hover:bg-black/5 hover:text-black font-medium"
                  }`}
              >
                <Link to="/settings" className="w-full">
                  <Settings className={`h-4 w-4 shrink-0 ${location.pathname === "/settings" ? "text-black" : "text-gray-500"}`} />
                  <span className="text-sm">Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        {/* Add User Dialog */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-[12px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                    value={newUserData.name}
                    onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                    placeholder="John Doe"
                    className="rounded-[8px] focus-visible:ring-black"
                />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                    value={newUserData.username}
                    onChange={e => setNewUserData({...newUserData, username: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    placeholder="john-doe"
                    className="rounded-[8px] focus-visible:ring-black"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                    type="email"
                    value={newUserData.email}
                    onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                    placeholder="john@example.com"
                    className="rounded-[8px] focus-visible:ring-black"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                  onClick={handleCreateUser}
                  disabled={createMutation.isPending}
                  className="bg-black text-white w-full rounded-[8px]"
              >
                {createMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Sidebar>
  );
}