'use client';

import { SafeImage } from '@/components/safe-image';
import { getInstitutionLogoFallback } from '@/lib/media';
import type { InstitutionListItem } from '../../types';

function StarRating({ score }: { score: number }) {
  const filled = Math.round(Math.max(0, Math.min(5, score)));
  return (
    <span className="pxb-stars" aria-label={`评分 ${score}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`pxb-star${i < filled ? ' is-filled' : ''}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatLocation(item: InstitutionListItem): string {
  const parts = [item.provinceName, item.cityName].filter((s) => s?.trim());
  return parts.length > 0 ? parts.join('') : '待定';
}

function truncateBio(text?: string, max = 80): string {
  const t = text?.trim() ?? '';
  if (!t) return '-';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function detailSlug(item: InstitutionListItem): number {
  return item.legacyRoleId ?? item.id;
}

interface Props {
  institution: InstitutionListItem;
}

export function PxbInstitutionListItem({ institution }: Props) {
  const slug = detailSlug(institution);
  const href = `/company/${slug}.htm?origin=91pxb`;
  const commentHref = `${href}#comment`;

  return (
    <div className="pxb-institution-item">
      <div className="pxb-institution-logo">
        <a href={href} target="_blank" rel="noopener noreferrer">
          <SafeImage
            src={institution.logoUrl}
            fallback={getInstitutionLogoFallback(institution.orgName)}
            alt={institution.orgName}
            width={100}
            height={100}
            className="pxb-institution-logo-img"
          />
        </a>
      </div>
      <div className="pxb-institution-body">
        <div className="pxb-institution-head">
          <div className="pxb-institution-title">
            <a className="pxb-institution-name" href={href} target="_blank" rel="noopener noreferrer">
              {institution.orgName}
            </a>
            {institution.isCertified === 1 ? (
              <span className="pxb-institution-badge" title="认证机构">
                认
              </span>
            ) : null}
          </div>
          <div className="pxb-institution-score">
            <span className="pxb-institution-score-label">机构评分:</span>
            <StarRating score={Number(institution.score ?? 0)} />
          </div>
        </div>
        <div className="pxb-institution-center">
          {institution.specialties ? (
            <p>
              <b>擅长领域：</b>
              <span>{institution.specialties}</span>
            </p>
          ) : null}
          {institution.industries ? (
            <p>
              <b>擅长行业：</b>
              <span>{institution.industries}</span>
            </p>
          ) : null}
          <p>
            <b>常 住 地：</b>
            <span>{formatLocation(institution)}</span>
          </p>
          <p>
            <b>机构简介：</b>
            <span>{truncateBio(institution.bio)}</span>
          </p>
        </div>
        <div className="pxb-institution-stats">
          <span>
            公开课：<b>{institution.openCourseCount ?? 0}</b>
          </span>
          <span>
            内训课：<b>{institution.innerCourseCount ?? 0}</b>
          </span>
          <span>
            人气：<b>{institution.viewCount ?? 0}</b>
          </span>
          <span>
            机构评论：
            {institution.commentCount > 0 ? (
              <a href={commentHref} target="_blank" rel="noopener noreferrer">
                <b>{institution.commentCount}条</b>
              </a>
            ) : (
              <b>{institution.commentCount ?? 0}条</b>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
