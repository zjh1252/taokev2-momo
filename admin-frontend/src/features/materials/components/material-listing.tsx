'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { MaterialTabPanel } from './material-tab-panel';

const tabParser = parseAsStringLiteral(['cover', 'avatar']).withDefault('cover');

export function MaterialListing() {
  const [tab, setTab] = useQueryState('tab', tabParser);

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => void setTab(value as 'cover' | 'avatar')}
    >
      <TabsList>
        <TabsTrigger value='cover'>课程封面素材库</TabsTrigger>
        <TabsTrigger value='avatar'>头像素材库</TabsTrigger>
      </TabsList>

      <TabsContent value='cover' className='mt-4'>
        <MaterialTabPanel materialType='COVER' />
      </TabsContent>

      <TabsContent value='avatar' className='mt-4'>
        <MaterialTabPanel materialType='AVATAR' />
      </TabsContent>
    </Tabs>
  );
}
