export function Card({ children, className = "" }: any) {
  return <div className={`bg-white shadow rounded ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }: any) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
