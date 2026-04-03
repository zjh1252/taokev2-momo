'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { IconX, IconSearch, IconSend, IconUsers, IconUserCheck, IconWorld } from '@tabler/icons-react';
import { templateListQueryOptions } from '../api/queries';
import { sendNotificationMutation } from '../api/mutations';
import { getBusinessRoles } from '@/features/roles/api/service';
import { getUsers } from '@/features/users/api/service';
import type { NotificationTemplate, SendNotificationPayload } from '../api/types';
import type { Role } from '@/features/roles/api/types';
import type { User } from '@/features/users/api/types';

type TargetType = 'ALL' | 'ROLE' | 'USERS';

type SelectedUser = { id: number; nickname: string | null; phone: string };

/**
 * 发送通知表单 — 支持全员/按角色/指定用户。
 *
 * @author Fangxinxin
 * @date 2026-04-02 19:00
 */
export function SendNotificationForm() {
  const [targetType, setTargetType] = useState<TargetType>('ALL');
  const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTemplateCode, setSelectedTemplateCode] = useState('');

  // 用户搜索
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: templateData } = useQuery(templateListQueryOptions);
  const templates: NotificationTemplate[] = templateData?.data ?? [];
  const enabledTemplates = templates.filter((t) => t.enabled === 1);

  const { data: rolesData } = useQuery({
    queryKey: ['roles', 'business'],
    queryFn: () => getBusinessRoles()
  });
  const businessRoles: Role[] = rolesData?.data ?? [];

  const sendMut = useMutation({
    ...sendNotificationMutation,
    onSuccess: (res) => {
      const count = res?.data ?? 0;
      toast.success(`通知发送成功，共 ${count} 人`);
      resetForm();
    },
    onError: (err) => toast.error(err.message || '发送失败')
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedTemplateCode('');
    setSelectedRoleCodes([]);
    setSelectedUsers([]);
    setSearchKeyword('');
    setSearchResults([]);
  };

  // 模板选择 → 自动填充
  const handleTemplateSelect = (code: string) => {
    setSelectedTemplateCode(code);
    if (code) {
      const tpl = enabledTemplates.find((t) => t.code === code);
      if (tpl) {
        setTitle(tpl.titleTemplate ?? '');
        setContent(tpl.contentTemplate);
      }
    }
  };

  // 角色勾选
  const toggleRole = (roleCode: string) => {
    setSelectedRoleCodes((prev) =>
      prev.includes(roleCode)
        ? prev.filter((c) => c !== roleCode)
        : [...prev, roleCode]
    );
  };

  // 用户搜索（debounce）
  const handleSearchChange = useCallback(
    (keyword: string) => {
      setSearchKeyword(keyword);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (!keyword.trim()) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      searchTimerRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await getUsers({ search: keyword, limit: 10 });
          setSearchResults(res.data?.list ?? []);
          setShowDropdown(true);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    },
    []
  );

  const addUser = (user: User) => {
    if (!selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [
        ...prev,
        { id: user.id, nickname: user.nickname, phone: user.phone }
      ]);
    }
    setShowDropdown(false);
    setSearchKeyword('');
  };

  const removeUser = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // 提交
  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('请填写通知标题');
      return;
    }
    if (!content.trim()) {
      toast.error('请填写通知内容');
      return;
    }
    if (targetType === 'ROLE' && selectedRoleCodes.length === 0) {
      toast.error('请至少选择一个角色');
      return;
    }
    if (targetType === 'USERS' && selectedUsers.length === 0) {
      toast.error('请至少选择一个用户');
      return;
    }

    const payload: SendNotificationPayload = {
      targetType,
      title: title.trim(),
      content: content.trim(),
      type: 'SYSTEM'
    };
    if (targetType === 'ROLE') payload.roleCodes = selectedRoleCodes;
    if (targetType === 'USERS') payload.userIds = selectedUsers.map((u) => u.id);

    sendMut.mutate(payload);
  };

  const targetOptions: { value: TargetType; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'ALL', label: '全部用户', icon: <IconWorld className="size-4" />, desc: '发送给所有正常状态用户' },
    { value: 'ROLE', label: '按角色', icon: <IconUsers className="size-4" />, desc: '发送给指定业务角色的用户' },
    { value: 'USERS', label: '指定用户', icon: <IconUserCheck className="size-4" />, desc: '搜索并选择特定用户' }
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 发送目标 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">发送目标</CardTitle>
          <CardDescription>选择通知的接收范围</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {targetOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTargetType(opt.value)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors cursor-pointer ${
                  targetType === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className={targetType === opt.value ? 'text-primary' : 'text-muted-foreground'}>
                  {opt.icon}
                </div>
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
              </button>
            ))}
          </div>

          {/* 按角色 */}
          {targetType === 'ROLE' && (
            <div className="space-y-3 pt-2">
              <Label>选择业务角色（可多选）</Label>
              <div className="grid grid-cols-2 gap-2">
                {businessRoles.map((role) => (
                  <label
                    key={role.roleCode}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedRoleCodes.includes(role.roleCode)}
                      onCheckedChange={() => toggleRole(role.roleCode)}
                    />
                    <span className="text-sm">{role.roleName}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {role.roleCode}
                    </span>
                  </label>
                ))}
              </div>
              {selectedRoleCodes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  已选 {selectedRoleCodes.length} 个角色
                </p>
              )}
            </div>
          )}

          {/* 指定用户 */}
          {targetType === 'USERS' && (
            <div className="space-y-3 pt-2">
              <Label>搜索用户（手机号/昵称）</Label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={searchKeyword}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="输入手机号或昵称搜索..."
                    className="pl-10"
                  />
                </div>
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-[240px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        搜索中...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        未找到用户
                      </div>
                    ) : (
                      searchResults.map((user) => {
                        const alreadySelected = selectedUsers.some((u) => u.id === user.id);
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addUser(user)}
                            disabled={alreadySelected}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                              alreadySelected ? 'opacity-50' : 'cursor-pointer'
                            }`}
                          >
                            <span className="font-medium">
                              {user.nickname || '未设置昵称'}
                            </span>
                            <span className="text-muted-foreground">{user.phone}</span>
                            {alreadySelected && (
                              <span className="ml-auto text-xs text-muted-foreground">已添加</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedUsers.map((user) => (
                    <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
                      {user.nickname || user.phone}
                      <button
                        type="button"
                        onClick={() => removeUser(user.id)}
                        className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 cursor-pointer"
                      >
                        <IconX className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground self-center">
                    共 {selectedUsers.length} 人
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* 通知内容 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">通知内容</CardTitle>
          <CardDescription>选择模板快速填充，或手动输入内容</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>从模板填充（可选）</Label>
            <Select value={selectedTemplateCode} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="选择模板..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">不使用模板</SelectItem>
                {enabledTemplates.map((tpl) => (
                  <SelectItem key={tpl.code} value={tpl.code}>
                    {tpl.code} - {tpl.remark || tpl.titleTemplate || tpl.contentTemplate.slice(0, 30)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>通知标题 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入通知标题"
            />
          </div>
          <div className="space-y-2">
            <Label>通知内容 *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入通知内容"
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* 提交 */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={resetForm}>
          重置
        </Button>
        <Button onClick={handleSubmit} disabled={sendMut.isPending}>
          <IconSend className="mr-2 size-4" />
          {sendMut.isPending ? '发送中...' : '发送通知'}
        </Button>
      </div>
    </div>
  );
}
