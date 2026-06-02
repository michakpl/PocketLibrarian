export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white print:m-0">
      {children}
    </div>
  )
}
