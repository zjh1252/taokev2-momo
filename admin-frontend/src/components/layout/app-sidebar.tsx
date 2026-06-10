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
            {group.label && <SidebarGroupLabel className='text-[15px] font-semibold'>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                // 判断父级是否应展开：任一子/孙匹配，且无其他兄弟的 URL 更精确匹配
                const hasSubActive = (() => {
                  const siblings = item.items || [];
                  return siblings.some((sub) => {
                    if (pathname === sub.url) return true;
                    if (pathname.startsWith(sub.url + '/')) {
                      const hasMoreSpecific = siblings.some(
                        (s) =>
                          s.url !== sub.url &&
                          (pathname === s.url || pathname.startsWith(s.url + '/')) &&
                          s.url.length > sub.url.length
                      );
                      if (!hasMoreSpecific) return true;
                    }
                    return sub.items?.some(
                      (g) => pathname === g.url || pathname.startsWith(g.url + '/'),
                    );
                  });
                })();
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
                            // 判断孙女菜单 active（与 isSubActive 逻辑一致）
                            const isGrandChildActive = (gcUrl: string) => {
                              if (pathname === gcUrl) return true;
                              if (pathname.startsWith(gcUrl + '/')) {
                                const gcSiblings = subItem.items || [];
                                const hasMoreSpecificGc = gcSiblings.some(
                                  (g) =>
                                    g.url !== gcUrl &&
                                    (pathname === g.url || pathname.startsWith(g.url + '/')) &&
                                    g.url.length > gcUrl.length
                                );
                                return !hasMoreSpecificGc;
                              }
                              return false;
                            };
                            // 判断 subItem 是否 active：精确匹配，或以 "/" 开头且无更精确的兄弟匹配
                            const isSubActive = (() => {
                              if (pathname === subItem.url) return true;
                              if (pathname.startsWith(subItem.url + '/')) {
                                const siblings = item.items || [];
                                const hasMoreSpecific = siblings.some(
                                  (s) =>
                                    s.url !== subItem.url &&
                                    (pathname === s.url || pathname.startsWith(s.url + '/')) &&
                                    s.url.length > subItem.url.length
                                );
                                return !hasMoreSpecific;
                              }
                              return false;
                            })();
                            if (hasGrandChildren) {
                              return (
                                <Collapsible
                                  key={subItem.title}
                                  asChild
                                  defaultOpen={grandChildActive || isSubActive}
                                  className='group/sub-collapsible'
                                >
                                  <SidebarMenuSubItem>
                                    <CollapsibleTrigger asChild>
                                      <SidebarMenuSubButton
                                        className='cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors'
                                        isActive={!isSubActive && grandChildActive}
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
                                              isActive={isGrandChildActive(grandChild.url)}
                                              className='hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors'
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
                                  isActive={isSubActive}
                                  className='hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors'
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
