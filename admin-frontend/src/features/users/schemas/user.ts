import * as z from 'zod';

export const userSchema = z.object({
  phone: z.string().min(11, '请输入正确的手机号'),
  nickname: z.string().min(1, '请输入昵称'),
  realName: z.string().optional()
});

export type UserFormValues = z.infer<typeof userSchema>;
