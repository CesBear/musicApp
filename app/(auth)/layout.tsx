export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Isolates auth routes from the root body's flex-col layout.
  // The login stage uses position:fixed internally, but this wrapper
  // ensures the document scroll context is clean.
  return <>{children}</>
}
