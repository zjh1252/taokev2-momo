'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { navGroups } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const filteredGroups = useFilteredNavGroups(navGroups);

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader />
      <SidebarContent className='overflow-x-hidden'>
        {filteredGroups.map((group, index) => (
          <SidebarGroup key={group.label || `group-${index}`} className='py-0'>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                const hasSubActive = item.items?.some((sub) => {
                  if (pathname === sub.url || pathname.startsWith(sub.url + '/')) return true;
                  return sub.items?.some(
                    (g) => pathname === g.url || pathname.startsWith(g.url + '/'),
                  );
                });
                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive || hasSubActive}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url}>
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                          <Icons.chevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const hasGrandChildren = subItem.items && subItem.items.length > 0;
                            const grandChildActive = subItem.items?.some(
                              (g) => pathname === g.url || pathname.startsWith(g.url + '/'),
                            );
                            if (hasGrandChildren) {
                              return (
                                <Collapsible
                                  key={subItem.title}
                                  asChild
                                  defaultOpen={grandChildActive}
                                  className='group/sub-collapsible'
                                >
                                  <SidebarMenuSubItem>
                                    <CollapsibleTrigger asChild>
                                      <SidebarMenuSubButton
                                        className='cursor-pointer hover:bg-sidebar-accent/60'
                                        isActive={grandChildActive}
                                      >
                                        <span>{subItem.title}</span>
                                        <Icons.chevronRight className='ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90' />
                                      </SidebarMenuSubButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <SidebarMenuSub className='mr-0 pr-0'>
                                        {subItem.items?.map((grandChild) => (
                                          <SidebarMenuSubItem key={grandChild.title}>
                                            <SidebarMenuSubButton
                                              asChild
                                              isActive={
                                                pathname === grandChild.url ||
                                                pathname.startsWith(grandChild.url + '/')
                                              }
                                              className='hover:bg-sidebar-accent/60'
                                            >
                                              <Link href={grandChild.url}>
                                                <span>{grandChild.title}</span>
                                              </Link>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        ))}
                                      </SidebarMenuSub>
                                    </CollapsibleContent>
                                  </SidebarMenuSubItem>
                                </Collapsible>
                              );
                            }
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.url || pathname.startsWith(subItem.url + '/')}
                                  className='hover:bg-sidebar-accent/60'
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <span className='truncate'>账户</span>
                  <Icons.chevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='text-muted-foreground px-1 py-1.5 text-sm'>
                    登录以管理您的账户
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Icons.notification className='mr-2 h-4 w-4' />
                  通知
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
