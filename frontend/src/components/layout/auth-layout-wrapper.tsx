export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-6">
        {/* TODO: Logo */}
        {children}
      </div>
    </div>
  );
}
