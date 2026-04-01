'use client';

import { useAuthOwl } from './auth-owl-context';

const EYE_POSITIONS: Record<string, { lx: number; ly: number; rx: number; ry: number }> = {
  none:    { lx: 0, ly: 0, rx: 0, ry: 0 },
  phone:   { lx: 4, ly: -1, rx: 4, ry: -1 },
  code:    { lx: 5, ly: 1, rx: 5, ry: 1 },
  password:{ lx: 0, ly: 0, rx: 0, ry: 0 },
  confirm: { lx: 0, ly: 0, rx: 0, ry: 0 }
};

export function InteractiveOwl() {
  const { focusTarget } = useAuthOwl();
  const pos = EYE_POSITIONS[focusTarget] || EYE_POSITIONS.none;
  const isPassword = focusTarget === 'password' || focusTarget === 'confirm';

  return (
    <svg
      width='200'
      height='200'
      viewBox='0 0 200 200'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='drop-shadow-xl'
    >
      <style>{`
        @keyframes blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.05); }
        }
        .owl-eye-group {
          animation: blink 3.5s ease-in-out infinite;
          transform-origin: center;
        }
        .owl-eye-group-r {
          animation: blink 3.5s ease-in-out infinite;
          animation-delay: 0.1s;
          transform-origin: center;
        }
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .owl-body {
          animation: wave 4s ease-in-out infinite;
        }
        .owl-wing-left {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: 55px 110px;
        }
        .owl-wing-right {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: 145px 110px;
        }
        .owl-wing-left.cover {
          transform: rotate(45deg) translate(15px, -40px);
        }
        .owl-wing-right.cover {
          transform: rotate(-45deg) translate(-15px, -40px);
        }
        .owl-pupil {
          transition: transform 0.3s ease-out;
        }
      `}</style>

      <g className='owl-body'>
        {/* 身体 */}
        <ellipse cx='100' cy='140' rx='55' ry='45' fill='white' opacity='0.15' />

        {/* 头部 */}
        <circle cx='100' cy='85' r='55' fill='white' opacity='0.2' />

        {/* 耳朵 */}
        <polygon points='55,40 72,62 42,62' fill='white' opacity='0.25' />
        <polygon points='145,40 128,62 158,62' fill='white' opacity='0.25' />
        <polygon points='58,44 70,60 48,60' fill='white' opacity='0.15' />
        <polygon points='142,44 130,60 152,60' fill='white' opacity='0.15' />

        {/* 左眼 */}
        <g className='owl-eye-group' style={{ transformOrigin: '78px 82px' }}>
          <circle cx='78' cy='82' r='22' fill='white' opacity='0.92' />
          <circle cx='78' cy='82' r='20' fill='white' />
          <g
            className='owl-pupil'
            style={{ transform: `translate(${pos.lx}px, ${pos.ly}px)` }}
          >
            <circle cx='78' cy='84' r='11' fill='#1e293b' />
            <circle cx='74' cy='80' r='4' fill='white' opacity='0.9' />
            <circle cx='82' cy='86' r='2' fill='white' opacity='0.5' />
          </g>
        </g>

        {/* 右眼 */}
        <g className='owl-eye-group-r' style={{ transformOrigin: '122px 82px' }}>
          <circle cx='122' cy='82' r='22' fill='white' opacity='0.92' />
          <circle cx='122' cy='82' r='20' fill='white' />
          <g
            className='owl-pupil'
            style={{ transform: `translate(${pos.rx}px, ${pos.ry}px)` }}
          >
            <circle cx='122' cy='84' r='11' fill='#1e293b' />
            <circle cx='118' cy='80' r='4' fill='white' opacity='0.9' />
            <circle cx='126' cy='86' r='2' fill='white' opacity='0.5' />
          </g>
        </g>

        {/* 嘴巴 */}
        <path d='M94,103 Q100,110 106,103' fill='#f59e0b' />
        <path d='M96,103 Q100,107 104,103' fill='#d97706' />

        {/* 腮红 */}
        <circle cx='55' cy='96' r='9' fill='#fda4af' opacity='0.35' />
        <circle cx='145' cy='96' r='9' fill='#fda4af' opacity='0.35' />

        {/* 翅膀（密码时捂眼） */}
        <path
          className={`owl-wing-left ${isPassword ? 'cover' : ''}`}
          d='M35,110 Q30,90 45,80 Q55,95 50,115 Q42,120 35,110Z'
          fill='white'
          opacity='0.3'
        />
        <path
          className={`owl-wing-right ${isPassword ? 'cover' : ''}`}
          d='M165,110 Q170,90 155,80 Q145,95 150,115 Q158,120 165,110Z'
          fill='white'
          opacity='0.3'
        />

        {/* 脚 */}
        <ellipse cx='85' cy='178' rx='12' ry='5' fill='#f59e0b' opacity='0.6' />
        <ellipse cx='115' cy='178' rx='12' ry='5' fill='#f59e0b' opacity='0.6' />
      </g>
    </svg>
  );
}
