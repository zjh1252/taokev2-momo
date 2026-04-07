'use client';

import { useState } from 'react';
import type { InstitutionDetail } from '../../types';

interface InstitutionDetailTabsProps {
  institution: InstitutionDetail;
}

type TabKey = 'intro' | 'contact';

export function InstitutionDetailTabs({ institution }: InstitutionDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('intro');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'intro', label: '机构介绍' },
    { key: 'contact', label: '联系方式' },
  ];

  return (
    <div className="flex flex-col">
      {/* Tab 按钮 */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-6 py-2.5 text-sm font-medium transition-colors bg-white border border-transparent rounded-t-lg ${
              activeTab === tab.key
                ? 'text-primary font-bold border-slate-200 border-b-white z-10 -mb-px'
                : 'text-slate-500 bg-slate-50 border-slate-200 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {activeTab === tab.key && (
              <span className="absolute top-0 left-0 right-0 h-[3px] bg-primary rounded-t" />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl shadow-sm p-6">
        {activeTab === 'intro' && <IntroContent institution={institution} />}
        {activeTab === 'contact' && <ContactContent institution={institution} />}
      </div>
    </div>
  );
}

function IntroContent({ institution }: { institution: InstitutionDetail }) {
  return (
    <div className="space-y-6">
      {/* 机构简介 */}
      {institution.bio && (
        <div>
          <div className="border-l-4 border-primary pl-3 py-2 bg-slate-50 rounded-r mb-4">
            <span className="font-bold text-slate-800 text-sm">{institution.orgName}的简介</span>
          </div>
          <p className="text-sm text-slate-600 leading-loose whitespace-pre-wrap">
            {institution.bio}
          </p>
        </div>
      )}

      {/* 服务客户 */}
      {institution.clientCases && (
        <div>
          <div className="border-l-4 border-primary pl-3 py-2 bg-slate-50 rounded-r mb-4">
            <span className="font-bold text-slate-800 text-sm">{institution.orgName}部分客户</span>
          </div>
          <p className="text-sm text-slate-600 leading-loose">
            {institution.clientCases}
          </p>
        </div>
      )}
    </div>
  );
}

function ContactContent({ institution }: { institution: InstitutionDetail }) {
  const hasContact = institution.showContact === 1;

  return (
    <div className="flex flex-col md:flex-row gap-12">
      {/* 左侧联系信息 */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-primary rounded-full flex items-center justify-center">
            <span className="text-2xl">🏢</span>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">公司名称</div>
            <div className="text-lg font-bold text-slate-800">{institution.orgName}</div>
          </div>
        </div>

        {institution.address && (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-primary rounded-full flex items-center justify-center">
              <span className="text-2xl">📍</span>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">公司地址</div>
              <div className="text-base text-slate-800">{institution.address}</div>
            </div>
          </div>
        )}

        {hasContact && institution.contactPhone && (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-primary rounded-full flex items-center justify-center">
              <span className="text-2xl">📞</span>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">联系电话</div>
              <div className="text-base text-slate-800 font-bold">{institution.contactPhone}</div>
            </div>
          </div>
        )}

        {hasContact && institution.contactName && (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-primary rounded-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">联系人</div>
              <div className="text-base text-slate-800">{institution.contactName}</div>
            </div>
          </div>
        )}

        {!hasContact && (
          <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-4">
            该机构未公开联系方式，您可以通过平台留言联系。
          </div>
        )}
      </div>

      {/* 右侧留言 */}
      <div className="flex-1 bg-slate-50 p-6 rounded-xl border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">在线留言</h3>
        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="您的姓名"
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <input
            type="tel"
            placeholder="联系电话"
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <textarea
            placeholder="请输入您的咨询需求..."
            rows={4}
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
          />
          <button
            type="button"
            className="bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded transition-colors shadow-sm"
          >
            提交留言
          </button>
        </form>
      </div>
    </div>
  );
}
