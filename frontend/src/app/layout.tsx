/**
 * 根 layout — 仅透传 children，由 [locale]/layout.tsx 提供 html/body 与全局样式。
 *
 * @see https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
