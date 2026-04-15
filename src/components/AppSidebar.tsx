import { Calendar, Clock, Link as LinkIcon, Settings, ExternalLink, Copy, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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

export function AppSidebar() {
  const location = useLocation();

  const navigation = [
    { name: "Event types", href: "/", icon: LinkIcon },
    { name: "Bookings", href: "/bookings", icon: Calendar },
    { name: "Availability", href: "/availability", icon: Clock },
  ];

  return (
      // Applied the specific hex colors for background and default text
      <Sidebar className="border-r border-gray-200 bg-[#F6F7F9] text-[#3C3E44]">

        {/* TOP: User Profile Block mimicking the HTML dropdown trigger */}
        <SidebarHeader className="p-3">
          <div className="flex w-full items-center justify-between rounded-md px-2 py-1.5 hover:bg-black/5 cursor-pointer transition-colors">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5 rounded-full border border-gray-200">
                <AvatarImage src="" alt="Tanish Garg" />
                <AvatarFallback className="bg-green-500 text-[10px] text-white">TG</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium leading-none text-black truncate w-24">
              Tanish Garg
            </span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </SidebarHeader>

        {/* MIDDLE: Core Navigation */}
        <SidebarContent className="px-3 pt-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  // Determine if the current route is active
                  const isActive = location.pathname === item.href || (item.href === "/" && location.pathname === "/event-types");

                  return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                            asChild
                            className={`px-2 py-1.5 my-0.5 rounded-md transition-colors h-8 flex items-center gap-2 ${
                                isActive
                                    ? "bg-[#E5E7EB] text-black font-medium hover:bg-[#E5E7EB]" // Active state overrides
                                    : "text-[#3C3E44] hover:bg-black/5 hover:text-black font-medium" // Inactive state
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

        {/* BOTTOM: Secondary Actions & Settings from HTML snippet */}
        <SidebarFooter className="p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  className="px-2 py-1.5 mt-2 rounded-md transition-colors h-8 text-[#3C3E44] hover:bg-black/5 hover:text-black font-medium w-full flex items-center gap-2"
              >
                <a href="#" target="_blank" rel="noreferrer" className="w-full">
                  <ExternalLink className="h-4 w-4 shrink-0 text-gray-500" />
                  <span className="text-sm">View public page</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  className="px-2 py-1.5 mt-0.5 rounded-md transition-colors h-8 text-[#3C3E44] hover:bg-black/5 hover:text-black font-medium w-full flex items-center gap-2"
              >
                <button onClick={() => {}} className="w-full text-left">
                  <Copy className="h-4 w-4 shrink-0 text-gray-500" />
                  <span className="text-sm">Copy public page link</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  className={`px-2 py-1.5 mt-0.5 rounded-md transition-colors h-8 w-full flex items-center gap-2 ${
                      location.pathname === "/settings"
                          ? "bg-[#E5E7EB] text-black font-medium hover:bg-[#E5E7EB]"
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

      </Sidebar>
  );
}